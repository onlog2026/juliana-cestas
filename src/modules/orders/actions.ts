"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { TENANT_ID } from "@/lib/tenant";
import { requireStaff } from "@/lib/auth/require-staff";
import { sendOrderEmail } from "@/modules/notifications/send";
import { outForDeliveryEmail } from "@/modules/notifications/templates/out-for-delivery";
import { deliveredEmail } from "@/modules/notifications/templates/delivered";

export type AdminOrderRow = {
  id: string;
  number: number;
  status: string;
  payment_status: string;
  buyer_name: string;
  buyer_phone: string;
  recipient_name: string;
  delivery_type: "delivery" | "pickup";
  delivery_date: string;
  delivery_slot_start: string;
  delivery_slot_end: string;
  total_cents: number;
  created_at: string;
};

export async function listOrders(filters?: { status?: string; date?: string }): Promise<AdminOrderRow[]> {
  await requireStaff();
  const admin = createAdminClient();
  let query = admin
    .from("orders")
    .select(
      "id, number, status, payment_status, buyer_name, buyer_phone, recipient_name, delivery_type, delivery_date, delivery_slot_start, delivery_slot_end, total_cents, created_at"
    )
    .eq("tenant_id", TENANT_ID)
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.date) query = query.eq("delivery_date", filters.date);

  const { data, error } = await query;
  if (error) return [];
  return data ?? [];
}

export type AdminOrderDetail = AdminOrderRow & {
  buyer_email: string | null;
  buyer_cpf: string;
  recipient_phone: string | null;
  street: string | null;
  address_number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zone_name: string | null;
  card_template: string;
  card_recipient: string;
  card_sender: string | null;
  card_message: string;
  notes: string | null;
  subtotal_cents: number;
  addons_cents: number;
  delivery_fee_cents: number;
  discount_cents: number;
  coupon_code: string | null;
  items: { name: string; unit_price_cents: number; qty: number }[];
  events: { id: string; type: string; actor: string; created_at: string; payload: unknown }[];
};

export async function getOrderDetail(orderId: string): Promise<AdminOrderDetail | null> {
  await requireStaff();
  const admin = createAdminClient();

  const { data: order, error } = await admin
    .from("orders")
    .select(
      "id, number, status, payment_status, buyer_name, buyer_phone, buyer_email, buyer_cpf, recipient_name, recipient_phone, delivery_type, street, address_number, complement, neighborhood, city, state, zone_name, delivery_date, delivery_slot_start, delivery_slot_end, card_template, card_recipient, card_sender, card_message, notes, subtotal_cents, addons_cents, delivery_fee_cents, discount_cents, coupon_code, total_cents, created_at"
    )
    .eq("id", orderId)
    .eq("tenant_id", TENANT_ID)
    .maybeSingle();

  if (error || !order) return null;

  const { data: items } = await admin
    .from("order_items")
    .select("name, unit_price_cents, qty")
    .eq("order_id", orderId);

  const { data: events } = await admin
    .from("order_events")
    .select("id, type, actor, created_at, payload")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  return { ...order, items: items ?? [], events: events ?? [] };
}

const NEXT_STATUS: Record<string, string | undefined> = {
  pago: "em_preparacao",
  em_preparacao: "pronto",
  pronto: "saiu_para_entrega",
  saiu_para_entrega: "entregue",
};

