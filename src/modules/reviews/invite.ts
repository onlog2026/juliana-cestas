import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { generatePublicToken, hashToken } from "@/modules/orders/token";
import { sendOrderEmail, getEmailBrand } from "@/modules/notifications/send";
import { reviewInviteEmail } from "@/modules/notifications/templates/review-invite";
import { sanitizeName } from "@/modules/reviews/service";

/**
 * CONVITE PARA AVALIAR.
 *
 * QUANDO DISPARA: quando o pedido chega no status **`entregue`** — o último
 * status do fluxo em `src/modules/orders/actions.ts` (NEXT_STATUS:
 * pago -> em_preparacao -> pronto -> saiu_para_entrega -> entregue). Pedir
 * avaliação no momento da COMPRA seria pedir opinião sobre uma cesta que ainda
 * não chegou.
 *
 * IDEMPOTÊNCIA — as duas camadas:
 *   1. antes de gerar qualquer coisa, procura uma avaliação já existente para
 *      o pedido e sai sem fazer nada se achar;
 *   2. se duas chamadas correrem ao mesmo tempo e as duas passarem pelo passo
 *      1, o índice único `product_reviews_tenant_order_uq` (migração 0030)
 *      derruba a segunda com o erro 23505, que é tratado aqui como
 *      "já convidado". Ou seja: nunca dois tokens válidos, nunca dois e-mails.
 *
 * TOKEN: aleatório de 192 bits, igual ao token público de pedido. No banco vai
 * só o SHA-256 — quem tiver acesso de leitura ao banco não consegue abrir a
 * página de avaliação de ninguém.
 */

export type InviteResult =
  | { ok: true; alreadyInvited: boolean }
  | { ok: false; error: string };

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "";

/** O status final do fluxo de pedidos deste projeto. */
export const DELIVERED_STATUS = "entregue";

type OrderRow = {
  id: string;
  number: number;
  status: string;
  buyer_name: string;
  buyer_email: string | null;
};

export async function createReviewInvite(
  tenantId: string,
  orderId: string
): Promise<InviteResult> {
  const admin = createAdminClient();

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id, number, status, buyer_name, buyer_email")
    // Sem o filtro de loja, um id de pedido de OUTRA loja geraria convite aqui.
    .eq("tenant_id", tenantId)
    .eq("id", orderId)
    .maybeSingle<OrderRow>();

  if (orderError || !order) return { ok: false, error: "Pedido não encontrado." };

  // 1ª camada de idempotência.
  const { data: existente } = await admin
    .from("product_reviews")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("order_id", orderId)
    .maybeSingle();
  if (existente) return { ok: true, alreadyInvited: true };

  // O que a pessoa comprou — entra no e-mail para ela lembrar do pedido, e o
  // produto vira o alvo da avaliação quando a compra tem um produto só.
  const { data: itens } = await admin
    .from("order_items")
    .select("name, product_id, kind")
    .eq("tenant_id", tenantId)
    .eq("order_id", orderId);

  const produtos = (itens ?? []).filter((i) => i.kind === "product");
  const itemNames = produtos.map((i) => i.name as string);
  const productId = produtos.length === 1 ? ((produtos[0].product_id as string | null) ?? null) : null;

  const token = generatePublicToken();
  const agora = new Date().toISOString();

  const { data: inserido, error: insertError } = await admin
    .from("product_reviews")
    .insert({
      tenant_id: tenantId,
      order_id: orderId,
      product_id: productId,
      customer_name: sanitizeName(order.buyer_name) || "Cliente",
      customer_email: order.buyer_email,
      status: "pendente",
      invite_token_hash: hashToken(token),
      invited_at: agora,
    })
    .select("id")
    .maybeSingle();

  if (insertError) {
    // 2ª camada: corrida perdida para outra chamada. Não é erro para quem chamou.
    if (insertError.code === "23505") return { ok: true, alreadyInvited: true };
    return { ok: false, error: "Não foi possível criar o convite de avaliação." };
  }
  // insert que "deu certo" sem devolver linha é gravação que não aconteceu.
  if (!inserido) return { ok: false, error: "O convite não foi gravado." };

  const brand = await getEmailBrand(tenantId);
  const { subject, html } = reviewInviteEmail(
    {
      orderNumber: order.number,
      buyerName: order.buyer_name,
      itemNames,
      reviewUrl: `${siteUrl()}/avaliar/${token}`,
    },
    brand
  );

  await sendOrderEmail(tenantId, {
    orderId,
    type: "review_invite",
    toEmail: order.buyer_email,
    subject,
    html,
  });

  return { ok: true, alreadyInvited: false };
}

export type DispatchSummary = {
  /** Pedidos entregues que ainda não tinham convite e receberam agora. */
  enviados: number;
  /** Pedidos entregues sem e-mail cadastrado — não dá para convidar. */
  semEmail: number;
  falhas: number;
};

/**
 * Varre os pedidos ENTREGUES que ainda não têm avaliação e manda o convite.
 *
 * Existe por dois motivos: (a) cobre os pedidos que já foram entregues ANTES
 * de este módulo existir, e (b) é a rede de segurança para qualquer entrega em
 * que o disparo automático tenha falhado (e-mail é sempre melhor esforço).
 * Chamar de novo não duplica nada — `createReviewInvite` é idempotente.
 */
export async function dispatchPendingReviewInvites(
  tenantId: string,
  options: { limit?: number } = {}
): Promise<DispatchSummary> {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
  const admin = createAdminClient();
  const resumo: DispatchSummary = { enviados: 0, semEmail: 0, falhas: 0 };

  const { data: entregues, error } = await admin
    .from("orders")
    .select("id, buyer_email")
    .eq("tenant_id", tenantId)
    .eq("status", DELIVERED_STATUS)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !entregues || entregues.length === 0) return resumo;

  const ids = entregues.map((o) => o.id as string);
  const { data: jaConvidados } = await admin
    .from("product_reviews")
    .select("order_id")
    .eq("tenant_id", tenantId)
    .in("order_id", ids);

  const convidados = new Set((jaConvidados ?? []).map((r) => r.order_id as string));

  for (const pedido of entregues) {
    if (convidados.has(pedido.id as string)) continue;
    if (!pedido.buyer_email) {
      resumo.semEmail += 1;
      continue;
    }
    const r = await createReviewInvite(tenantId, pedido.id as string);
    if (r.ok && !r.alreadyInvited) resumo.enviados += 1;
    else if (!r.ok) resumo.falhas += 1;
  }

  return resumo;
}
