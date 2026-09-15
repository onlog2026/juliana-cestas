import "server-only";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStoreProfile, getStoreWhatsapp } from "@/modules/settings/store-profile";
import { getSiteSettings } from "@/modules/settings/site-settings";
import { getWhatsappClient } from "@/modules/notifications/whatsapp-config";

// `review_invite` é o convite de avaliação (pedido ENTREGUE, migração 0030).
// `cart_recovery` é o lembrete de pedido parado em aguardando_pagamento
// (automação de carrinho abandonado, migração 0037). Os dois CHECKs do banco
// já aceitam esses valores -- sem eles aqui, o TypeScript obrigaria um cast
// em `reviews/invite.ts` e `automations/run.ts`.
type OrderNotificationType =
  | "order_confirmed"
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
};

/**
 * Monta a marca do e-mail a partir do que a lojista cadastrou.
 * Nunca inventa nome: sem `business_name`, `storeName` fica vazio e os
 * templates montam assunto/cabeçalho sem marca.
 */
export async function getEmailBrand(tenantId: string): Promise<EmailBrand> {
  const [profile, site] = await Promise.all([getStoreProfile(tenantId), getSiteSettings(tenantId)]);
  return {
    storeName: profile.businessName?.trim() || "",
    logoUrl: site.logoHeaderUrl || null,
    // TODO F7: virá de tenant_domains
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "",
    replyTo: profile.email?.trim() || null,
  };
}

async function send(tenantId: string, params: {
  type: OrderNotificationType | TicketNotificationType;
  orderId?: string;
  ticketId?: string;
  toEmail: string | null;
  subject: string;
  html: string;
}) {
  const { type, orderId, ticketId, toEmail, subject, html } = params;
  if (!toEmail) return;

  const supabase = createAdminClient();
  const apiKey = process.env.RESEND_API_KEY;
  // TODO F2: remetente por loja depende de domínio verificado na Resend.
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

  const { data: inserted } = await supabase
    .from("notifications")
    .insert({ ...row, status: "pending" })
    .select("id")
    .single();

  try {
    // Resposta do cliente vai pro e-mail da lojista, não pro remetente global.
    const brand = await getEmailBrand(tenantId);
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: emailFrom,
      to: toEmail,
      subject,
      html,
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