export async function advanceOrderStatus(
  orderId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const staff = await requireStaff();
  const admin = createAdminClient();

  const { data: order, error: fetchError } = await admin
    .from("orders")
    .select(
      "id, number, status, buyer_name, buyer_email, recipient_name, delivery_type, street, address_number, complement, neighborhood, zone_name, public_token_hash"
    )
    .eq("id", orderId)
    .eq("tenant_id", TENANT_ID)
    .maybeSingle();

  if (fetchError || !order) return { ok: false, error: "Pedido não encontrado." };

  const nextStatus = NEXT_STATUS[order.status];
  if (!nextStatus) return { ok: false, error: "Esse pedido não pode avançar de status." };

  const { error: updateError } = await admin
    .from("orders")
    .update({ status: nextStatus })
    .eq("id", orderId);
  if (updateError) return { ok: false, error: "Falha ao atualizar o status." };

  await admin.from("order_events").insert({
    tenant_id: TENANT_ID,
    order_id: orderId,
    type: `status_${nextStatus}`,
    from_status: order.status,
    to_status: nextStatus,
    actor: "admin",
    actor_id: staff.id,
    payload: {},
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  if (nextStatus === "saiu_para_entrega") {
    const addressLine =
      order.delivery_type === "pickup"
        ? "Retirada na loja"
        : [order.street, order.address_number, order.complement].filter(Boolean).join(", ") +
          (order.neighborhood ? ` — ${order.neighborhood}` : "") +
          (order.zone_name ? ` (${order.zone_name})` : "");
    const { subject, html } = outForDeliveryEmail({
      orderNumber: order.number,
      buyerName: order.buyer_name,
      recipientName: order.recipient_name,
      addressLine,
      orderUrl: `${siteUrl}/pedido/${order.id}`,
    });
    await sendOrderEmail({ orderId, type: "out_for_delivery", toEmail: order.buyer_email, subject, html });
  } else if (nextStatus === "entregue") {
    const { subject, html } = deliveredEmail({ orderNumber: order.number, buyerName: order.buyer_name });
    await sendOrderEmail({ orderId, type: "delivered", toEmail: order.buyer_email, subject, html });
  }

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin/entregas");
  return { ok: true };
}

/**
 * Ponte até o pagamento Asaas existir de verdade (Fase 4 do roadmap): hoje
 * não há nenhum jeito automático de um pedido virar "pago", então o admin
 * confirma manualmente depois de ver o Pix/link pago por fora.
 */
export async function markOrderPaid(
  orderId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const staff = await requireStaff();
  const admin = createAdminClient();

  const { data: order, error: fetchError } = await admin
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .eq("tenant_id", TENANT_ID)
    .maybeSingle();

  if (fetchError || !order) return { ok: false, error: "Pedido não encontrado." };
  if (order.status !== "aguardando_pagamento" && order.status !== "novo") {
    return { ok: false, error: "Esse pedido já não está aguardando pagamento." };
  }

  const { error: updateError } = await admin
    .from("orders")
    .update({ status: "pago", payment_status: "paid", paid_at: new Date().toISOString() })
    .eq("id", orderId);
  if (updateError) return { ok: false, error: "Falha ao marcar como pago." };

  await admin.from("order_events").insert({
    tenant_id: TENANT_ID,
    order_id: orderId,
    type: "status_pago",
    from_status: order.status,
    to_status: "pago",
    actor: "admin",
    actor_id: staff.id,
    payload: { manual: true },
  });

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin");
  return { ok: true };
}

const NON_CANCELABLE = new Set(["entregue", "cancelado", "reembolsado"]);

export async function cancelOrder(
  orderId: string,
  reason: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const staff = await requireStaff();
  const admin = createAdminClient();

  const { data: order, error: fetchError } = await admin
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .eq("tenant_id", TENANT_ID)
    .maybeSingle();

  if (fetchError || !order) return { ok: false, error: "Pedido não encontrado." };
  if (NON_CANCELABLE.has(order.status)) {
    return { ok: false, error: "Esse pedido não pode mais ser cancelado." };
  }

  const { error: updateError } = await admin
    .from("orders")
    .update({ status: "cancelado" })
    .eq("id", orderId);
  if (updateError) return { ok: false, error: "Falha ao cancelar o pedido." };

  await admin.from("order_events").insert({
    tenant_id: TENANT_ID,
    order_id: orderId,
    type: "status_cancelado",
    from_status: order.status,
    to_status: "cancelado",
    actor: "admin",
    actor_id: staff.id,
    payload: { reason: reason || null },
  });

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin/entregas");
  return { ok: true };
}
