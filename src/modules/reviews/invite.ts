import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { generatePublicToken, hashToken } from "@/modules/orders/token";
import { sendOrderEmail, getEmailBrand } from "@/modules/notifications/send";
import { reviewInviteEmail } from "@/modules/notifications/templates/review-invite";
import { sanitizeName } from "@/modules/reviews/service";
import { saoPauloDateStr } from "@/lib/time/sao-paulo";

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
  orderId: string,
  /** true = reenvio manual: manda de novo mesmo que já tenha saído um convite. */
  options: { resend?: boolean } = {}
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

  // 1ª camada de idempotência. A linha da avaliação existir NÃO prova que o
  // convite chegou: antes de o envio de e-mails estar configurado, a linha era
  // criada e o e-mail nunca saía (foi o caso do pedido #1010) -- e o pedido
  // ficava preso para sempre. Por isso só conta como "já convidado" se a pessoa
  // já respondeu OU se o e-mail realmente saiu (notificação 'sent').
  const { data: existente } = await admin
    .from("product_reviews")
    .select("id, submitted_at")
    .eq("tenant_id", tenantId)
    .eq("order_id", orderId)
    .maybeSingle();
  if (existente) {
    if (existente.submitted_at) return { ok: true, alreadyInvited: true };
    if (!options.resend) {
      const { data: enviado } = await admin
        .from("notifications")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("order_id", orderId)
        .eq("type", "review_invite")
        .eq("status", "sent")
        .limit(1);
      if (enviado && enviado.length > 0) return { ok: true, alreadyInvited: true };
    }
    // Convite que nunca saiu (ou reenvio pedido): token NOVO (só o hash fica no
    // banco, o antigo não dá para recuperar) e envia de novo.
    const token = generatePublicToken();
    const { error: renewError } = await admin
      .from("product_reviews")
      .update({ invite_token_hash: hashToken(token), invited_at: new Date().toISOString() })
      .eq("id", existente.id)
      .eq("tenant_id", tenantId);
    if (renewError) return { ok: false, error: "Não foi possível renovar o convite de avaliação." };
    await sendInvite(tenantId, order, token);
    return { ok: true, alreadyInvited: false };
  }

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

  await sendInvite(tenantId, order, token, itemNames);
  return { ok: true, alreadyInvited: false };
}

/** Monta e envia o e-mail de convite (com o nome dos itens, quando disponível). */
async function sendInvite(tenantId: string, order: OrderRow, token: string, knownItemNames?: string[]) {
  let itemNames = knownItemNames;
  if (!itemNames) {
    const { data: itens } = await createAdminClient()
      .from("order_items")
      .select("name, kind")
      .eq("tenant_id", tenantId)
      .eq("order_id", order.id);
    itemNames = (itens ?? []).filter((i) => i.kind === "product").map((i) => i.name as string);
  }
  const brand = await getEmailBrand(tenantId);
  const { subject, html, text } = reviewInviteEmail(
    {
      orderNumber: order.number,
      buyerName: order.buyer_name,
      itemNames,
      reviewUrl: `${siteUrl()}/avaliar/${token}`,
    },
    brand
  );
  await sendOrderEmail(tenantId, {
    orderId: order.id,
    type: "review_invite",
    toEmail: order.buyer_email,
    subject,
    html,
    text,
  });
}

export type DispatchSummary = {
  /** Pedidos entregues que ainda não tinham convite e receberam agora. */
  enviados: number;
  /** Pedidos entregues sem e-mail cadastrado — não dá para convidar. */
  semEmail: number;
  falhas: number;
};

/** Janela padrão: só pedidos entregues nos últimos 7 dias (nunca "o histórico inteiro"). */
export const REVIEW_WINDOW_DAYS = 7;

/**
 * Varre os pedidos ENTREGUES recentemente que ainda não foram convidados e manda
 * a pesquisa de avaliação.
 *
 *  - `deliveredBeforeToday` (rotina diária): só pedidos entregues ANTES de hoje
 *    (relógio de Brasília) -- a pesquisa sai "no dia seguinte", nunca no mesmo dia
 *    em que a cesta chegou.
 *  - Janela de `REVIEW_WINDOW_DAYS` dias: o botão manual do painel também respeita,
 *    para não disparar pesquisa para cliente que recebeu há meses.
 *  - UMA pesquisa por carrinho: se um pedido do mesmo grupo já foi convidado (ou
 *    respondeu), os outros não recebem outra.
 *  - Convite que nunca saiu de verdade (linha sem e-mail enviado) é reenviado com
 *    token novo. Chamar de novo não duplica: quem já recebeu é pulado.
 */
