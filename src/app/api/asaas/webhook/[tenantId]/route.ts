import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Webhook do Asaas — a porta por onde o dinheiro entra.
 *
 * ═══ POR QUE ESTE ARQUIVO NÃO IMPORTA NADA DE "@/" ═══
 * Um import quebrado aqui (um arquivo renomeado, um ciclo, um `server-only`
 * puxado por engano) derruba o RECEBIMENTO DE TODOS OS PAGAMENTOS — e ninguém
 * percebe, porque a loja continua funcionando e as cobranças continuam sendo
 * emitidas. O cliente paga e o pedido nunca libera. Por isso este arquivo fala
 * com o banco por REST puro (`fetch` + service role) e só depende de `node:crypto`.
 * NÃO ADICIONE IMPORTS DE "@/" AQUI. Se precisar de algo, copie a função.
 *
 * ═══ CONTRATO DE RESPOSTA (cada linha custou um incidente em algum lugar) ═══
 *  200  loja sem conta conectada        — 404 faria o Asaas desabilitar o webhook
 *  200  token errado                    — comparação em TEMPO CONSTANTE
 *  200  evento repetido                 — NUNCA reprocessa (dois pedidos liberados)
 *  200  pagamento desconhecido          — cobrança criada fora deste sistema
 *  500  falta service role no ambiente  — fail-closed, o Asaas reenvia
 *  500  qualquer falha ao gravar        — E a linha do ledger é APAGADA antes
 *
 * A regra do 500: o Asaas trata 2xx como "processei" e não reenvia. Um `catch`
 * que devolve 200 deixa o cliente pago e sem acesso, para sempre. Mas 15
 * falhas seguidas interrompem a fila do Asaas — por isso o 500 é reservado a
 * falha TRANSITÓRIA (banco fora), nunca a evento que jamais vai dar certo.
 *
 * ═══ ORDEM: RESERVA → PROCESSA → CONFIRMA ═══
 * 1. grava a linha no ledger (`webhook_events`) — a chave primária `event_id`
 *    é o que garante idempotência: o segundo insert do mesmo evento dá 409.
 * 2. processa.
 * 3. marca `processed_at`.
 * Em qualquer erro do passo 2, a linha do passo 1 é apagada e devolve 500 —
 * ledger gravado com processamento falho é o pior estado possível: o reenvio
 * do Asaas bateria no 409 e sairia calado, sem nunca liberar o pedido.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADER_TOKEN = "asaas-access-token";

const STATUS_PAGO = new Set(["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"]);

