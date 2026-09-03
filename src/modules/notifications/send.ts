import "server-only";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { TENANT_ID } from "@/lib/tenant";

type OrderNotificationType = "order_confirmed" | "out_for_delivery" | "delivered";
type TicketNotificationType = "ticket_created" | "ticket_reply";

async function send(params: {
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
  const emailFrom = process.env.EMAIL_FROM;
  const row = {
    tenant_id: TENANT_ID,
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
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({ from: emailFrom, to: toEmail, subject, html });
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

export async function sendOrderEmail(params: {
  orderId: string;
  type: OrderNotificationType;
  toEmail: string | null;
  subject: string;
  html: string;
}) {
  await send({ ...params, orderId: params.orderId });
}

export async function sendTicketEmail(params: {
  ticketId: string;
  type: TicketNotificationType;
  toEmail: string | null;
  subject: string;
  html: string;
}) {
  await send({ ...params, ticketId: params.ticketId });
}
