import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { TENANT_ID } from "@/lib/tenant";

export type TicketCategory = "pedido" | "entrega" | "pagamento" | "bug" | "feedback";
export type TicketStatus = "aberto" | "em_andamento" | "resolvido" | "reaberto";

export type TicketRow = {
  id: string;
  buyer_name: string;
  buyer_email: string;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  order_id: string | null;
  created_at: string;
  last_message_at: string;
};

export type TicketMessage = {
  id: string;
  sender: "customer" | "staff";
  sender_name: string | null;
  body: string;
  attachment_url: string | null;
  created_at: string;
};

const TICKET_COLUMNS = "id, buyer_name, buyer_email, subject, category, status, order_id, created_at, last_message_at";

/** Resolve o customer do usuário logado, religando por e-mail se necessário (mesmo padrão de customers/service.ts). */
async function resolveCustomerId(userId: string, userEmail: string | null): Promise<string | null> {
  const admin = createAdminClient();
  let { data: customer } = await admin.from("customers").select("id").eq("auth_user_id", userId).maybeSingle();

  if (!customer && userEmail) {
    const { data: unlinked } = await admin
      .from("customers")
      .select("id")
      .eq("tenant_id", TENANT_ID)
      .ilike("email", userEmail)
      .is("auth_user_id", null)
      .maybeSingle();
    if (unlinked) {
      await admin.from("customers").update({ auth_user_id: userId }).eq("id", unlinked.id);
      customer = unlinked;
    }
  }

  return customer?.id ?? null;
}

export async function getCustomerTickets(userId: string, userEmail: string | null): Promise<TicketRow[]> {
  const admin = createAdminClient();
  const customerId = await resolveCustomerId(userId, userEmail);

  // Sem customer vinculado ainda, mas pode ter aberto chamado só com e-mail
  // (antes de logar) -- busca pelos dois jeitos, sem duplicar.
  const query = admin
    .from("support_tickets")
    .select(TICKET_COLUMNS)
    .eq("tenant_id", TENANT_ID)
    .order("last_message_at", { ascending: false });

  const { data } = customerId
    ? await query.or(`customer_id.eq.${customerId},buyer_email.ilike.${userEmail ?? ""}`)
    : userEmail
      ? await query.ilike("buyer_email", userEmail)
      : { data: [] };

  return (data ?? []) as TicketRow[];
}

export async function getCustomerTicketDetail(
  userId: string,
  userEmail: string | null,
  ticketId: string
): Promise<{ ticket: TicketRow; messages: TicketMessage[] } | null> {
  const admin = createAdminClient();
  const customerId = await resolveCustomerId(userId, userEmail);

  const { data: ticket } = await admin
    .from("support_tickets")
    .select(`${TICKET_COLUMNS}, customer_id`)
    .eq("id", ticketId)
    .eq("tenant_id", TENANT_ID)
    .maybeSingle();

  if (!ticket) return null;
  const owns =
    (customerId && ticket.customer_id === customerId) ||
    (userEmail && ticket.buyer_email.toLowerCase() === userEmail.toLowerCase());
  if (!owns) return null;

  const { data: messages } = await admin
    .from("support_messages")
    .select("id, sender, sender_name, body, attachment_url, created_at")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  const { customer_id: _customerId, ...rest } = ticket;
  return { ticket: rest as TicketRow, messages: (messages ?? []) as TicketMessage[] };
}

export async function getAllTicketsAdmin(filters?: { status?: string }): Promise<TicketRow[]> {
  const admin = createAdminClient();
  let query = admin
    .from("support_tickets")
    .select(TICKET_COLUMNS)
    .eq("tenant_id", TENANT_ID)
    .order("last_message_at", { ascending: false })
    .limit(200);

  if (filters?.status) query = query.eq("status", filters.status);

  const { data } = await query;
  return (data ?? []) as TicketRow[];
}

export async function getTicketDetailAdmin(
  ticketId: string
): Promise<{ ticket: TicketRow; messages: TicketMessage[] } | null> {
  const admin = createAdminClient();
  const { data: ticket } = await admin
    .from("support_tickets")
    .select(TICKET_COLUMNS)
    .eq("id", ticketId)
    .eq("tenant_id", TENANT_ID)
    .maybeSingle();
  if (!ticket) return null;

  const { data: messages } = await admin
    .from("support_messages")
    .select("id, sender, sender_name, body, attachment_url, created_at")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  return { ticket: ticket as TicketRow, messages: (messages ?? []) as TicketMessage[] };
}
