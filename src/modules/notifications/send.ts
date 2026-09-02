import "server-only";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { TENANT_ID } from "@/lib/tenant";

type NotificationType = "order_confirmed" | "out_for_delivery" | "delivered";

export async function sendOrderEmail(params: {
  orderId: string;
  type: NotificationType;
  toEmail: string | null;
  subject: string;
  html: string;
}) {
  const { orderId, type, toEmail, subject, html } = params;
  if (!toEmail) return;

  const supabase = createAdminClient();
  const apiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;

  // Sem chave/remetente configurado: registra no outbox como pendente do
  // domínio verificado, mas nunca derruba o fluxo que chamou isso (o e-mail
  // é sempre "melhor esforço" -- o pedido/status já foi gravado antes).
  if (!apiKey || !emailFrom) {
    await supabase.from("notifications").insert({
      tenant_id: TENANT_ID,
      order_id: orderId,
      type,
      to_email: toEmail,
      subject,
      html,
      status: "pending_domain",
    });
    return;
  }

  const { data: inserted } = await supabase
    .from("notifications")
    .insert({
      tenant_id: TENANT_ID,
      order_id: orderId,
      type,
      to_email: toEmail,
      subject,
      html,
      status: "pending",
    })
    .select("id")
    .single();

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: emailFrom,
      to: toEmail,
      subject,
      html,
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
