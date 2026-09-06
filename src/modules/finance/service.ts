import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPaymentEnabled } from "@/modules/payments/service";
import { formatCents } from "@/lib/money";
import { saoPauloDateStr } from "@/lib/time/sao-paulo";
import {
  readLatestSnapshot,
  needsRefresh,
  refreshFinanceSnapshot,
  type FinanceSnapshotRow,
} from "@/modules/finance/snapshot";

/**
 * Orquestra a tela /admin/financeiro:
 *   1. a loja tem conta Asaas conectada? (reaproveita `payments/service.ts`)
 *   2. se tem, o snapshot de hoje já existe, ou vale a pena consultar de novo?
 *   3. o extrato: pedidos cruzados com o pagamento correspondente (mesmo
 *      padrão de `getOrderPaymentStatus` em payments/service.ts), exportável
 *      em CSV.
 */

export type FinanceStatus =
  | { connected: false }
  | {
      connected: true;
      /** `null` só quando a loja conectou mas NUNCA conseguiu ser consultada com sucesso. */
      snapshot: FinanceSnapshotRow | null;
      /** Não-nulo quando a tentativa de consulta ao vivo desta abertura falhou. */
      erroAtualizacao: string | null;
    };

/**
 * Situação do financeiro da loja: conectada ou não, e o snapshot (do cache
 * de hoje, ou de uma tentativa nova se o dia mudou / foi forçado).
 *
 * Nunca lança. Uma falha ao falar com o Asaas cai para o último snapshot
 * salvo — com a data dele e o motivo do erro — em vez de mostrar zero.
 */
export async function getFinanceStatus(
  tenantId: string,
  opts: { forceRefresh?: boolean } = {}
): Promise<FinanceStatus> {
  const habilitado = await isPaymentEnabled(tenantId);
  if (!habilitado) return { connected: false };

  const hoje = saoPauloDateStr();
  const ultimo = await readLatestSnapshot(tenantId);

  if (!needsRefresh(ultimo, hoje, Boolean(opts.forceRefresh))) {
    return { connected: true, snapshot: ultimo, erroAtualizacao: null };
  }

  const resultado = await refreshFinanceSnapshot(tenantId, hoje);
  if (resultado.ok) {
    return { connected: true, snapshot: resultado.snapshot, erroAtualizacao: null };
  }

  // Falhou: cai para o último snapshot salvo (pode ser de um dia anterior, ou
  // não existir nenhum ainda). Nunca mostra zero no lugar de "não sei".
  return { connected: true, snapshot: ultimo, erroAtualizacao: resultado.error };
}

// ── Extrato: pedidos cruzados com o pagamento correspondente ────────────────

export type ExtractRow = {
  orderId: string;
  orderNumber: number;
  createdAt: string;
  buyerName: string;
  totalCents: number;
  orderStatus: string;
  paymentStatus: string;
  billingType: string | null;
  paidAt: string | null;
};

type OrderExtractDbRow = {
  id: string;
  number: number;
  created_at: string;
  buyer_name: string;
  total_cents: number;
  status: string;
  payment_status: string;
  paid_at: string | null;
};

/**
 * Pedidos do período cruzados com o pagamento correspondente — mesmo padrão
 * de `getOrderPaymentStatus` (payments/service.ts): lê o pedido e junta com a
 * linha mais recente de `payments` para o mesmo pedido, sempre filtrando por
 * `tenant_id`.
 */
