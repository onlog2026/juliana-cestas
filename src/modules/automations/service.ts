import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * MÓDULO DE AUTOMAÇÕES — leitura e regras puras.
 *
 * PRIMEIRA REGRA REAL: carrinho abandonado.
 *
 * Este projeto NÃO tem carrinho persistido em banco. O pedido nasce no banco
 * no instante em que o comprador confirma o checkout (ver
 * `src/modules/checkout/create-order.ts`): status `aguardando_pagamento`,
 * payment_status `pending`. Não existe uma etapa "carrinho" separada que
 * vire pedido depois — o pedido JÁ é criado, só que ainda não pago. Por isso a
 * automação de "carrinho abandonado" é, na prática, "pedido aguardando
 * pagamento há mais de X horas". O comentário completo do disparo em lote
 * está em `run.ts` (é ele que o cron diário chama).
 *
 * Este arquivo é o que o painel da lojista lê. `actions.ts` é quem grava
 * (server actions, atrás do gate de módulo). `run.ts` é quem varre TODAS as
 * lojas e dispara os e-mails (chamado pelo cron, com service role).
 */

export type AutomationKind = "carrinho_abandonado" | "pos_entrega";

/** Único tipo de automação implementado até agora. */
export const CARRINHO_ABANDONADO: AutomationKind = "carrinho_abandonado";

export const MIN_DELAY_HOURS = 1;
export const MAX_DELAY_HOURS = 48;
export const DEFAULT_DELAY_HOURS = 2;

/**
 * Não manda e-mail para um pedido de mais de uma semana atrás — carrinho de
 * mês passado não é "abandonado", é uma venda que já não vai acontecer, e
 * reaparecer na caixa de entrada da pessoa nesse ponto só incomoda.
 */
export const MAX_CANDIDATE_AGE_DAYS = 7;

/**
 * Trava a faixa aceita pelo painel: nunca menos de 1h, nunca mais de 48h.
 * Pura — sem banco — para o teste provar a regra sem montar conexão nenhuma.
 * É a mesma trava que o CHECK do banco replica (migração 0037): esta função
 * evita a viagem ao banco só para descobrir que o valor ia ser recusado.
 */
export function clampDelayHours(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_DELAY_HOURS;
  const inteiro = Math.round(value);
  return Math.min(MAX_DELAY_HOURS, Math.max(MIN_DELAY_HOURS, inteiro));
}

/**
 * Um pedido "aguardando_pagamento" é candidato a carrinho abandonado quando já
 * passou `delayHours` desde que foi criado, mas ainda não passou de
 * `MAX_CANDIDATE_AGE_DAYS`. Pura — sem banco — é o coração da regra de
 * negócio, testado isoladamente.
 */
export function isAbandonedCartCandidate(
  order: { status: string; createdAt: string | Date },
  now: Date,
  delayHours: number
): boolean {
  if (order.status !== "aguardando_pagamento") return false;
  const createdAt = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
  if (Number.isNaN(createdAt.getTime())) return false;

  const ageMs = now.getTime() - createdAt.getTime();
  if (ageMs < 0) return false;

  const delayMs = clampDelayHours(delayHours) * 60 * 60 * 1000;
  const maxAgeMs = MAX_CANDIDATE_AGE_DAYS * 24 * 60 * 60 * 1000;
  return ageMs >= delayMs && ageMs <= maxAgeMs;
}

export type CartRecoveryRule = {
  enabled: boolean;
  delayHours: number;
};

/** O padrão de uma loja que nunca configurou a regra: desligada, 2h. */
const REGRA_PADRAO: CartRecoveryRule = { enabled: false, delayHours: DEFAULT_DELAY_HOURS };

/** A regra de carrinho abandonado desta loja, ou o padrão se ela nunca mexeu nisso. */
export async function getCartRecoveryRule(tenantId: string): Promise<CartRecoveryRule> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("automation_rules")
    .select("enabled, delay_hours")
    .eq("tenant_id", tenantId)
    .eq("kind", CARRINHO_ABANDONADO)
    .maybeSingle();

  if (!data) return REGRA_PADRAO;
  return { enabled: Boolean(data.enabled), delayHours: clampDelayHours(data.delay_hours) };
}

/** Quantos e-mails de recuperação de carrinho esta loja mandou nos últimos 30 dias. */
export async function countCartRecoverySentLast30Days(tenantId: string): Promise<number> {
  const admin = createAdminClient();
  const desde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("automation_runs")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("kind", CARRINHO_ABANDONADO)
    .gte("sent_at", desde);
  return count ?? 0;
}
