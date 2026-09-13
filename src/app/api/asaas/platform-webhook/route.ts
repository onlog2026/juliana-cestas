import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Webhook da ASSINATURA DA PLATAFORMA — a porta por onde a mensalidade do
 * LOJISTA entra (loja paga a plataforma). Conta Asaas da PLATAFORMA, não a da
 * loja. É o gêmeo de `asaas/webhook/[tenantId]/route.ts` (pagamento do
 * comprador), com a MESMA disciplina:
 *
 *  - NÃO importa nada de "@/": um import quebrado aqui trava a ativação de
 *    TODAS as assinaturas sem ninguém perceber. Fala com o banco por REST +
 *    service role e só usa `node:crypto`.
 *  - Ordem RESERVA → PROCESSA → CONFIRMA no ledger `webhook_events` (event_id
 *    é PK → idempotência: o 2º insert do mesmo evento dá 409 e sai sem repetir).
 *  - Respostas: 200 para quase tudo (404 faria o Asaas desabilitar a fila);
 *    500 SÓ para falha transitória (banco fora), para o Asaas reenviar.
 *
 * Token: header `asaas-access-token` comparado, em tempo constante, com
 * `PLATFORM_ASAAS_WEBHOOK_TOKEN`. Sem a env, fail-closed (500): melhor o Asaas
 * reenviar do que ativar loja sem validar quem mandou o evento.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADER_TOKEN = "asaas-access-token";

/** Evento do Asaas → o que fazer com a assinatura da loja. */
type Acao = "ativar" | "atrasar" | "cancelar" | "inativar";
const MAPA: Record<string, Acao> = {
  PAYMENT_RECEIVED: "ativar",
  PAYMENT_CONFIRMED: "ativar",
  PAYMENT_OVERDUE: "atrasar",
  PAYMENT_REFUNDED: "atrasar",
  PAYMENT_DELETED: "atrasar",
  SUBSCRIPTION_DELETED: "cancelar",
  SUBSCRIPTION_INACTIVATED: "inativar",
};

type EventoAsaas = {
  id?: unknown;
  event?: unknown;
  payment?: {
    id?: unknown;
    value?: unknown;
    subscription?: unknown;
    customer?: unknown;
    externalReference?: unknown;
  };
};

type Ambiente = { url: string; key: string };

