import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * COTA MENSAL do assistente de IA (módulo `ia`), por loja.
 *
 * A regra de comparação (`avaliarCota`) é uma função PURA: não lê banco, não
 * lê relógio do sistema -- recebe tudo por parâmetro. É isso que permite
 * testá-la em `tests/unit/ai-usage.test.ts` sem precisar de um Supabase de
 * mentira. As funções que terminam em `getX` são as únicas que tocam banco;
 * elas existem só para alimentar a função pura com números de verdade.
 */

export type UsageRow = { tenant_id: string; created_at: string };

export type CotaAvaliacao = {
  /** Pode gerar mais um conteúdo agora? */
  permitido: boolean;
  /** Quantas chamadas a loja já fez neste mês. */
  usado: number;
  /** `null` = sem limite (nunca bloqueia). */
  limite: number | null;
  /** Quantas chamadas ainda restam. `null` quando o plano não tem limite. */
  restante: number | null;
};

/**
 * Início do mês corrente, em UTC, como ISO -- é a fronteira que faz a cota
 * "zerar" todo dia 1º. Pura: o instante `agora` sempre vem por parâmetro.
 */
export function inicioDoMesIso(agora: Date): string {
  return new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), 1, 0, 0, 0, 0)).toISOString();
}

/**
 * Quantas chamadas de UMA loja caem dentro do mês de `agora`, entre as linhas
 * dadas. Pura, e por isso o teste consegue provar as duas garantias que mais
 * importam aqui: linha de OUTRA loja nunca entra na conta, e virar o mês faz a
 * conta recomeçar do zero. Usada como segunda checagem (depois do filtro que a
 * consulta SQL já faz por `tenant_id` e `created_at`) -- cinto e suspensório.
 */
export function contarUsoDoTenantNoMes(rows: readonly UsageRow[], tenantId: string, agora: Date): number {
  const inicio = inicioDoMesIso(agora);
  return rows.filter((r) => r.tenant_id === tenantId && r.created_at >= inicio).length;
}

/**
 * A COMPARAÇÃO em si: usado neste mês contra o limite do plano.
 *
 * `limite === null` é "sem limite" e por isso NUNCA bloqueia -- é o contrato
 * de `plan_modules.limit_value` (migração 0026): campo nulo = ilimitado.
 */
export function avaliarCota(usadoNoMes: number, limite: number | null): CotaAvaliacao {
  if (limite === null) {
    return { permitido: true, usado: usadoNoMes, limite: null, restante: null };
  }
  const restante = Math.max(limite - usadoNoMes, 0);
  return { permitido: usadoNoMes < limite, usado: usadoNoMes, limite, restante };
}

/** Frase pronta em português para quando a cota estourou. */
export function mensagemCotaEstourada(limite: number): string {
  return `Este mês já foram usados os ${limite} usos de IA incluídos no seu plano. O contador zera no dia 1º do mês que vem.`;
}

/**
 * Quantas chamadas esta loja já fez no mês de `agora` (padrão: agora mesmo).
 *
 * A consulta já filtra por `tenant_id` e pela data de início do mês -- a
 * chamada a `contarUsoDoTenantNoMes` depois é a segunda checagem da mesma
 * regra, não uma substituta dela.
 */
export async function getUsoIaDoMes(tenantId: string, agora: Date = new Date()): Promise<number> {
  const admin = createAdminClient();
  const inicio = inicioDoMesIso(agora);

  const { data, error } = await admin
    .from("ai_usage")
    .select("tenant_id, created_at")
    .eq("tenant_id", tenantId)
    .gte("created_at", inicio);

  if (error) throw new Error(`falha ao ler o uso de IA: ${error.message}`);

  return contarUsoDoTenantNoMes((data ?? []) as UsageRow[], tenantId, agora);
}

/**
 * O limite de uso de IA do plano EFETIVO desta loja (`plan_modules.limit_value`
 * do módulo `ia`). `null` = sem limite.
 *
 * A escolha do plano efetivo (contratado, ou o de uma cortesia ativa com prazo
 * no futuro) é a MESMA regra do passo 4 de `src/modules/entitlements/resolve.ts`,
 * repetida aqui em três linhas de propósito: aquele arquivo é a fonte da
 * verdade sobre QUEM pode usar o módulo `ia` (já checado antes de chegar aqui,
 * por `ensureModuleForAction`); esta função só decide QUANTAS vezes -- e leitura
 * de leitura não vale a pena importar o serviço inteiro de entitlements para
 * três linhas de data. Se as duas divergirem um dia, é aqui que se conserta.
 *
 * Qualquer falha de leitura (loja sem linha, plano apagado, módulo sem regra)
 * devolve `null` (sem limite) -- mesma filosofia do resto do sistema: erro de
 * leitura nunca tranca a lojista, só libera demais por engano.
 */
export async function getLimiteIaDoPlano(tenantId: string): Promise<number | null> {
  const admin = createAdminClient();

  const { data: tenantRow } = await admin
    .from("tenants")
    .select("subscription_plan, bonus_plan_slug, bonus_until")
    .eq("id", tenantId)
    .maybeSingle();
  if (!tenantRow) return null;

  const cortesiaAtiva = tenantRow.bonus_until ? new Date(tenantRow.bonus_until as string).getTime() > Date.now() : false;
  const planoSlug = (cortesiaAtiva && tenantRow.bonus_plan_slug ? tenantRow.bonus_plan_slug : tenantRow.subscription_plan) as
    | string
    | null;
  if (!planoSlug) return null;

  const { data: plano } = await admin.from("subscription_plans").select("id").eq("slug", planoSlug).maybeSingle();
  if (!plano) return null;

  const { data: regra } = await admin
    .from("plan_modules")
    .select("limit_value")
    .eq("plan_id", plano.id)
    .eq("module_slug", "ia")
    .maybeSingle();

  return (regra?.limit_value as number | null | undefined) ?? null;
}
