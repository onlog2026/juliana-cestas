import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { TENANT_ID } from "@/lib/tenant";

export type CustomerOrderRow = {
  id: string;
  number: number;
  status: string;
  total_cents: number;
  delivery_date: string;
  delivery_slot_start: string;
  recipient_name: string;
  created_at: string;
};

/**
 * Encontra os pedidos do cliente logado. Se ele já tinha pedido como
 * convidado com o mesmo e-mail antes de criar conta, religa esses pedidos à
 * conta (auth_user_id) na primeira visita.
 */
export async function getCustomerOrders(userId: string, userEmail: string | null): Promise<CustomerOrderRow[]> {
  const admin = createAdminClient();

  let { data: customer } = await admin
    .from("customers")
    .select("id")
    .eq("auth_user_id", userId)
    .maybeSingle();

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

  if (!customer) return [];

  const { data: orders } = await admin
    .from("orders")
    .select("id, number, status, total_cents, delivery_date, delivery_slot_start, recipient_name, created_at")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  return orders ?? [];
}

/** Detalhe de um pedido, só se ele pertencer ao cliente logado (userId). */
export async function getCustomerOrderDetail(userId: string, orderId: string) {
  const admin = createAdminClient();

  const { data: customer } = await admin
    .from("customers")
    .select("id")
    .eq("auth_user_id", userId)
    .maybeSingle();
  if (!customer) return null;

  const { data: order, error } = await admin
    .from("orders")
    .select(
      "id, number, status, payment_status, recipient_name, delivery_type, street, address_number, complement, neighborhood, city, state, zone_name, delivery_date, delivery_slot_start, delivery_slot_end, card_template, card_recipient, card_sender, card_message, notes, subtotal_cents, addons_cents, delivery_fee_cents, total_cents, buyer_name, customer_id"
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order || order.customer_id !== customer.id) return null;

  const { data: items } = await admin
    .from("order_items")
    .select("name, unit_price_cents, qty")
    .eq("order_id", orderId);

  const { customer_id: _customerId, ...rest } = order;
  return { ...rest, items: items ?? [] };
}
