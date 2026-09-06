import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDecryptedKey } from "@/modules/payments/accounts";
import { reportError } from "@/lib/platform/report-error";
import { getSalesSummary } from "@/modules/sales/service";
import {
  ASAAS_BASE_URL,
  redigir,
  AsaasError,
  type AsaasEnvironment,
} from "@/modules/payments/asaas-client";

/**
 * Saldo e recebíveis do Asaas DA PRÓPRIA LOJA, com cache diário.
 *
 * `src/modules/payments/asaas-client.ts` não pode ser editado neste trabalho
 * (outro agente mexe nele em paralelo) e não tem as duas chamadas que faltam
 * aqui (saldo da conta e listagem de cobranças por período — ele só precisa
 * de criar cobrança, então é só isso que expõe). Em vez de escrever um
 * cliente HTTP paralelo do zero, este arquivo REUSA as peças exportadas de lá
 * — `ASAAS_BASE_URL`, `redigir`, `AsaasError` — e acrescenta só a chamada GET
 * que falta, com o mesmo cuidado (chave nunca em log/erro, corpo lido como
 * texto antes de virar JSON, timeout).
 *
 * Confirmado na documentação oficial em 2026-09-06 (docs.asaas.com):
 *   GET /v3/finance/balance -> { "balance": 5210.96 }               (reais)
 *   GET /v3/payments?status=...&dateCreated[ge]=...&dateCreated[le]=...
 *     -> { object: "list", data: [...], hasMore, totalCount, limit, offset }
 *     cada item: { id, status, value, netValue, billingType, dueDate,
 *                  paymentDate, customer, externalReference, dateCreated }
 *     (value e netValue vêm em REAIS, igual ao resto da API do Asaas.)
 */

const REQUEST_TIMEOUT_MS = 20_000;