function ok(motivo: string): Response {
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

function sha256Hex(v: string): string {
  return createHash("sha256").update(v).digest("hex");
}
function hashesIguais(a: string, b: string): boolean {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ba.length === 0 || ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

function lerAmbiente(): Ambiente | null {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!url || !key) return null;
  return { url, key };
}

async function db(env: Ambiente, path: string, init: { method: string; body?: unknown; prefer?: string }): Promise<Response> {
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
  const texto = await res.text();
  if (!texto) return null;
  try {
    return JSON.parse(texto) as T;
  } catch {
    return null;
  }
}

/** Lê {tenant, plan, cycle} do externalReference (JSON gravado no checkout). */
function lerExternalRef(ref: string): { tenant?: string; plan?: string; cycle?: string } {
  try {
    const o = JSON.parse(ref) as Record<string, unknown>;
    return {
      tenant: typeof o.tenant === "string" ? o.tenant : undefined,
      plan: typeof o.plan === "string" ? o.plan : undefined,
      cycle: typeof o.cycle === "string" ? o.cycle : undefined,
    };
  } catch {
    return {};
  }
}

type Loja = {
  id: string;
  slug: string;
  subscription_status: string | null;
  subscription_plan: string | null;
  paid_until: string | null;
  pending_plan_id: string | null;
  pending_expected_cents: number | null;
  pending_cycle: string | null;
};

const CAMPOS_LOJA =
  "id,slug,subscription_status,subscription_plan,paid_until,pending_plan_id,pending_expected_cents,pending_cycle";

/** Acha a loja pelo externalReference (slug), senão pelo id da assinatura. */
async function acharLoja(env: Ambiente, slug: string | undefined, subscriptionId: string): Promise<Loja | null> {
  if (slug) {
    const r = await db(env, `tenants?slug=eq.${encodeURIComponent(slug)}&select=${CAMPOS_LOJA}&limit=1`, { method: "GET" });
    if (r.ok) {
      const l = (await lerJson<Loja[]>(r)) ?? [];
      if (l.length > 0) return l[0];
    }
  }
  if (subscriptionId) {
    const r = await db(env, `tenants?asaas_subscription_id=eq.${encodeURIComponent(subscriptionId)}&select=${CAMPOS_LOJA}&limit=1`, { method: "GET" });
    if (r.ok) {
      const l = (await lerJson<Loja[]>(r)) ?? [];
      if (l.length > 0) return l[0];
    }
  }
  return null;
}

export async function POST(req: Request) {
  const env = lerAmbiente();
  if (!env) return falha("ambiente_incompleto");

  const tokenEsperado = (process.env.PLATFORM_ASAAS_WEBHOOK_TOKEN ?? "").trim();
  if (!tokenEsperado) return falha("webhook_nao_configurado"); // fail-closed

  const tokenRecebido = req.headers.get(HEADER_TOKEN) ?? "";
  if (!tokenRecebido || !hashesIguais(sha256Hex(tokenRecebido), sha256Hex(tokenEsperado))) {
    return ok("token_invalido");
  }

  let bruto: unknown;
  try {
    bruto = await req.json();
  } catch {
    return ok("corpo_invalido");
  }
  if (!bruto || typeof bruto !== "object") return ok("corpo_invalido");

  const corpo = bruto as EventoAsaas;
  const pg = corpo.payment && typeof corpo.payment === "object" ? corpo.payment : {};
  const eventId = typeof corpo.id === "string" ? corpo.id : "";
  const evento = typeof corpo.event === "string" ? corpo.event : "";
  if (!eventId || !evento) return ok("evento_incompleto");

  const acao = MAPA[evento];
  if (!acao) return ok("evento_ignorado");

  const subscriptionId = typeof pg.subscription === "string" ? pg.subscription : "";
  const customerId = typeof pg.customer === "string" ? pg.customer : "";
  const ref = typeof pg.externalReference === "string" ? lerExternalRef(pg.externalReference) : {};
  const valorReais = typeof pg.value === "number" ? pg.value : Number(pg.value);
  const valorCents = Number.isFinite(valorReais) ? Math.round(valorReais * 100) : null;

  // Acha a loja ANTES de reservar (o ledger exige tenant_id). Sem loja, ignora.
  const loja = await acharLoja(env, ref.tenant, subscriptionId);
  if (!loja) return ok("sem_loja");

  // ── RESERVA no ledger. Duplicado (409) → 200 sem reprocessar. ──────────
  const ledger = await db(env, "webhook_events", {
    method: "POST",
    prefer: "return=minimal",
    body: {
      event_id: eventId,
      tenant_id: loja.id,
      event: evento,
      payment_id: typeof pg.id === "string" ? pg.id : null,
      received_at: new Date().toISOString(),
    },
  });
  if (ledger.status === 409) return ok("evento_repetido");
  if (!ledger.ok) return falha("ledger_indisponivel");

  const apagarLedger = async () => {
    try {
      await db(env, `webhook_events?event_id=eq.${encodeURIComponent(eventId)}`, { method: "DELETE", prefer: "return=minimal" });
    } catch {
      console.error("[platform-webhook] falha ao liberar reserva do ledger", { eventId });
    }
  };

  try {
    const r = await aplicar(env, loja, { acao, subscriptionId, customerId, valorCents, refPlan: ref.plan, refCycle: ref.cycle });
    if (!r.ok) {
      await apagarLedger();
      return falha(r.motivo);
    }
    await db(env, `webhook_events?event_id=eq.${encodeURIComponent(eventId)}`, {
      method: "PATCH",
      prefer: "return=minimal",
      body: { processed_at: new Date().toISOString() },
    });
    return ok(r.motivo);
  } catch (e) {
    console.error("[platform-webhook] erro inesperado", { eventId, evento, erro: e instanceof Error ? e.message : "?" });
    await apagarLedger();
    return falha("erro_inesperado");
  }
}

type Resultado = { ok: true; motivo: string } | { ok: false; motivo: string };

async function aplicar(
  env: Ambiente,
  loja: Loja,
  d: { acao: Acao; subscriptionId: string; customerId: string; valorCents: number | null; refPlan?: string; refCycle?: string }
): Promise<Resultado> {
  const agora = new Date();

  if (d.acao === "ativar") {
    // Confere o valor pago contra o "contrato" (pending_expected_cents), com a
    // mesma tolerância de arredondamento do Agentop (50 centavos). Se bate,
    // o plano é o pending; senão, cai no plano do externalReference; por último
    // mantém o que já estava.
    const bateValor =
      loja.pending_expected_cents != null &&
      d.valorCents != null &&
      Math.abs(d.valorCents - loja.pending_expected_cents) <= 50;

    const plano =
      (bateValor ? loja.pending_plan_id : null) ?? d.refPlan ?? loja.subscription_plan ?? loja.pending_plan_id ?? null;

    const cycle = (loja.pending_cycle ?? d.refCycle ?? "MONTHLY").toUpperCase();
    // paid_until = próxima renovação + folga (para um atraso de horas na
    // renovação não bloquear a loja). A assinatura é nativa do Asaas: cada
    // ciclo dispara novo PAYMENT_* e estende isto de novo.
    const dias = cycle === "YEARLY" ? 368 : 33;
    const paidUntil = new Date(agora.getTime() + dias * 86400000).toISOString();

    const patch: Record<string, unknown> = {
      subscription_status: "active",
      subscription_plan: plano,
      paid_until: paidUntil,
      billing_cycle: cycle,
      // Se a vitrine tinha sido suspensa por falta de pagamento, volta ao ar.
      status: "active",
      pending_plan_id: null,
      pending_expected_cents: null,
      pending_cycle: null,
    };
    if (d.subscriptionId) patch.asaas_subscription_id = d.subscriptionId;
    if (d.customerId) patch.asaas_customer_id = d.customerId;

    const r = await db(env, `tenants?id=eq.${encodeURIComponent(loja.id)}`, {
      method: "PATCH",
      prefer: "return=representation",
      body: patch,
    });
    if (!r.ok) return { ok: false, motivo: "falha_ao_ativar" };
    const linhas = (await lerJson<Array<{ id: string }>>(r)) ?? [];
    if (linhas.length === 0) return { ok: false, motivo: "loja_nao_ativada" };
    return { ok: true, motivo: "assinatura_ativa" };
  }

  if (d.acao === "atrasar") {
    // Não rebaixa quem está pago e dentro da validade (um OVERDUE atrasado de
    // um ciclo antigo não pode "atrasar" uma loja que já renovou).
    const pagoEmDia =
      loja.subscription_status === "active" && loja.paid_until != null && new Date(loja.paid_until) > agora;
    if (pagoEmDia) return { ok: true, motivo: "ignorado_pago_em_dia" };

    const r = await db(env, `tenants?id=eq.${encodeURIComponent(loja.id)}`, {
      method: "PATCH",
      prefer: "return=minimal",
      body: { subscription_status: "overdue" },
    });
    if (!r.ok) return { ok: false, motivo: "falha_ao_atrasar" };
    return { ok: true, motivo: "assinatura_atrasada" };
  }

  // cancelar / inativar
  const novo = d.acao === "cancelar" ? "canceled" : "inactive";
  const patch: Record<string, unknown> = { subscription_status: novo };
  // Cancelou: limpa o id da assinatura para permitir assinar de novo depois.
  if (d.acao === "cancelar") patch.asaas_subscription_id = null;
  const r = await db(env, `tenants?id=eq.${encodeURIComponent(loja.id)}`, {
    method: "PATCH",
    prefer: "return=minimal",
    body: patch,
  });
  if (!r.ok) return { ok: false, motivo: "falha_ao_encerrar" };
  return { ok: true, motivo: `assinatura_${novo}` };
}

export async function GET() {
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
}