/** Evento do Asaas → situação em `payments.status` / `orders.payment_status`. */
const MAPA_SITUACAO: Record<string, "paid" | "overdue" | "refunded" | "canceled" | "chargeback"> = {
  PAYMENT_RECEIVED: "paid",
  PAYMENT_CONFIRMED: "paid",
  PAYMENT_OVERDUE: "overdue",
  PAYMENT_REFUNDED: "refunded",
  PAYMENT_DELETED: "canceled",
  PAYMENT_CHARGEBACK_REQUESTED: "chargeback",
  PAYMENT_CHARGEBACK_DISPUTE: "chargeback",
  PAYMENT_AWAITING_CHARGEBACK_REVERSAL: "chargeback",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Forma do evento que o Asaas manda (doc oficial: `id`, `event`, `dateCreated`,
 * `account` e o objeto `payment`). Tudo `unknown` de propósito: o corpo vem da
 * internet, então cada campo é conferido antes de ser usado.
 */
type EventoAsaas = {
  id?: unknown;
  event?: unknown;
  payment?: {
    id?: unknown;
    status?: unknown;
    value?: unknown;
    billingType?: unknown;
    externalReference?: unknown;
    paymentDate?: unknown;
  };
};

const FORMAS_ACEITAS = new Set(["PIX", "CREDIT_CARD", "BOLETO"]);

/**
 * Guarda o payload cru do evento, MENOS qualquer coisa de cartão. O `raw` é
 * ouro para conferir um pagamento depois — mas "número de cartão foi parar no
 * log" está na lista de incidentes reais; aqui nem chega perto do banco.
 */
function semDadosDeCartao(corpo: unknown): unknown {
  if (!corpo || typeof corpo !== "object") return corpo;
  const copia = { ...(corpo as Record<string, unknown>) };
  const pagamento = copia.payment;
  if (pagamento && typeof pagamento === "object") {
    const p = { ...(pagamento as Record<string, unknown>) };
    delete p.creditCard;
    delete p.creditCardToken;
    delete p.creditCardNumber;
    copia.payment = p;
  }
  return copia;
}

function ok(motivo: string): Response {
  // Corpo curto e sem dado nenhum do pagamento — este endpoint é público.
  return new Response(JSON.stringify({ received: true, motivo }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function falha(motivo: string): Response {
  return new Response(JSON.stringify({ received: false, motivo }), {
    status: 500,
    headers: { "content-type": "application/json" },
  });
}

function sha256Hex(valor: string): string {
  return createHash("sha256").update(valor).digest("hex");
}

/** Comparação em tempo constante — não entrega o hash por cronometragem. */
function hashesIguais(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ba.length === 0 || ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

type Ambiente = { url: string; key: string };

function lerAmbiente(): Ambiente | null {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!url || !key) return null;
  return { url, key };
}

async function db(
  env: Ambiente,
  path: string,
  init: { method: string; body?: unknown; prefer?: string }
): Promise<Response> {
  const headers: Record<string, string> = {
    apikey: env.key,
    authorization: `Bearer ${env.key}`,
    "content-type": "application/json",
  };
  if (init.prefer) headers.prefer = init.prefer;

  return fetch(`${env.url}/rest/v1/${path}`, {
    method: init.method,
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
}

async function lerJson<T>(res: Response): Promise<T | null> {
  // Mesmo cuidado do cliente do Asaas: texto primeiro, JSON depois. Um 502 do
  // proxy do Supabase devolve HTML e `.json()` estouraria sem explicar nada.
  const texto = await res.text();
  if (!texto) return null;
  try {
    return JSON.parse(texto) as T;
  } catch {
    return null;
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await ctx.params;

  // ── Ambiente. Sem service role, fail-closed: 500 e o Asaas reenvia. ──────
  const env = lerAmbiente();
  if (!env) return falha("ambiente_incompleto");

  if (!UUID.test(tenantId)) return ok("loja_invalida");

  // ── Corpo. JSON inválido nunca vai melhorar no reenvio: 200. ────────────
  let bruto: unknown;
  try {
    bruto = await req.json();
  } catch {
    return ok("corpo_invalido");
  }
  if (!bruto || typeof bruto !== "object") return ok("corpo_invalido");

  const corpo = bruto as EventoAsaas;
  const pagamento = corpo.payment && typeof corpo.payment === "object" ? corpo.payment : {};

  const eventId = typeof corpo.id === "string" ? corpo.id : "";
  const evento = typeof corpo.event === "string" ? corpo.event : "";
  const asaasPaymentId = typeof pagamento.id === "string" ? pagamento.id : "";
  const externalReference =
    typeof pagamento.externalReference === "string" ? pagamento.externalReference : "";

  if (!eventId || !evento) return ok("evento_incompleto");

  // ── Conta da loja. Sem conta conectada: 200 (nunca 404). ───────────────
  const contaRes = await db(
    env,
    `tenant_payment_accounts?tenant_id=eq.${encodeURIComponent(tenantId)}&select=webhook_token_hash&limit=1`,
    { method: "GET" }
  );
  if (!contaRes.ok) return falha("conta_indisponivel"); // falha transitória: reenviar
  const contas = (await lerJson<Array<{ webhook_token_hash: string }>>(contaRes)) ?? [];
  if (contas.length === 0) return ok("loja_sem_conta");

  // ── Token. Errado: 200, comparação em tempo constante. ─────────────────
  const tokenRecebido = req.headers.get(HEADER_TOKEN) ?? "";
  if (!tokenRecebido || !hashesIguais(sha256Hex(tokenRecebido), contas[0].webhook_token_hash ?? "")) {
    return ok("token_invalido");
  }

  // ── RESERVA no ledger. Duplicado (409) → 200 sem reprocessar. ──────────
  const ledgerRes = await db(env, "webhook_events", {
    method: "POST",
    prefer: "return=minimal",
    body: {
      event_id: eventId,
      tenant_id: tenantId,
      event: evento,
      payment_id: asaasPaymentId || null,
      received_at: new Date().toISOString(),
    },
  });

  if (ledgerRes.status === 409) return ok("evento_repetido");
  if (!ledgerRes.ok) return falha("ledger_indisponivel");

  const apagarLedger = async () => {
    try {
      await db(env, `webhook_events?event_id=eq.${encodeURIComponent(eventId)}`, {
        method: "DELETE",
        prefer: "return=minimal",
      });
    } catch {
      // Se nem apagar der certo, o reenvio bate no 409 e sai calado. Por isso
      // o erro vai para o console: é o único rastro que sobra.
      console.error("[asaas-webhook] falha ao liberar a reserva do ledger", { eventId });
    }
  };

  try {
    const resultado = await processar(env, tenantId, {
      evento,
      asaasPaymentId,
      externalReference,
      billingType: typeof pagamento.billingType === "string" ? pagamento.billingType : "",
      corpo: semDadosDeCartao(corpo),
    });

    if (!resultado.ok) {
      await apagarLedger();
      return falha(resultado.motivo);
    }

    // ── CONFIRMA. Falhar aqui é inofensivo (o evento já foi aplicado e o
    //    reenvio bateria no 409), então não desfaz nada.
    await db(env, `webhook_events?event_id=eq.${encodeURIComponent(eventId)}`, {
      method: "PATCH",
      prefer: "return=minimal",
      body: { processed_at: new Date().toISOString(), order_id: resultado.orderId ?? null },
    });

    return ok(resultado.motivo);
  } catch (e) {
    console.error("[asaas-webhook] erro inesperado", {
      eventId,
      evento,
      erro: e instanceof Error ? e.message : "desconhecido",
    });
    await apagarLedger();
    return falha("erro_inesperado");
  }
}

type Processado =
  | { ok: true; motivo: string; orderId?: string | null }
  | { ok: false; motivo: string };

async function processar(
  env: Ambiente,
  tenantId: string,
  dados: {
    evento: string;
    asaasPaymentId: string;
    externalReference: string;
    billingType: string;
    corpo: unknown;
  }
): Promise<Processado> {
  const { evento, asaasPaymentId, externalReference } = dados;

  const situacao = MAPA_SITUACAO[evento];
  if (!situacao) return { ok: true, motivo: "evento_ignorado" };
  if (!asaasPaymentId) return { ok: true, motivo: "sem_id_de_cobranca" };

  // ── O pagamento. SEMPRE por (asaas_payment_id E tenant_id) juntos. ──────
  // Buscar só pelo id do Asaas é o furo que deixaria uma loja confirmar
  // pagamento de outra: o id é único no Asaas de cada conta, não no mundo.
  const pagRes = await db(
    env,
    `payments?asaas_payment_id=eq.${encodeURIComponent(asaasPaymentId)}` +
      `&tenant_id=eq.${encodeURIComponent(tenantId)}` +
      `&select=id,order_id,status,amount_cents&limit=1`,
    { method: "GET" }
  );
  if (!pagRes.ok) return { ok: false, motivo: "pagamento_indisponivel" };
  let pagamentos = (await lerJson<Array<{ id: string; order_id: string; status: string; amount_cents: number }>>(pagRes)) ?? [];

  // ── Rede de segurança contra corrida: a cobrança pode ter sido criada no
  //    Asaas e o PIX pago ANTES da linha em `payments` existir. O
  //    `externalReference` guarda o id do pedido justamente para isso.
  if (pagamentos.length === 0 && UUID.test(externalReference)) {
    const pedidoRes = await db(
      env,
      `orders?id=eq.${encodeURIComponent(externalReference)}&tenant_id=eq.${encodeURIComponent(tenantId)}&select=id,total_cents&limit=1`,
      { method: "GET" }
    );
    if (!pedidoRes.ok) return { ok: false, motivo: "pedido_indisponivel" };
    const pedidos = (await lerJson<Array<{ id: string; total_cents: number }>>(pedidoRes)) ?? [];

    if (pedidos.length > 0) {
      const criarRes = await db(env, "payments", {
        method: "POST",
        prefer: "return=representation",
        body: {
          tenant_id: tenantId,
          order_id: pedidos[0].id,
          provider: "asaas",
          asaas_payment_id: asaasPaymentId,
          // O valor vem do PEDIDO, nunca do que o webhook mandou.
          amount_cents: pedidos[0].total_cents,
          billing_type: FORMAS_ACEITAS.has(dados.billingType) ? dados.billingType : "PIX",
          status: "pending",
        },
      });
      if (!criarRes.ok && criarRes.status !== 409) return { ok: false, motivo: "falha_ao_registrar_cobranca" };
      const criados = (await lerJson<Array<{ id: string; order_id: string; status: string; amount_cents: number }>>(criarRes)) ?? [];
      pagamentos = criados.length > 0
        ? criados
        : [{ id: "", order_id: pedidos[0].id, status: "pending", amount_cents: pedidos[0].total_cents }];
    }
  }

  // Cobrança que este sistema não conhece: a lojista pode ter emitido direto
  // no aplicativo do Asaas. Reenviar nunca vai encontrar — 200 e fim.
  if (pagamentos.length === 0) return { ok: true, motivo: "cobranca_desconhecida" };

  const pagamento = pagamentos[0];
  const agora = new Date().toISOString();

  // ── Eventos chegam FORA DE ORDEM. Um OVERDUE atrasado não pode desfazer
  //    um pagamento já confirmado (incidente documentado no Agentop).
  if (pagamento.status === "paid" && situacao !== "refunded" && situacao !== "chargeback") {
    return { ok: true, motivo: "ja_estava_pago", orderId: pagamento.order_id };
  }

  // ── Atualiza o pagamento. ──────────────────────────────────────────────
  if (pagamento.id) {
    const patchPag = await db(env, `payments?id=eq.${encodeURIComponent(pagamento.id)}&tenant_id=eq.${encodeURIComponent(tenantId)}`, {
      method: "PATCH",
      prefer: "return=representation",
      body: {
        status: situacao,
        paid_at: situacao === "paid" ? agora : null,
        updated_at: agora,
        raw: dados.corpo,
      },
    });
    if (!patchPag.ok) return { ok: false, motivo: "falha_ao_atualizar_pagamento" };
    const linhas = (await lerJson<Array<{ id: string }>>(patchPag)) ?? [];
    // `.select()` obrigatório: PATCH que não pegou linha nenhuma devolve 200
    // com lista vazia — e a tela mentiria "pago".
    if (linhas.length === 0) return { ok: false, motivo: "pagamento_nao_atualizado" };
  }

  // ── Atualiza o pedido. ────────────────────────────────────────────────
  const patchPedido: Record<string, unknown> = { payment_status: situacao, updated_at: agora };
  let filtroStatus = "";

  if (situacao === "paid") {
    patchPedido.status = "pago";
    patchPedido.paid_at = agora;
    // Só sai de "aguardando pagamento"/"novo": um pedido já em preparação ou
    // entregue não pode voltar para "pago".
    filtroStatus = "&status=in.(novo,aguardando_pagamento)";
  } else if (situacao === "refunded") {
    patchPedido.status = "reembolsado";
  }

  const patchRes = await db(
    env,
    `orders?id=eq.${encodeURIComponent(pagamento.order_id)}&tenant_id=eq.${encodeURIComponent(tenantId)}${filtroStatus}`,
    { method: "PATCH", prefer: "return=representation", body: patchPedido }
  );
  if (!patchRes.ok) return { ok: false, motivo: "falha_ao_atualizar_pedido" };
  const pedidosAtualizados = (await lerJson<Array<{ id: string; number?: number; buyer_email?: string | null }>>(patchRes)) ?? [];

  // Zero linhas com filtro de status = o pedido já tinha saído de "aguardando
  // pagamento" (staff confirmou antes, na mão). Não é falha: é idempotência.
  if (pedidosAtualizados.length === 0 && !filtroStatus) {
    return { ok: false, motivo: "pedido_nao_atualizado" };
  }

  // ── Registra no histórico do pedido. ──────────────────────────────────
  const eventoRes = await db(env, "order_events", {
    method: "POST",
    prefer: "return=minimal",
    body: {
      tenant_id: tenantId,
      order_id: pagamento.order_id,
      type: `pagamento_${situacao}`,
      to_status: situacao === "paid" ? "pago" : situacao === "refunded" ? "reembolsado" : null,
      actor: "webhook",
      payload: { evento, asaas_payment_id: asaasPaymentId },
    },
  });
  if (!eventoRes.ok) return { ok: false, motivo: "falha_ao_registrar_evento" };

  // ── E-mail de pagamento confirmado. MELHOR ESFORÇO, sempre: o pedido já
  //    está liberado; e-mail nunca pode derrubar o webhook e fazer o Asaas
  //    reenviar um evento que já foi aplicado.
  if (STATUS_PAGO.has(evento)) {
    try {
      await avisarPagamento(env, tenantId, pagamento.order_id);
    } catch (e) {
      console.error("[asaas-webhook] e-mail de confirmação falhou (pedido já liberado)", {
        orderId: pagamento.order_id,
        erro: e instanceof Error ? e.message : "desconhecido",
      });
    }
  }

  return { ok: true, motivo: `aplicado_${situacao}`, orderId: pagamento.order_id };
}

/** Escapa texto que vai para dentro do HTML do e-mail. */
function esc(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Grava no outbox `notifications` (a mesma fila que o resto do sistema usa) e
 * manda pela Resend por REST. Sem chave/remetente configurado, a linha fica
 * como `pending_domain` — exatamente o que `src/modules/notifications/send.ts`
 * já faz hoje.
 */
async function avisarPagamento(env: Ambiente, tenantId: string, orderId: string): Promise<void> {
  const pedidoRes = await db(
    env,
    `orders?id=eq.${encodeURIComponent(orderId)}&tenant_id=eq.${encodeURIComponent(tenantId)}&select=number,buyer_name,buyer_email,total_cents&limit=1`,
    { method: "GET" }
  );
  if (!pedidoRes.ok) return;
  const pedidos =
    (await lerJson<Array<{ number: number; buyer_name: string; buyer_email: string | null; total_cents: number }>>(pedidoRes)) ?? [];
  const pedido = pedidos[0];
  if (!pedido?.buyer_email) return;

  const total = (pedido.total_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const assunto = `Pagamento confirmado — pedido #${pedido.number}`;
  const html =
    `<p>Oi, ${esc(pedido.buyer_name)}!</p>` +
    `<p>Recebemos o pagamento do seu pedido <strong>#${pedido.number}</strong>, no valor de ${esc(total)}.</p>` +
    `<p>Agora é com a gente: vamos preparar tudo e avisar quando sair para entrega.</p>`;

  const apiKey = (process.env.RESEND_API_KEY ?? "").trim();
  const emailFrom = (process.env.EMAIL_FROM ?? "").trim();

  const linha = {
    tenant_id: tenantId,
    order_id: orderId,
    type: "order_confirmed",
    to_email: pedido.buyer_email,
    subject: assunto,
    html,
  };

  if (!apiKey || !emailFrom) {
    await db(env, "notifications", {
      method: "POST",
      prefer: "return=minimal",
      body: { ...linha, status: "pending_domain" },
    });
    return;
  }

  const criada = await db(env, "notifications", {
    method: "POST",
    prefer: "return=representation",
    body: { ...linha, status: "pending" },
  });
  const criadas = (await lerJson<Array<{ id: string }>>(criada)) ?? [];

  const envio = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ from: emailFrom, to: pedido.buyer_email, subject: assunto, html }),
    cache: "no-store",
  });

  if (criadas[0]?.id) {
    await db(env, `notifications?id=eq.${encodeURIComponent(criadas[0].id)}`, {
      method: "PATCH",
      prefer: "return=minimal",
      body: envio.ok
        ? { status: "sent", sent_at: new Date().toISOString() }
        : { status: "failed", error: `HTTP ${envio.status}` },
    });
  }
}

/**
 * O Asaas nunca faz GET aqui, mas um navegador curioso faz. Responder 200 com
 * corpo neutro evita que alguém descubra quais lojas têm conta conectada.
 */
export async function GET() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
