import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { listPublicPlans, type PublicPlan } from "@/modules/platform/landing-service";

/**
 * O que a página pública `/planos` precisa saber.
 *
 * Existe para NÃO repetir a leitura de preço. Os planos vêm da mesma função
 * que a landing usa (`listPublicPlans`): uma leitura só, uma regra só de
 * "o que é visível", um lugar só onde centavos viram reais. Duas leituras de
 * preço em dois arquivos é como se chega em duas páginas mostrando valores
 * diferentes para o mesmo plano.
 *
 * Os três estados continuam sendo três, como na landing:
 *   - `plans` com itens  → mostra os planos;
 *   - `plans` vazio      → não há plano publicado (verdade);
 *   - `plans === null`   → a leitura FALHOU (também verdade, e diferente).
 *
 * O mesmo vale para `trialDays`: `null` significa "não consegui ler". A página
 * então não fala em teste grátis, em vez de prometer um número que não veio
 * do banco.
 */

export type PublicPlansPage = {
  plans: PublicPlan[] | null;
  trialDays: number | null;
};

export async function getPublicPlansPage(): Promise<PublicPlansPage> {
  const [plans, trialDays] = await Promise.all([lerPlanos(), lerDiasDeTeste()]);
  return { plans, trialDays };
}

async function lerPlanos(): Promise<PublicPlan[] | null> {
  try {
    return await listPublicPlans();
  } catch (e) {
    // O detalhe fica no log do servidor: a mensagem do PostgREST numa página
    // pública entrega nome de tabela e de esquema para qualquer visitante.
    console.error("[planos] falha ao ler os planos:", e);
    return null;
  }
}

/**
 * Dias de teste grátis, direto de `saas_config`.
 *
 * Leitura própria (e não `getPlatformConfig()`) porque aquela função lança de
 * propósito — ela serve à tela de configuração do dono, onde mostrar padrão no
 * lugar do valor real faria o dono salvar por cima sem saber. Aqui é uma
 * página de vendas: se a leitura falhar, o certo é ficar em silêncio sobre o
 * teste, não derrubar a página nem inventar "2 dias".
 */
async function lerDiasDeTeste(): Promise<number | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("saas_config").select("trial_days").eq("id", 1).maybeSingle();
    if (error || !data) {
      if (error) console.error("[planos] falha ao ler os dias de teste:", error);
      return null;
    }
    const dias = Number((data as { trial_days: number }).trial_days);
    return Number.isFinite(dias) && dias >= 0 ? dias : null;
  } catch (e) {
    console.error("[planos] falha ao ler os dias de teste:", e);
    return null;
  }
}
