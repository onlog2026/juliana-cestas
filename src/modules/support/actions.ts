"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TENANT_ID } from "@/lib/tenant";
import { requireStaff } from "@/lib/auth/require-staff";
import { sendTicketEmail } from "@/modules/notifications/send";
import { ticketCreatedEmail } from "@/modules/notifications/templates/ticket-created";
import { ticketReplyEmail } from "@/modules/notifications/templates/ticket-reply";
import type { TicketCategory } from "@/modules/support/service";

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "";

async function requireCustomerSession() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { id: user.id, email: user.email ?? null, name: (user.user_metadata?.name as string | undefined) ?? null };
}

export async function createTicket(input: {
  subject: string;
  category: TicketCategory;
  orderId: string | null;
  body: string;
  attachmentUrl: string;
}): Promise<{ ok: true; ticketId: string } | { ok: false; error: string }> {
  const session = await requireCustomerSession();
  if (!session || !session.email) return { ok: false, error: "Faça login para abrir um chamado." };
  if (!input.subject.trim()) return { ok: false, error: "Escreva um assunto." };
  if (!input.body.trim()) return { ok: false, error: "Escreva sua mensagem." };

  const admin = createAdminClient();
  const { data: customer } = await admin
    .from("customers")
    .select("id, name")
    .eq("auth_user_id", session.id)
    .maybeSingle();

  const buyerName = customer?.name ?? session.name ?? session.email.split("@")[0];

  const { data: ticket, error } = await admin
    .from("support_tickets")
    .insert({
      tenant_id: TENANT_ID,
      customer_id: customer?.id ?? null,
      buyer_email: session.email,
      buyer_name: buyerName,
      subject: input.subject.trim(),
      category: input.category,
      order_id: input.orderId,
    })
    .select("id")
    .single();

  if (error || !ticket) return { ok: false, error: "Não foi possível abrir o chamado." };

  await admin.from("support_messages").insert({
    tenant_id: TENANT_ID,
    ticket_id: ticket.id,
    sender: "customer",
    sender_name: buyerName,
    body: input.body.trim(),
    attachment_url: input.attachmentUrl || null,
  });

  const { subject, html } = ticketCreatedEmail({
    buyerName,
    subject: input.subject.trim(),
    ticketUrl: `${siteUrl()}/conta/atendimento/${ticket.id}`,
  });
  await sendTicketEmail({ ticketId: ticket.id, type: "ticket_created", toEmail: session.email, subject, html });

  revalidatePath("/conta/atendimento");
  return { ok: true, ticketId: ticket.id };
}

export async function replyAsCustomer(input: {
  ticketId: string;
  body: string;
  attachmentUrl: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireCustomerSession();
  if (!session || !session.email) return { ok: false, error: "Faça login pra responder." };
  if (!input.body.trim()) return { ok: false, error: "Escreva sua mensagem." };

  const admin = createAdminClient();
  const { data: ticket } = await admin
    .from("support_tickets")
    .select("id, buyer_email, customer_id, status")
    .eq("id", input.ticketId)
    .eq("tenant_id", TENANT_ID)
    .maybeSingle();

  if (!ticket) return { ok: false, error: "Chamado não encontrado." };
  const { data: customer } = await admin
    .from("customers")
    .select("id, name")
    .eq("auth_user_id", session.id)
    .maybeSingle();
  const owns = (customer && ticket.customer_id === customer.id) || ticket.buyer_email.toLowerCase() === session.email.toLowerCase();
  if (!owns) return { ok: false, error: "Chamado não encontrado." };

  await admin.from("support_messages").insert({
    tenant_id: TENANT_ID,
    ticket_id: ticket.id,
    sender: "customer",
    sender_name: customer?.name ?? session.name,
    body: input.body.trim(),
    attachment_url: input.attachmentUrl || null,
  });

  await admin
    .from("support_tickets")
    .update({
      last_message_at: new Date().toISOString(),
      status: ticket.status === "resolvido" ? "reaberto" : ticket.status,
    })
    .eq("id", ticket.id);

  revalidatePath(`/conta/atendimento/${ticket.id}`);
  revalidatePath("/admin/atendimento");
  return { ok: true };
}

export async function replyAsStaff(input: {
  ticketId: string;
  body: string;
  attachmentUrl: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const staff = await requireStaff();
  if (!input.body.trim()) return { ok: false, error: "Escreva sua mensagem." };

  const admin = createAdminClient();
  const { data: ticket } = await admin
    .from("support_tickets")
    .select("id, buyer_email, buyer_name, subject, status")
    .eq("id", input.ticketId)
    .eq("tenant_id", TENANT_ID)
    .maybeSingle();
  if (!ticket) return { ok: false, error: "Chamado não encontrado." };

  await admin.from("support_messages").insert({
    tenant_id: TENANT_ID,
    ticket_id: ticket.id,
    sender: "staff",
    sender_name: staff.name ?? "Juliana Cestas",
    body: input.body.trim(),
    attachment_url: input.attachmentUrl || null,
  });

  await admin
    .from("support_tickets")
    .update({
      last_message_at: new Date().toISOString(),
      status: ticket.status === "aberto" ? "em_andamento" : ticket.status,
    })
    .eq("id", ticket.id);

  const { subject, html } = ticketReplyEmail({
    buyerName: ticket.buyer_name,
    subject: ticket.subject,
    replyBody: input.body.trim(),
    ticketUrl: `${siteUrl()}/conta/atendimento/${ticket.id}`,
  });
  await sendTicketEmail({ ticketId: ticket.id, type: "ticket_reply", toEmail: ticket.buyer_email, subject, html });

  revalidatePath(`/admin/atendimento/${ticket.id}`);
  revalidatePath("/admin/atendimento");
  return { ok: true };
}

export async function updateTicketStatusAdmin(
  ticketId: string,
  status: "aberto" | "em_andamento" | "resolvido" | "reaberto"
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();

  const admin = createAdminClient();
  const { error } = await admin
    .from("support_tickets")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", ticketId)
    .eq("tenant_id", TENANT_ID);
  if (error) return { ok: false, error: "Não foi possível mudar o status." };

  revalidatePath(`/admin/atendimento/${ticketId}`);
  revalidatePath("/admin/atendimento");
  return { ok: true };
}
