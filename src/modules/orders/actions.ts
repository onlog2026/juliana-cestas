"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/require-staff";
import { sendOrderEmail, getEmailBrand } from "@/modules/notifications/send";
import { outForDeliveryEmail } from "@/modules/notifications/templates/out-for-delivery";
import { deliveredEmail } from "@/modules/notifications/templates/delivered";
import { createReviewInvite } from "@/modules/reviews/invite";
import { dataDeEntregaValida, podeAlterarPedido } from "@/modules/orders/rules";

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
  const staff = await requireStaff();
  const admin = createAdminClient();
  let query = admin
    .from("orders")
    .select(
      "id, number, status, payment_status, buyer_name, buyer_phone, recipient_name, delivery_type, delivery_date, delivery_slot_start, delivery_slot_end, total_cents, created_at"
    )
    .eq("tenant_id", staff.tenantId)
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
  const staff = await requireStaff();
  const admin = createAdminClient();

  const { data: order, error } = await admin
    .from("orders")
    .select(
      "id, number, status, payment_status, buyer_name, buyer_phone, buyer_email, buyer_cpf, recipient_name, recipient_phone, delivery_type, street, address_number, complement, neighborhood, city, state, zone_name, delivery_date, delivery_slot_start, delivery_slot_end, card_template, card_recipient, card_sender, card_message, notes, subtotal_cents, addons_cents, delivery_fee_cents, discount_cents, coupon_code, total_cents, created_at"
    )
    .eq("id", orderId)
    .eq("tenant_id", staff.tenantId)
    .maybeSingle();

  if (error || !order) return null;

  const { data: items } = await admin
    .from("order_items")
    .select("name, unit_price_cents, qty")
    .eq("order_id", orderId)
    .eq("tenant_id", staff.tenantId);

  const { data: events } = await admin
    .from("order_events")
    .select("id, type, actor, created_at, payload")
    .eq("order_id", orderId)
    .eq("tenant_id", staff.tenantId)
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
    .eq("tenant_id", staff.tenantId)
    .maybeSingle();

  if (fetchError || !order) return { ok: false, error: "Pedido não encontrado." };

  const nextStatus = NEXT_STATUS[order.status];
  if (!nextStatus) return { ok: false, error: "Esse pedido não pode avançar de status." };

  const { error: updateError } = await admin
    .from("orders")
    .update({ status: nextStatus })
    .eq("id", orderId)
    .eq("tenant_id", staff.tenantId);
  if (updateError) return { ok: false, error: "Falha ao atualizar o status." };

  await admin.from("order_events").insert({
    tenant_id: staff.tenantId,
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
    const brand = await getEmailBrand(staff.tenantId);
    const { subject, html } = outForDeliveryEmail({
      orderNumber: order.number,
      buyerName: order.buyer_name,
      recipientName: order.recipient_name,
      addressLine,
      orderUrl: `${siteUrl}/pedido/${order.id}`,
    }, brand);
    await sendOrderEmail(staff.tenantId, {
      orderId,
      type: "out_for_delivery",
      toEmail: order.buyer_email,
      subject,
      html,
    });
  } else if (nextStatus === "entregue") {
    const brand = await getEmailBrand(staff.tenantId);
    const { subject, html } = deliveredEmail({ orderNumber: order.number, buyerName: order.buyer_name }, brand);
    await sendOrderEmail(staff.tenantId, {
      orderId,
      type: "delivered",
      toEmail: order.buyer_email,
      subject,
      html,
    });

    // Convite de avaliação: só DEPOIS de entregue. Pedir opinião de uma cesta
    // que ainda não chegou irrita quem comprou -- e quem ouve a reclamação é
    // a lojista. `createReviewInvite` é idempotente: se o convite já foi
    // enviado para este pedido, não manda de novo.
    //
    // Falhar aqui NÃO pode desfazer a entrega, que já está gravada: o convite
    // é um extra, o status é o fato. Se der erro, fica registrado e o painel
    // de avaliações tem o botão "Enviar convites pendentes" para recuperar.
    try {
      await createReviewInvite(staff.tenantId, orderId);
    } catch (erro) {
      console.error("[orders] falha ao criar o convite de avaliação:", erro);
    }
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
    .eq("tenant_id", staff.tenantId)
    .maybeSingle();

  if (fetchError || !order) return { ok: false, error: "Pedido não encontrado." };
  if (order.status !== "aguardando_pagamento" && order.status !== "novo") {
    return { ok: false, error: "Esse pedido já não está aguardando pagamento." };
  }

  const { error: updateError } = await admin
    .from("orders")
    .update({ status: "pago", payment_status: "paid", paid_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("tenant_id", staff.tenantId);
  if (updateError) return { ok: false, error: "Falha ao marcar como pago." };

  await admin.from("order_events").insert({
    tenant_id: staff.tenantId,
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
    .eq("tenant_id", staff.tenantId)
    .maybeSingle();

  if (fetchError || !order) return { ok: false, error: "Pedido não encontrado." };
  if (NON_CANCELABLE.has(order.status)) {
    return { ok: false, error: "Esse pedido não pode mais ser cancelado." };
  }

  const { data: cancelado, error: updateError } = await admin
    .from("orders")
    .update({ status: "cancelado" })
    .eq("id", orderId)
    .eq("tenant_id", staff.tenantId)
    .select("id");
  if (updateError || !cancelado || cancelado.length === 0) {
    return { ok: false, error: "Falha ao cancelar o pedido." };
  }

  await admin.from("order_events").insert({
    tenant_id: staff.tenantId,
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

/**
 * O que dá para ALTERAR num pedido depois de criado, e o que não dá.
 *
 * Dá: quem recebe, telefone, endereço, data/horário de entrega, o texto do
 * cartãozinho e as observações -- tudo o que é logística e mensagem, corrige
 * um endereço digitado errado ou uma data que a cliente pediu para mudar.
 *
 * NÃO dá (de propósito, e por isso nem está no formulário): itens, quantidade,
 * preço e total. Mudar valor de um pedido depois de criado mexe com o que já
 * foi cobrado (ou vai ser cobrado) no Asaas e com o estoque já reservado --
 * isso precisa de uma tela própria que recalcule tudo, não de um campo solto
 * aqui. Também não dá para mudar nome/e-mail/CPF de quem comprou: é o registro
 * de quem fez a compra, o mesmo motivo por que uma nota fiscal não se edita.
 */
export type DadosPedidoInput = {
  id: string;
  recipientName: string;
  recipientPhone: string;
  street: string;
  addressNumber: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  deliveryDate: string;
  deliverySlotStart: string;
  deliverySlotEnd: string;
  cardRecipient: string;
  cardSender: string;
  cardMessage: string;
  notes: string;
};

export async function atualizarDadosPedido(
  input: DadosPedidoInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const staff = await requireStaff();

  if (!input.recipientName.trim()) return { ok: false, error: "Diga para quem é a entrega." };
  if (!input.cardRecipient.trim()) return { ok: false, error: "Diga para quem é o cartãozinho." };
  if (!input.cardMessage.trim()) return { ok: false, error: "O cartãozinho precisa ter uma mensagem." };
  if (!dataDeEntregaValida(input.deliveryDate)) return { ok: false, error: "Data de entrega inválida." };

  const admin = createAdminClient();

  const { data: order, error: fetchError } = await admin
    .from("orders")
    .select("id, status")
    .eq("id", input.id)
    .eq("tenant_id", staff.tenantId)
    .maybeSingle();
  if (fetchError || !order) return { ok: false, error: "Pedido não encontrado." };
  if (!podeAlterarPedido(order.status)) {
    return {
      ok: false,
      error: "Esse pedido já foi encerrado (entregue, cancelado ou reembolsado) e não pode mais ser alterado.",
    };
  }

  const { data: atualizado, error } = await admin
    .from("orders")
    .update({
      recipient_name: input.recipientName.trim(),
      recipient_phone: input.recipientPhone.trim() || null,
      street: input.street.trim() || null,
      address_number: input.addressNumber.trim() || null,
      complement: input.complement.trim() || null,
      neighborhood: input.neighborhood.trim() || null,
      city: input.city.trim() || null,
      state: input.state.trim() || null,
      delivery_date: input.deliveryDate,
      delivery_slot_start: input.deliverySlotStart,
      delivery_slot_end: input.deliverySlotEnd,
      card_recipient: input.cardRecipient.trim(),
      card_sender: input.cardSender.trim() || null,
      card_message: input.cardMessage.trim(),
      notes: input.notes.trim() || null,
    })
    .eq("id", input.id)
    .eq("tenant_id", staff.tenantId)
    .select("id");

  if (error || !atualizado || atualizado.length === 0) {
    console.error("[pedidos] falha ao salvar as alterações:", error);
    return { ok: false, error: "Não foi possível salvar as alterações." };
  }

  await admin.from("order_events").insert({
    tenant_id: staff.tenantId,
    order_id: input.id,
    type: "dados_alterados",
    actor: "admin",
    actor_id: staff.id,
    payload: {},
  });

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${input.id}`);
  revalidatePath("/admin/entregas");
  return { ok: true };
}

/**
 * EXCLUI um pedido de vez -- ao contrário de cancelar, não fica registro
 * nenhum depois (nem na lista, nem no histórico).
 *
 * A TRAVA aqui não é uma contagem mínima (não faz sentido dizer "sempre tem
 * que sobrar 1 pedido" -- diferente de equipe, onde sempre precisa sobrar
 * gente para tocar a loja). A trava é: **um pedido que já teve pagamento
 * gerado ou já virou um chamado de suporte não pode ser excluído.**
 *
 * Isso não é uma regra inventada aqui -- é o próprio banco que recusa: as
 * tabelas `payments` e `support_tickets` apontam para o pedido sem
 * "on delete cascade", de propósito, desde que foram criadas. Excluir um
 * pedido que já foi pago apagaria o rastro de um dinheiro que já entrou --
 * e isso é diferente de um cadastro de pessoa, não tem "não tinha valor
 * nenhum mesmo". Para esses casos o caminho é CANCELAR, que mantém o
 * registro. Esta função só transforma o erro do banco (código 23503) numa
 * frase que explica isso, em vez de estourar um erro técnico na tela.
 */
export async function excluirPedido(orderId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const staff = await requireStaff();
  const admin = createAdminClient();

  const { data: order, error: fetchError } = await admin
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .eq("tenant_id", staff.tenantId)
    .maybeSingle();
  if (fetchError || !order) return { ok: false, error: "Pedido não encontrado." };

  const { data: excluido, error } = await admin
    .from("orders")
    .delete()
    .eq("id", orderId)
    .eq("tenant_id", staff.tenantId)
    .select("id");

  if (error) {
    if (error.code === "23503") {
      return {
        ok: false,
        error:
          "Este pedido já tem um pagamento gerado ou um chamado de suporte associado, então não pode ser excluído -- isso apagaria o histórico de um dinheiro que já entrou (ou pode entrar). Use \"Cancelar pedido\" em vez de excluir: o registro fica guardado, mas o pedido some da fila de trabalho.",
      };
    }
    console.error("[pedidos] falha ao excluir o pedido:", error);
    return { ok: false, error: "Não foi possível excluir esse pedido agora." };
  }
  if (!excluido || excluido.length === 0) {
    return { ok: false, error: "Não foi possível excluir esse pedido agora." };
  }

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/entregas");
  revalidatePath("/admin");
  return { ok: true };
}
