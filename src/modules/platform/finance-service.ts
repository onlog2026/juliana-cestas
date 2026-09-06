import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlatformTenant } from "./service";

/**
 * Leitura do lado financeiro da PLATAFORMA (o que as lojas pagam para nós),
 * que é coisa diferente do financeiro de cada loja (o que os clientes dela
 * pagam para ela).
 *
 * ATENÇÃO — o número daqui é ESTIMADO, não é dinheiro que entrou.
 * Enquanto não existir uma tabela de faturas pagas da plataforma, o único dado
 * disponível é "esta loja está marcada como ativa" + "o plano dela custa tanto".
 * Isso é uma projeção do que DEVERIA entrar, não do que entrou. A tela é
 * obrigada a dizer isso com todas as letras — no Agentop, um MRR calculado como
 * `quantidade × preço fixo` foi tratado como receita real por meses.
 *
 * Regras que valem em todo este arquivo:
 *  - dinheiro SEMPRE em centavos inteiros; só divide por 100 na hora de exibir;
 *  - preço vem do banco, resolvido por slug — nunca de um valor digitado;
 *  - plano que não existe em `subscription_plans` NÃO vira zero silencioso:
 *    a loja vai para uma lista separada e aparece na tela.
 */

/** Um plano de assinatura da plataforma, com o preço que o banco manda. */
export type PlanoDeAssinatura = {
  slug: string;
  name: string;
  /** Preço mensal em CENTAVOS. 0 = plano de cortesia (ex.: `fundadora`). */
  monthlyCents: number;
  isVisible: boolean;
};

type PlanoRow = {
  slug: string;
  name: string;
  monthly_cents: number | null;
  is_visible: boolean | null;
};

/**
 * Lê a tabela de planos. Erro de leitura LANÇA — se a lista de preços não
 * carregar, todo MRR calculado em cima dela seria mentira (todas as lojas
 * cairiam em "plano não reconhecido" e o dono leria isso como churn).
 */
export async function listSubscriptionPlans(): Promise<PlanoDeAssinatura[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("subscription_plans")
    .select("slug, name, monthly_cents, is_visible")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[platform/financeiro] falha ao ler os planos:", error);
    throw new Error("Não foi possível carregar a tabela de planos.");
  }

  return (data ?? []).map((row) => {
    const r = row as PlanoRow;
    return {
      slug: r.slug,
      name: r.name,
      monthlyCents: r.monthly_cents ?? 0,
      isVisible: r.is_visible ?? true,
    };
  });
}

/** Uma linha da quebra do MRR por plano. */
export type LinhaDePlano = {
  slug: string;
  nome: string;
  precoMensalCents: number;
  lojasAtivas: number;
  /** `precoMensalCents × lojasAtivas`, em centavos inteiros. */
  mrrCents: number;
};

/** Uma loja que aparece numa lista de exceção da tela. */
export type LojaDestacada = {
  id: string;
  nome: string;
  plano: string | null;
};

export type FatiaDeDistribuicao = {
  status: string;
  quantidade: number;
  percentual: number;
};

export type ResumoFinanceiro = {
  totalLojas: number;
  lojasAtivas: number;
  emTeste: number;
  inadimplentes: number;
  suspensas: number;
  canceladas: number;
  /** Soma, em centavos, dos planos das lojas ativas com plano reconhecido. */
  mrrCents: number;
  /** `mrrCents × 12`. Também estimado — mesma ressalva do MRR. */
  arrEstimadoCents: number;
  porPlano: LinhaDePlano[];
  /** Ativas em plano de R$ 0,00 (cortesia, ex.: `fundadora`). Não somam MRR. */
  lojasEmCortesia: LojaDestacada[];
  /** Ativas cujo `subscription_plan` não existe em `subscription_plans`. */
  lojasComPlanoNaoReconhecido: LojaDestacada[];
  distribuicao: FatiaDeDistribuicao[];
};

