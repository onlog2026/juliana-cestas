import "server-only";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStoreProfile, getStoreWhatsapp } from "@/modules/settings/store-profile";
import { getSiteSettings } from "@/modules/settings/site-settings";
import { getSiteUrl } from "@/lib/tenant/site-url";
import { LEGACY_TENANT_ID } from "@/lib/tenant/legacy";
import { remetenteDaLoja } from "@/modules/notifications/remetente";
import { NEUTRAL_EMAIL_COLORS, type EmailColors } from "@/modules/notifications/templates/shell";
import { getWhatsappClient } from "@/modules/notifications/whatsapp-config";

// `review_invite` é o convite de avaliação (pedido ENTREGUE, migração 0030).
// `cart_recovery` é o lembrete de pedido parado em aguardando_pagamento
// (automação de carrinho abandonado, migração 0037). Os dois CHECKs do banco
// já aceitam esses valores -- sem eles aqui, o TypeScript obrigaria um cast
// em `reviews/invite.ts` e `automations/run.ts`.
// `order_paid` (pagamento confirmado) e `order_group_confirmed` (resumo do carrinho)
// entram no CHECK do banco pela migração 0050. Antes dela o registro no outbox é
// recusado, mas o e-mail SAI do mesmo jeito (ver `send`).
type OrderNotificationType =
  | "order_confirmed"
  | "order_paid"
  | "order_group_confirmed"
  | "out_for_delivery"
  | "delivered"
  | "review_invite"
  | "cart_recovery";
type TicketNotificationType = "ticket_created" | "ticket_reply";

/** Identidade da loja usada nos e-mails transacionais (assunto, cabeçalho, resposta). */
export type EmailBrand = {
  storeName: string;
  logoUrl: string | null;
  siteUrl: string;
  replyTo: string | null;
  /** WhatsApp da loja (só dígitos), para o botão e o rodapé dos e-mails. */
  whatsapp?: string | null;
  /** Cores do e-mail (paleta do modelo instalado). Ausente = cores de sempre (só a loja original). */
  colors?: EmailColors;
};

/** Cores gravadas no modelo instalado; sem modelo, a loja original segue com as de sempre e as demais com as neutras. */
async function getEmailColors(tenantId: string): Promise<EmailColors | undefined> {
  try {
    const { data } = await createAdminClient().from("store_theme").select("layout").eq("tenant_id", tenantId).maybeSingle();
    const c = (data?.layout as { cores_email?: Partial<EmailColors> } | null)?.cores_email;
    if (c && typeof c.band === "string" && typeof c.primary === "string" && typeof c.accent === "string" && typeof c.page === "string" && typeof c.line === "string") {
      return c as EmailColors;
    }
  } catch {
    /* sem cores gravadas */
  }
  return tenantId === LEGACY_TENANT_ID ? undefined : NEUTRAL_EMAIL_COLORS;
}

/**
 * Monta a marca do e-mail a partir do que a lojista cadastrou.
 * Nunca inventa nome: sem `business_name`, `storeName` fica vazio e os
 * templates montam assunto/cabeçalho sem marca.
 */
export async function getEmailBrand(tenantId: string): Promise<EmailBrand> {
  const [profile, site, siteUrl, colors] = await Promise.all([
    getStoreProfile(tenantId),
    getSiteSettings(tenantId),
    getSiteUrl(tenantId),
    getEmailColors(tenantId),
  ]);
  return {
    storeName: profile.businessName?.trim() || "",
    // Logo do e-mail = PNG transparente gerado em /email-logo (a logo do site é WebP,
    // que o Gmail desenha com fundo preto). Sem endereço do site, cai no nome em texto.
    logoUrl: site.logoHeaderUrl && siteUrl ? `${siteUrl}/email-logo` : null,
    siteUrl,
    replyTo: profile.email?.trim() || null,
    whatsapp: (profile.phone ?? "").replace(/\D/g, "") || null,
    colors,
  };
}

