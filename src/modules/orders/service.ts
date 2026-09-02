import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyToken } from "@/modules/orders/token";

export type OrderWithItems = {
  id: string;
  number: number;
  status: string;
  payment_status: string;
  recipient_name: string;
  delivery_type: "delivery" | "pickup";
  street: string | null;
  address_number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zone_name: string | null;
  delivery_date: string;
  delivery_slot_start: string;
  delivery_slot_end: string;
  card_template: string;
  card_recipient: string;
  card_sender: string | null;
  card_message: string;
  notes: string | null;
  subtotal_cents: number;
  addons_cents: number;
  delivery_fee_cents: number;
  total_cents: number;
  buyer_name: string;
  items: { name: string; unit_price_cents: number; qty: number }[];
};

export async function getOrderByToken(
  orderId: string,
  token: string
): Promise<OrderWithItems | null> {
  const supabase = createAdminClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, number, status, payment_status, public_token_hash, recipient_name, delivery_type, street, address_number, complement, neighborhood, city, state, zone_name, delivery_date, delivery_slot_start, delivery_slot_end, card_template, card_recipient, card_sender, card_message, notes, subtotal_cents, addons_cents, delivery_fee_cents, total_cents, buyer_name"
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order) return null;
  if (!verifyToken(token, order.public_token_hash)) return null;

  const { data: items } = await supabase
    .from("order_items")
    .select("name, unit_price_cents, qty")
    .eq("order_id", orderId);

  const { public_token_hash: _hash, ...rest } = order;
  return { ...rest, items: items ?? [] };
}
