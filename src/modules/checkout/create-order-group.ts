import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createOrder } from "@/modules/checkout/create-order";
import { notifyGroupPlaced } from "@/modules/notifications/events";
import type { CheckoutInput } from "@/modules/checkout/schemas";

export type GroupOrderSummary = { orderId: string; number: number; token: string; totalCents: number };

export type CreateOrderGroupResult =
  | { ok: true; groupId: string; orders: GroupOrderSummary[]; totalCents: number }
  | { ok: false; error: string; createdOrders: GroupOrderSummary[] };

const MAX_GIFTS_PER_GROUP = 30;

/**
 * Cria um carrinho de N presentes como N pedidos (cada um pelo mesmo
 * `createOrder` de sempre -- mesma quote, mesma trava de slot, mesma
 * idempotência), amarrados por um `group_id` novo (coluna `orders.group_id`,
 * migração 0048). Não altera `create_order_tx` (função SQL crítica,
 * congelada): o group_id é gravado com um UPDATE simples depois de cada
 * pedido criado com sucesso.
 *
 * Notificação por-pedido (e-mail + WhatsApp da loja) fica DESLIGADA aqui
 * (notify:false) para não mandar N avisos -- a confirmação do grupo (Fase 3)
 * mostra o resumo de todos os presentes na tela + botão de WhatsApp.
 *
 * Sem atomicidade entre pedidos: se o presente 3 de 5 falhar (ex.: horário
 * lotou entre a tela e o clique), os 2 já criados FICAM criados -- devolve
 * o que já foi confirmado para a tela explicar isso ao cliente.
 */
export async function createOrderGroup(
  tenantId: string,
  gifts: CheckoutInput[]
): Promise<CreateOrderGroupResult> {
  if (gifts.length === 0) {
    return { ok: false, error: "O carrinho está vazio.", createdOrders: [] };
  }
  if (gifts.length > MAX_GIFTS_PER_GROUP) {
    return {
      ok: false,
      error: `Carrinho com mais de ${MAX_GIFTS_PER_GROUP} cestas. Fale com a loja pelo WhatsApp para fechar esse pedido.`,
      createdOrders: [],
    };
  }

  const groupId = crypto.randomUUID();
  const admin = createAdminClient();
  const created: GroupOrderSummary[] = [];

  for (const gift of gifts) {
    const result = await createOrder(tenantId, gift, { notify: false });
    if (!result.ok) {
      return { ok: false, error: result.error, createdOrders: created };
    }

    // Amarra este pedido ao grupo. Se o UPDATE falhar, o pedido já existe e
    // está pago normalmente -- só não aparece agrupado; não é motivo para
    // devolver erro ao cliente (o dinheiro/pedido está seguro).
    await admin
      .from("orders")
      .update({ group_id: groupId })
      .eq("id", result.orderId)
      .eq("tenant_id", tenantId);

    created.push({
      orderId: result.orderId,
      number: result.number,
      token: result.token,
      totalCents: result.totalCents,
    });
  }

  // Um único e-mail-resumo com todas as cestas (melhor esforço: nunca falha o pedido).
  await notifyGroupPlaced(tenantId, { groupId, firstOrderId: created[0].orderId, token: created[0].token });

  const totalCents = created.reduce((sum, o) => sum + o.totalCents, 0);
  return { ok: true, groupId, orders: created, totalCents };
}