async function send(tenantId: string, params: {
  type: OrderNotificationType | TicketNotificationType;
  orderId?: string;
  ticketId?: string;
  toEmail: string | null;
  subject: string;
  html: string;
  /** Versão em texto puro (melhora a entrega e a leitura em clientes sem HTML). */
  text?: string;
}) {
  const { type, orderId, ticketId, toEmail, subject, html, text } = params;
  if (!toEmail) return;

  const supabase = createAdminClient();
  const apiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;
  const row = {
    tenant_id: tenantId,
    order_id: orderId ?? null,
    ticket_id: ticketId ?? null,
    type,
    to_email: toEmail,
    subject,
    html,
  };

  // Sem chave/remetente configurado: registra no outbox como pendente do
  // domínio verificado, mas nunca derruba o fluxo que chamou isso (o pedido
  // ou o chamado já foi gravado antes -- e-mail é sempre "melhor esforço").
  if (!apiKey || !emailFrom) {
    await supabase.from("notifications").insert({ ...row, status: "pending_domain" });
    return;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("notifications")
    .insert({ ...row, status: "pending" })
    .select("id")
    .single();
  // O registro no outbox é acessório: se o banco recusar (ex.: tipo novo antes da
  // migração 0050), o e-mail sai mesmo assim -- perder o aviso ao cliente por causa
  // do livro-caixa seria pior que ficar sem o registro.
  if (insertError) console.error("[notifications] outbox recusou a linha:", insertError.message);

  try {
    // Resposta do cliente vai pro e-mail da lojista, não pro remetente global.
    const brand = await getEmailBrand(tenantId);
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: remetenteDaLoja(emailFrom, brand.storeName, tenantId === LEGACY_TENANT_ID),
      to: toEmail,
      subject,
      html,
      text,
      replyTo: brand.replyTo ?? undefined,
    });
    if (error) throw new Error(error.message);
    if (inserted) {
      await supabase
        .from("notifications")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", inserted.id);
    }
  } catch (err) {
    if (inserted) {
      await supabase
        .from("notifications")
        .update({ status: "failed", error: err instanceof Error ? err.message : "erro desconhecido" })
        .eq("id", inserted.id);
    }
  }
}

export async function sendOrderEmail(
  tenantId: string,
  params: {
    orderId: string;
    type: OrderNotificationType;
    toEmail: string | null;
    subject: string;
    html: string;
    text?: string;
  }
) {
  await send(tenantId, { ...params, orderId: params.orderId });
}

export async function sendTicketEmail(
  tenantId: string,
  params: {
    ticketId: string;
    type: TicketNotificationType;
    toEmail: string | null;
    subject: string;
    html: string;
  }
) {
  await send(tenantId, { ...params, ticketId: params.ticketId });
}

/**
 * Aviso de "pedido novo" pro WhatsApp da loja. Best-effort, igual ao e-mail:
 * nunca lança, sempre registra a tentativa no outbox (`notifications`,
 * canal `whatsapp`).
 *
 * Duas situações "config pendente" (não é erro, é config faltando) caem no
 * mesmo caminho: sem WhatsApp cadastrado na loja (`getStoreWhatsapp` vazio)
 * OU sem a Evolution API configurada (`getWhatsappClient` null). Nos dois
 * casos grava `pending_domain` e volta -- o pedido do cliente nunca sente.
 *
 * Idempotência: a migração 0045 cria um índice único (order_id) só para
 * `type = 'store_new_order'`. Se este pedido já tem um aviso registrado
 * (reentrega pela mesma idempotencyKey), o insert é recusado em silêncio e
 * a função não reenvia.
 */
export async function sendStoreWhatsapp(
  tenantId: string,
  params: { orderId: string; orderNumber: number; text: string }
) {
  const { orderId, orderNumber, text } = params;
  const supabase = createAdminClient();
  const toPhone = await getStoreWhatsapp(tenantId);
  const client = getWhatsappClient();

  const row = {
    tenant_id: tenantId,
    order_id: orderId,
    type: "store_new_order",
    channel: "whatsapp",
    to_phone: toPhone || null,
    subject: `Novo pedido #${orderNumber}`,
    html: text,
  };

  if (!toPhone || !client) {
    await supabase.from("notifications").insert({ ...row, status: "pending_domain" });
    return;
  }

  const { data: inserted } = await supabase
    .from("notifications")
    .insert({ ...row, status: "pending" })
    .select("id")
    .single();
  // Índice único recusou (já existe aviso para este pedido): não reenvia.
  if (!inserted) return;

  try {
    await client.sendText(toPhone, text);
    await supabase
      .from("notifications")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", inserted.id);
  } catch (err) {
    await supabase
      .from("notifications")
      .update({ status: "failed", error: err instanceof Error ? err.message : "erro desconhecido" })
      .eq("id", inserted.id);
  }
}