async function getAsaas<T>(apiKey: string, environment: AsaasEnvironment, path: string): Promise<T> {
  const base = ASAAS_BASE_URL[environment];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      method: "GET",
      headers: { access_token: apiKey, Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (e) {
    const detalhe = e instanceof Error ? redigir(e.message, apiKey) : "falha de rede";
    throw new AsaasError(`Não foi possível falar com o Asaas (${detalhe}).`, 0);
  } finally {
    clearTimeout(timer);
  }

  const texto = await res.text();

  if (!res.ok) {
    const limpo = redigir(texto, apiKey).trim();
    let mensagem = `O Asaas recusou a operação (HTTP ${res.status}).`;
    try {
      const corpo = limpo ? (JSON.parse(limpo) as { errors?: Array<{ description?: string }> }) : null;
      if (corpo?.errors?.[0]?.description) mensagem = corpo.errors[0].description;
    } catch {
      // corpo não era JSON (HTML de manutenção, por exemplo) — mensagem genérica acima.
    }
    if (res.status === 401 || res.status === 403) {
      mensagem = "A chave de API do Asaas foi recusada. Reconecte a conta em Pagamentos.";
    }
    if (res.status === 429) {
      mensagem = "O Asaas recebeu pedidos demais agora. Tente de novo em alguns minutos.";
    }
    throw new AsaasError(mensagem, res.status);
  }

  if (!texto) return {} as T;
  try {
    return JSON.parse(texto) as T;
  } catch {
    throw new AsaasError("O Asaas respondeu num formato inesperado. Tente de novo em alguns minutos.", res.status);
  }
}

type AsaasBalanceResponse = { balance: number };

type AsaasPaymentListResponse = {
  data?: Array<{ value?: number; netValue?: number | null }>;
  hasMore?: boolean;
  totalCount?: number;
};

/** Reais do Asaas -> centavos, com arredondamento (mesma regra de asaas-client.ts). */
function reaisParaCentavos(valor: number | null | undefined): number {
  const n = Number(valor ?? 0);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export type ConsultaAsaasFinanceiro = {
  balanceCents: number;
  pendingCents: number;
  /** Quantas cobranças pendentes entraram na soma acima (a API pagina de 100 em 100). */
  pendingSampleCount: number;
  pendingHasMore: boolean;
  raw: { balance: unknown; pendingPayments: unknown };
};

/**
 * Consulta AO VIVO o saldo e as cobranças pendentes no Asaas.
 *
 * `pendingCents` é a soma das cobranças com status PENDING na primeira página
 * (até 100) devolvida pelo Asaas — suficiente para o resumo do painel. Se
 * houver mais de 100 pendentes, `pendingHasMore` fica `true` e a tela avisa
 * que o valor é uma soma parcial, em vez de fingir precisão que não existe.
 */
export async function consultarAsaasFinanceiroAoVivo(
  apiKey: string,
  environment: AsaasEnvironment
): Promise<ConsultaAsaasFinanceiro> {
  const saldo = await getAsaas<AsaasBalanceResponse>(apiKey, environment, "/finance/balance");

  const qs = new URLSearchParams({ status: "PENDING", limit: "100", offset: "0" });
  const pendentes = await getAsaas<AsaasPaymentListResponse>(apiKey, environment, `/payments?${qs.toString()}`);

  const itens = pendentes.data ?? [];
  const pendingCents = itens.reduce((soma, item) => soma + reaisParaCentavos(item.netValue ?? item.value), 0);

  return {
    balanceCents: reaisParaCentavos(saldo.balance),
    pendingCents,
    pendingSampleCount: itens.length,
    pendingHasMore: Boolean(pendentes.hasMore),
    raw: { balance: saldo, pendingPayments: pendentes },
  };
}

export type FinanceSnapshotRow = {
  date: string;
  balanceCents: number;
  pendingCents: number;
  salesCents: number;
  ordersCount: number;
  createdAt: string;
};

type SnapshotDbRow = {
  date: string;
  balance_cents: number;
  pending_cents: number;
  sales_cents: number;
  orders_count: number;
  created_at: string;
};

function mapRow(row: SnapshotDbRow): FinanceSnapshotRow {
  return {
    date: row.date,
    balanceCents: row.balance_cents,
    pendingCents: row.pending_cents,
    salesCents: row.sales_cents,
    ordersCount: row.orders_count,
    createdAt: row.created_at,
  };
}

/** O snapshot mais recente salvo para a loja, ou `null` se nunca houve um. */
export async function readLatestSnapshot(tenantId: string): Promise<FinanceSnapshotRow | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("tenant_finance_snapshots")
    .select("date, balance_cents, pending_cents, sales_cents, orders_count, created_at")
    .eq("tenant_id", tenantId)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle<SnapshotDbRow>();
  return data ? mapRow(data) : null;
}

/**
 * Decide se vale a pena consultar o Asaas de novo.
 *
 * Regra: uma vez por dia é suficiente (a lojista força uma consulta nova com
 * o botão "Atualizar agora" -> `force = true`). Função pura, sem banco nem
 * rede, para poder testar a regra sozinha.
 */
export function needsRefresh(latest: FinanceSnapshotRow | null, today: string, force: boolean): boolean {
  if (force) return true;
  if (!latest) return true;
  return latest.date !== today;
}

export type RefreshOutcome =
  | { ok: true; snapshot: FinanceSnapshotRow }
  | { ok: false; error: string };

/**
 * Consulta o Asaas ao vivo, junta com o resumo de vendas locais do dia
 * (`sales/service.ts` — reaproveitado, não recalculado aqui) e grava o
 * snapshot de hoje. Nunca lança: erro vira `{ ok: false, error }` para quem
 * chamou decidir se mostra o último snapshot salvo.
 */
export async function refreshFinanceSnapshot(tenantId: string, today: string): Promise<RefreshOutcome> {
  const credenciais = await getDecryptedKey(tenantId);
  if (!credenciais) {
    return { ok: false, error: "Esta loja não está mais conectada ao Asaas. Conecte de novo em Pagamentos." };
  }

  let consulta: ConsultaAsaasFinanceiro;
  try {
    consulta = await consultarAsaasFinanceiroAoVivo(credenciais.apiKey, credenciais.environment);
  } catch (e) {
    const detalhe = e instanceof AsaasError ? redigir(e.message, credenciais.apiKey) : "erro inesperado ao falar com o Asaas";
    await reportError({
      tenantId,
      module: "financeiro",
      action: "consultar_saldo",
      level: "warning",
      message: "Não foi possível consultar o saldo/recebíveis no Asaas agora.",
      detail: { motivo: detalhe },
    });
    return { ok: false, error: detalhe };
  }

  // Vendas locais do dia — mesma função que a home do painel já usa. Nenhuma
  // conta nova aqui, só reaproveitando o que `sales/service.ts` já calcula.
  const vendasDoDia = await getSalesSummary(tenantId, today, today);

  const supabase = createAdminClient();
  const agora = new Date().toISOString();
  const { data: gravado, error: upsertError } = await supabase
    .from("tenant_finance_snapshots")
    .upsert(
      {
        tenant_id: tenantId,
        date: today,
        balance_cents: consulta.balanceCents,
        pending_cents: consulta.pendingCents,
        sales_cents: vendasDoDia.revenueCents,
        orders_count: vendasDoDia.ordersCount,
        raw: consulta.raw as unknown as Record<string, unknown>,
        created_at: agora,
      },
      { onConflict: "tenant_id,date" }
    )
    .select("tenant_id");

  if (upsertError || !gravado || gravado.length === 0) {
    await reportError({
      tenantId,
      module: "financeiro",
      action: "salvar_snapshot",
      level: "error",
      message: "O saldo foi consultado no Asaas mas não foi possível salvar o snapshot do dia.",
      detail: { erro: upsertError?.message ?? "0 linhas gravadas" },
    });
    // A consulta funcionou — mostra o resultado mesmo sem ter conseguido
    // cachear. Pior caso: a próxima abertura da tela consulta de novo.
    return {
      ok: true,
      snapshot: {
        date: today,
        balanceCents: consulta.balanceCents,
        pendingCents: consulta.pendingCents,
        salesCents: vendasDoDia.revenueCents,
        ordersCount: vendasDoDia.ordersCount,
        createdAt: agora,
      },
    };
  }

  return {
    ok: true,
    snapshot: {
      date: today,
      balanceCents: consulta.balanceCents,
      pendingCents: consulta.pendingCents,
      salesCents: vendasDoDia.revenueCents,
      ordersCount: vendasDoDia.ordersCount,
      createdAt: agora,
    },
  };
}
