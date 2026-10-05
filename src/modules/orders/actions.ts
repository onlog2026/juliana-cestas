"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/tenant/site-url";
import { requireStaff } from "@/lib/auth/require-staff";
import { sendOrderEmail, getEmailBrand } from "@/modules/notifications/send";
import { outForDeliveryEmail } from "@/modules/notifications/templates/out-for-delivery";
import { deliveredEmail } from "@/modules/notifications/templates/delivered";
import { notifyOrderPaid } from "@/modules/notifications/events";
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
  /** Carrinho com várias cestas: todo pedido do mesmo grupo tem o mesmo id aqui. */
  group_id: string | null;
};

export async function listOrders(filters?: { status?: string; date?: string }): Promise<AdminOrderRow[]> {
  const staff = await requireStaff();
  const admin = createAdminClient();
  let query = admin
    .from("orders")
    .select(
      "id, number, status, payment_status, buyer_name, buyer_phone, recipient_name, delivery_type, delivery_date, delivery_slot_start, delivery_slot_end, total_cents, created_at, group_id"
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
  /** Outras cestas do mesmo carrinho (vazio se o pedido não é de um grupo). */
  siblings: { id: string; number: number; status: string }[];
};

export async function getOrderDetail(orderId: string): Promise<AdminOrderDetail | null> {
  const staff = await requireStaff();
  const admin = createAdminClient();

  const { data: order, error } = await admin
    .from("orders")
    .select(
      "id, number, status, payment_status, buyer_name, buyer_phone, buyer_email, buyer_cpf, recipient_name, recipient_phone, delivery_type, street, address_number, complement, neighborhood, city, state, zone_name, delivery_date, delivery_slot_start, delivery_slot_end, card_template, card_recipient, card_sender, card_message, notes, subtotal_cents, addons_cents, delivery_fee_cents, discount_cents, coupon_code, total_cents, created_at, group_id"
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

  let siblings: AdminOrderDetail["siblings"] = [];
  if (order.group_id) {
    const { data: group } = await admin
      .from("orders")
      .select("id, number, status")
      .eq("group_id", order.group_id)
      .eq("tenant_id", staff.tenantId)
      .neq("id", orderId)
      .order("number");
    siblings = group ?? [];
  }

  return { ...order, items: items ?? [], events: events ?? [], siblings };
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

  const siteUrl = await getSiteUrl(staff.tenantId);
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
      // O link de acompanhamento exige o token secreto (que só existe no e-mail de
      // confirmação); sem ele a página dava 404. Aqui o botão leva ao site da loja.
      orderUrl: siteUrl,
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
    const { subject, html, text } = deliveredEmail(
      { orderNumber: order.number, buyerName: order.buyer_name, shopUrl: siteUrl || undefined },
      brand
    );
    await sendOrderEmail(staff.tenantId, {
      orderId,
      type: "delivered",
      toEmail: order.buyer_email,
      subject,
      html,
      text,
    });

    // A pesquisa de avaliação NÃO sai aqui: sai no dia seguinte, pela rotina diária
    // (`api/cron/daily` -> `dispatchPendingReviewInvites`), com o agradecimento acima
    // já entregue no mesmo dia. Pedir opinião no minuto da entrega apressa o cliente.
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
  orderId: string,
  /** false = quem chamou avisa o cliente depois (marcar um carrinho inteiro = 1 e-mail só). */
  notify = true
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

  // E-mail "pagamento confirmado" (melhor esforço: nunca desfaz o pagamento).
  if (notify) await notifyOrderPaid(staff.tenantId, [orderId]);

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Marca como pago TODOS os pedidos ainda em aberto do carrinho e manda UM só
 * e-mail de confirmação com todas as cestas. Pedidos já pagos/encerrados são
 * ignorados sem erro.
 */
export async function markGroupPaid(
  orderId: string
): Promise<{ ok: true; paid: number } | { ok: false; error: string }> {
  const staff = await requireStaff();
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("id, group_id")
    .eq("id", orderId)
    .eq("tenant_id", staff.tenantId)
    .maybeSingle();
  if (!order) return { ok: false, error: "Pedido não encontrado." };
  if (!order.group_id) {
    const single = await markOrderPaid(orderId);
    return single.ok ? { ok: true, paid: 1 } : single;
  }

  const { data: group } = await admin
    .from("orders")
    .select("id, status")
    .eq("group_id", order.group_id)
    .eq("tenant_id", staff.tenantId)
    .order("number");
  const paidIds: string[] = [];
  for (const o of group ?? []) {
    if (o.status !== "aguardando_pagamento" && o.status !== "novo") continue;
    const r = await markOrderPaid(o.id, false);
    if (r.ok) paidIds.push(o.id);
  }
  if (paidIds.length === 0) return { ok: false, error: "Nenhum pedido deste carrinho está aguardando pagamento." };
  await notifyOrderPaid(staff.tenantId, paidIds);
  return { ok: true, paid: paidIds.length };
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

/**
 * Cancela TODAS as cestas de um carrinho de uma vez. Cada uma segue a mesma
 * regra do cancelamento individual (pedido já entregue/cancelado fica de fora,
 * sem erro). Devolve quantas foram canceladas.
 */
export async function cancelOrderGroup(
  orderId: string,
  reason: string
): Promise<{ ok: true; cancelled: number } | { ok: false; error: string }> {
  const staff = await requireStaff();
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("id, group_id")
    .eq("id", orderId)
    .eq("tenant_id", staff.tenantId)
    .maybeSingle();
  if (!order) return { ok: false, error: "Pedido não encontrado." };
  if (!order.group_id) {
    const single = await cancelOrder(orderId, reason);
    return single.ok ? { ok: true, cancelled: 1 } : single;
  }

  const { data: group } = await admin
    .from("orders")
    .select("id, status")
    .eq("group_id", order.group_id)
    .eq("tenant_id", staff.tenantId);
  let cancelled = 0;
  for (const o of group ?? []) {
    if (NON_CANCELABLE.has(o.status)) continue;
    const r = await cancelOrder(o.id, reason);
    if (r.ok) cancelled += 1;
  }
  if (cancelled === 0) return { ok: false, error: "Nenhuma cesta deste carrinho pode mais ser cancelada." };
  return { ok: true, cancelled };
}

/**
 * Exclui TODAS as cestas de um carrinho numa única operação (tudo ou nada).
 * Mesma trava do pedido individual: se qualquer uma já tem pagamento ou
 * chamado, o banco recusa o conjunto inteiro e nada é apagado.
 */
export async function excluirGrupo(orderId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const staff = await requireStaff();
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("id, group_id")
    .eq("id", orderId)
    .eq("tenant_id", staff.tenantId)
    .maybeSingle();
  if (!order) return { ok: false, error: "Pedido não encontrado." };
  if (!order.group_id) return excluirPedido(orderId);

  const { data: excluidos, error } = await admin
    .from("orders")
    .delete()
    .eq("group_id", order.group_id)
    .eq("tenant_id", staff.tenantId)
    .select("id");

  if (error) {
    if (error.code === "23503") {
      return {
        ok: false,
        error:
          "Alguma cesta deste carrinho já tem pagamento gerado ou chamado de suporte, então o carrinho não pode ser excluído (nada foi apagado). Use \"Cancelar\" em vez de excluir: o registro fica guardado.",
      };
    }
    console.error("[pedidos] falha ao excluir o grupo:", error);
    return { ok: false, error: "Não foi possível excluir o carrinho agora." };
  }
  if (!excluidos || excluidos.length === 0) return { ok: false, error: "Não foi possível excluir o carrinho agora." };

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/entregas");
  revalidatePath("/admin");
  return { ok: true };
}