/** Ordem fixa das situações, para a lista não dançar a cada carregamento. */
const STATUS_ORDER = ["active", "trialing", "pending", "overdue", "canceled", "inactive"];

/**
 * Monta o resumo financeiro a partir das lojas já carregadas e da tabela de
 * planos. É função pura de propósito: nada aqui vai ao banco, então dá para
 * conferir o cálculo lendo o código.
 */
export function buildResumoFinanceiro(
  tenants: PlatformTenant[],
  planos: PlanoDeAssinatura[]
): ResumoFinanceiro {
  const porSlug = new Map(planos.map((p) => [p.slug, p]));

  const ativas = tenants.filter((t) => t.subscriptionStatus === "active");

  // Contagem de lojas ativas por slug de plano — inclusive slugs que não
  // existem na tabela de planos, que ficam separados logo abaixo.
  const ativasPorSlug = new Map<string, PlatformTenant[]>();
  const naoReconhecidas: LojaDestacada[] = [];

  for (const loja of ativas) {
    const slug = loja.subscriptionPlan;
    if (!slug || !porSlug.has(slug)) {
      // Nunca somar zero em silêncio: se o plano não é conhecido, o preço é
      // DESCONHECIDO, não é R$ 0,00. A tela mostra estas lojas numa lista à
      // parte para o dono corrigir o cadastro.
      naoReconhecidas.push({ id: loja.id, nome: loja.name, plano: slug });
      continue;
    }
    const atuais = ativasPorSlug.get(slug) ?? [];
    atuais.push(loja);
    ativasPorSlug.set(slug, atuais);
  }

  // Soma em centavos INTEIROS. Nada de dividir por 100 no meio da conta.
  let mrrCents = 0;
  const porPlano: LinhaDePlano[] = [];
  const lojasEmCortesia: LojaDestacada[] = [];

  for (const plano of planos) {
    const lojasDoPlano = ativasPorSlug.get(plano.slug) ?? [];
    if (lojasDoPlano.length === 0) continue;

    const subtotal = plano.monthlyCents * lojasDoPlano.length;
    mrrCents += subtotal;

    porPlano.push({
      slug: plano.slug,
      nome: plano.name,
      precoMensalCents: plano.monthlyCents,
      lojasAtivas: lojasDoPlano.length,
      mrrCents: subtotal,
    });

    if (plano.monthlyCents === 0) {
      for (const loja of lojasDoPlano) {
        lojasEmCortesia.push({ id: loja.id, nome: loja.name, plano: plano.name });
      }
    }
  }

  porPlano.sort((a, b) => b.mrrCents - a.mrrCents || a.nome.localeCompare(b.nome, "pt-BR"));

  const total = tenants.length;
  const porStatus: Record<string, number> = {};
  for (const t of tenants) {
    porStatus[t.subscriptionStatus] = (porStatus[t.subscriptionStatus] ?? 0) + 1;
  }

  const distribuicao =
    total > 0
      ? STATUS_ORDER.filter((s) => (porStatus[s] ?? 0) > 0).map((status) => {
          const quantidade = porStatus[status] ?? 0;
          return {
            status,
            quantidade,
            // Percentual é só para a barra e para o texto. Arredondar aqui não
            // afeta nenhum valor em dinheiro.
            percentual: Math.round((quantidade / total) * 100),
          };
        })
      : [];

  return {
    totalLojas: total,
    lojasAtivas: ativas.length,
    emTeste: porStatus["trialing"] ?? 0,
    inadimplentes: porStatus["overdue"] ?? 0,
    suspensas: tenants.filter((t) => t.status === "suspended").length,
    canceladas: porStatus["canceled"] ?? 0,
    mrrCents,
    arrEstimadoCents: mrrCents * 12,
    porPlano,
    lojasEmCortesia,
    lojasComPlanoNaoReconhecido: naoReconhecidas,
    distribuicao,
  };
}