export async function dispatchPendingReviewInvites(
  tenantId: string,
  options: { limit?: number; deliveredWithinDays?: number; deliveredBeforeToday?: boolean } = {}
): Promise<DispatchSummary> {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
  const days = Math.min(Math.max(options.deliveredWithinDays ?? REVIEW_WINDOW_DAYS, 1), 60);
  const admin = createAdminClient();
  const resumo: DispatchSummary = { enviados: 0, semEmail: 0, falhas: 0 };

  // 1) Quando cada pedido foi entregue (evento `status_entregue`), dentro da janela.
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  let eventos = admin
    .from("order_events")
    .select("order_id")
    .eq("tenant_id", tenantId)
    .eq("type", "status_entregue")
    .gte("created_at", since);
  if (options.deliveredBeforeToday) {
    // Meia-noite de hoje em Brasília (UTC-3, sem horário de verão desde 2019).
    eventos = eventos.lt("created_at", `${saoPauloDateStr()}T00:00:00-03:00`);
  }
  const { data: eventosData, error: eventosError } = await eventos.limit(500);
  if (eventosError || !eventosData || eventosData.length === 0) return resumo;
  const candidatos = [...new Set(eventosData.map((e) => e.order_id as string))];

  const { data: entregues } = await admin
    .from("orders")
    .select("id, buyer_email, group_id")
    .eq("tenant_id", tenantId)
    .eq("status", DELIVERED_STATUS)
    .in("id", candidatos)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (!entregues || entregues.length === 0) return resumo;

  // 2) Todos os pedidos dos mesmos carrinhos (para "uma pesquisa por carrinho").
  const grupos = [...new Set(entregues.map((o) => o.group_id as string | null).filter((g): g is string => Boolean(g)))];
  const irmaos = new Map<string, string[]>(); // group_id -> ids de todos os pedidos do grupo
  if (grupos.length > 0) {
    const { data: doGrupo } = await admin
      .from("orders")
      .select("id, group_id")
      .eq("tenant_id", tenantId)
      .in("group_id", grupos);
    for (const o of doGrupo ?? []) {
      const lista = irmaos.get(o.group_id as string) ?? [];
      lista.push(o.id as string);
      irmaos.set(o.group_id as string, lista);
    }
  }

  const todosIds = [...new Set([...entregues.map((o) => o.id as string), ...[...irmaos.values()].flat()])];
  const [{ data: avaliacoes }, { data: enviados }] = await Promise.all([
    admin.from("product_reviews").select("order_id, submitted_at").eq("tenant_id", tenantId).in("order_id", todosIds),
    admin
      .from("notifications")
      .select("order_id")
      .eq("tenant_id", tenantId)
      .eq("type", "review_invite")
      .eq("status", "sent")
      .in("order_id", todosIds),
  ]);
  // "Resolvido" = a pessoa respondeu OU o e-mail de fato saiu.
  const resolvidos = new Set<string>([
    ...(avaliacoes ?? []).filter((r) => r.submitted_at).map((r) => r.order_id as string),
    ...(enviados ?? []).map((r) => r.order_id as string),
  ]);

  const gruposAtendidos = new Set<string>();
  for (const pedido of entregues) {
    const id = pedido.id as string;
    const grupo = (pedido.group_id as string | null) ?? null;
    if (resolvidos.has(id)) continue;
    if (grupo) {
      if (gruposAtendidos.has(grupo)) continue;
      // Outro pedido do carrinho já foi convidado/respondeu: não manda segunda pesquisa.
      if ((irmaos.get(grupo) ?? []).some((irmao) => resolvidos.has(irmao))) continue;
    }
    if (!pedido.buyer_email) {
      resumo.semEmail += 1;
      continue;
    }
    const r = await createReviewInvite(tenantId, id);
    if (r.ok && !r.alreadyInvited) {
      resumo.enviados += 1;
      if (grupo) gruposAtendidos.add(grupo);
    } else if (!r.ok) resumo.falhas += 1;
  }

  return resumo;
}