export async function listFinanceExtract(tenantId: string, from: string, to: string): Promise<ExtractRow[]> {
  const supabase = createAdminClient();

  const { data: ordersData } = await supabase
    .from("orders")
    .select("id, number, created_at, buyer_name, total_cents, status, payment_status, paid_at")
    .eq("tenant_id", tenantId)
    .gte("created_at", `${from}T00:00:00`)
    .lt("created_at", `${to}T23:59:59.999`)
    .order("created_at", { ascending: false });

  const orders = (ordersData ?? []) as OrderExtractDbRow[];
  if (orders.length === 0) return [];

  const orderIds = orders.map((o) => o.id);
  const { data: payments } = await supabase
    .from("payments")
    .select("order_id, billing_type, created_at")
    .eq("tenant_id", tenantId)
    .in("order_id", orderIds)
    .order("created_at", { ascending: false });

  // O pagamento mais recente de cada pedido — como a consulta já veio
  // ordenada por `created_at` desc, o primeiro que aparece para cada
  // `order_id` é o que fica.
  const pagamentoPorPedido = new Map<string, string>();
  for (const p of payments ?? []) {
    if (!pagamentoPorPedido.has(p.order_id)) pagamentoPorPedido.set(p.order_id, p.billing_type);
  }

  return orders.map((o) => ({
    orderId: o.id,
    orderNumber: o.number,
    createdAt: o.created_at,
    buyerName: o.buyer_name,
    totalCents: o.total_cents,
    orderStatus: o.status,
    paymentStatus: o.payment_status,
    billingType: pagamentoPorPedido.get(o.id) ?? null,
    paidAt: o.paid_at,
  }));
}

// ── CSV ───────────────────────────────────────────────────────────────────

const ORDER_STATUS_LABEL: Record<string, string> = {
  novo: "Novo",
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  em_preparacao: "Em preparação",
  pronto: "Pronto",
  saiu_para_entrega: "Saiu para entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  overdue: "Vencido",
  refunded: "Reembolsado",
  chargeback: "Contestado",
  canceled: "Cancelado",
};

const BILLING_TYPE_LABEL: Record<string, string> = {
  PIX: "Pix",
  CREDIT_CARD: "Cartão de crédito",
  BOLETO: "Boleto",
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABEL[status] ?? status;
}

export function paymentStatusLabel(status: string): string {
  return PAYMENT_STATUS_LABEL[status] ?? status;
}

export function billingTypeLabel(tipo: string | null): string {
  if (!tipo) return "Combinado pelo WhatsApp";
  return BILLING_TYPE_LABEL[tipo] ?? tipo;
}

/**
 * Escapa um campo para CSV (RFC 4180): qualquer campo que contenha vírgula,
 * aspas ou quebra de linha vai entre aspas, com as aspas internas dobradas.
 * Nome de cliente com vírgula ("Silva, Ana") e valor em reais formatado
 * ("R$ 129,90", que TEM vírgula) são os dois casos reais que forçam isto —
 * os dois têm teste unitário provando o resultado.
 */
export function csvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const DATA_HORA_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/**
 * "dd/mm/aaaa hh:mm" no fuso de Brasília, sem vírgula entre data e hora.
 *
 * `toLocaleString` insere uma vírgula aí ("05/09/2026, 10:30") dependendo do
 * ICU do Node -- inofensivo na tela, mas dentro do CSV vira mais um campo com
 * vírgula precisando de aspas por um motivo bobo. Montar a partir de
 * `formatToParts` evita a vírgula, ponto final.
 */
function formatarDataHoraCsv(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const partes = DATA_HORA_FORMATTER.formatToParts(d);
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "";
  return `${valor("day")}/${valor("month")}/${valor("year")} ${valor("hour")}:${valor("minute")}`;
}

/**
 * Monta o CSV do extrato. Formata em reais (com vírgula) só aqui, na hora de
 * virar arquivo para a lojista abrir no Excel — o cálculo em si continua
 * sempre em centavos (`ExtractRow.totalCents`).
 */
export function buildExtractCsv(rows: ExtractRow[]): string {
  const header = [
    "Pedido",
    "Data",
    "Cliente",
    "Valor",
    "Status do pedido",
    "Status do pagamento",
    "Forma de pagamento",
  ];

  const linhas = rows.map((r) => [
    String(r.orderNumber),
    formatarDataHoraCsv(r.createdAt),
    r.buyerName,
    formatCents(r.totalCents),
    orderStatusLabel(r.orderStatus),
    paymentStatusLabel(r.paymentStatus),
    billingTypeLabel(r.billingType),
  ]);

  return [header, ...linhas].map((linha) => linha.map(csvField).join(",")).join("\r\n");
}
