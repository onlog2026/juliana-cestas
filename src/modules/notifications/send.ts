import "server-only";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStoreProfile } from "@/modules/settings/store-profile";
import { getSiteSettings } from "@/modules/settings/site-settings";

type OrderNotificationType = "order_confirmed" | "out_for_delivery" | "delivered";
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
