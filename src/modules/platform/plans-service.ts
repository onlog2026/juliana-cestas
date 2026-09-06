import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Leitura dos planos da plataforma e das regras "plano × módulo".
 *
 * Duas decisões que vieram de erro real no Agentop (docs/SUPER-ADMIN-SPEC.md):
 *
 *  1. DINHEIRO SEMPRE EM CENTAVOS no banco. A tela mostra e recebe REAIS, mas
 *     a conversão acontece num lugar só -- as funções deste arquivo, que têm
 *     teste (tests/unit/plans.test.ts). Lá, um campo estava em centavos e
 *     outro em reais na MESMA tela.
 *  2. `limit_display` (o texto que o cliente lê) é SEPARADO de `limit_value`
 *     (o número que o servidor obedece). Lá era um campo só, de texto livre,
 *     que parecia trava e não travava nada -- o dono achava que estava
 *     limitando e não estava.
 *
 * Como em `service.ts`: erro de leitura LANÇA. Nunca vira lista vazia, porque
 * lista vazia por engano faz o painel mentir "não existe nenhum plano".
 */

export type PlanModuleStatus = "included" | "addon" | "excluded";

export type PlatformModule = {
  slug: string;
  name: string;
  description: string | null;
  category: string;
  isCore: boolean;
  sortOrder: number;
};

export type PlanModuleRule = {
  moduleSlug: string;
  status: PlanModuleStatus;
  /** Texto de vitrine. Exemplo: "até 500 produtos". NÃO trava nada. */
  limitDisplay: string | null;
  /** O número que o servidor obedece. `null` = sem limite. */
  limitValue: number | null;
};

export type SubscriptionPlan = {
  id: string;
  slug: string;
  name: string;
  badge: string | null;
  description: string | null;
  monthlyCents: number;
  annualDiscountPct: number;
  maxProducts: number | null;
  maxTeamMembers: number | null;
  isVisible: boolean;
  isAnchor: boolean;
  sortOrder: number;
  modules: PlanModuleRule[];
  /** Quantas lojas estão neste plano hoje (conta `tenants.subscription_plan`). */
  lojasUsando: number;
};

/**
 * O que o formulário manda de volta para o servidor.
 *
 * Repare que preço, desconto e limites viajam como TEXTO: quem digita escreve
 * "129,90" e quem converte é o servidor, com a função testada abaixo. Assim
 * não existe nenhum caminho em que o navegador decide quantos centavos gravar.
 */
export type PlanFormInput = {
  slug: string;
  name: string;
  badge: string;
  description: string;
  /** Em REAIS, como a pessoa digitou. Exemplo: "129,90". */
  precoMensalTexto: string;
  /** Percentual de desconto no plano anual. Exemplo: "20". */
  descontoAnualTexto: string;
  maxProductsTexto: string;
  maxTeamMembersTexto: string;
  isVisible: boolean;
  isAnchor: boolean;
  sortOrderTexto: string;
};

export type PlanModuleFormRow = {
  moduleSlug: string;
  status: PlanModuleStatus;
  limitDisplay: string;
  limitValueTexto: string;
};

// ── Dinheiro: um lugar só faz a conversão ───────────────────────────────────

const moedaBR = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Centavos -> "R$ 1.234,56" (para LER na tela).
 * O espaço fino que o Intl coloca vira espaço comum, para o texto ficar
 * previsível em teste e em qualquer navegador.
 */
export function formatCentsToReais(cents: number): string {
  if (!Number.isFinite(cents)) return "R$ 0,00";
  // O Intl usa espaco invisivel (U+00A0 ou U+202F) antes do numero, e ele
  // muda conforme a versao do Node. Vira espaco comum: o texto e sempre igual.
  return moedaBR.format(Math.round(cents) / 100).replace(/[\u00a0\u202f]/g, " ");
}

/** Centavos -> "1234,56" (para PREENCHER o campo do formulário). */
export function centsToInputValue(cents: number): string {
  if (!Number.isFinite(cents)) return "0,00";
  return (Math.round(cents) / 100).toFixed(2).replace(".", ",");
}

/**
 * "R$ 1.234,56" / "1234,56" / "1234.56" / "1234" -> 123456 centavos.
 * Devolve `null` quando o texto não é um valor de dinheiro válido -- e quem
 * chama TEM que tratar esse `null` com mensagem de erro, nunca com um valor
 * padrão. (No Agentop, o caminho de erro caía no que o navegador mandava e
 * dava para assinar o plano máximo por R$ 1,00.)
 */
export function parseReaisToCents(entrada: string): number | null {
  const bruto = (entrada ?? "").toString().trim();
  if (!bruto) return null;

  let texto = bruto.replace(/^r\$/i, "").replace(/[\s\u00a0]/g, "");
  if (!texto) return null;
  // Só dígitos, ponto e vírgula. Nada de sinal, letra ou expressão.
  if (!/^\d[\d.,]*$/.test(texto)) return null;

  const temVirgula = texto.includes(",");
  const temPonto = texto.includes(".");

  if (temVirgula && temPonto) {
    // "1.234,56" -- ponto é separador de milhar, vírgula é o decimal.
    texto = texto.replace(/\./g, "").replace(",", ".");
  } else if (temVirgula) {
    texto = texto.replace(",", ".");
  } else if (temPonto) {
    // "1.234" é mil duzentos e trinta e quatro; "12.34" é doze e trinta e
    // quatro. Três dígitos depois do último ponto = separador de milhar.
    const partes = texto.split(".");
    if (partes[partes.length - 1].length === 3) texto = partes.join("");
  }

  if (!/^\d+(\.\d{1,2})?$/.test(texto)) return null;

  const reais = Number(texto);
  if (!Number.isFinite(reais) || reais < 0) return null;
  return Math.round(reais * 100);
}

/**
 * Campo numérico opcional (limite de produtos, limite do módulo, ordem…).
 * Vazio quer dizer "sem limite" e é resposta VÁLIDA -- por isso o retorno
 * separa "deu certo e é null" de "o texto está errado".
 */
export function parseNumeroOpcional(
  entrada: string,
  opcoes: { min?: number; max?: number } = {}
): { ok: true; valor: number | null } | { ok: false } {
  const texto = (entrada ?? "").toString().trim();
  if (!texto) return { ok: true, valor: null };
  if (!/^\d+$/.test(texto)) return { ok: false };
  const valor = Number(texto);
  if (!Number.isFinite(valor)) return { ok: false };
  if (opcoes.min !== undefined && valor < opcoes.min) return { ok: false };
  if (opcoes.max !== undefined && valor > opcoes.max) return { ok: false };
  return { ok: true, valor };
}

/** Percentual de 0 a 100, aceitando vírgula ("12,5"). Vazio = 0. */
export function parsePercentual(entrada: string): number | null {
  const texto = (entrada ?? "").toString().trim().replace(",", ".").replace("%", "");
  if (!texto) return 0;
  if (!/^\d+(\.\d{1,2})?$/.test(texto)) return null;
  const valor = Number(texto);
  if (!Number.isFinite(valor) || valor < 0 || valor > 100) return null;
  return valor;
}

/**
 * Transforma "Plano Essencial" em "plano-essencial".
 * O slug é a chave que o resto do sistema usa para reconhecer o plano, então
 * ele não pode aceitar acento, espaço nem maiúscula.
 */
export function normalizarSlug(entrada: string): string {
  return (entrada ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // tira o acento que o NFD separou
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/**
 * Quanto sai o mês quando a loja paga o ano inteiro adiantado.
 * Fonte única do preço anual: um percentual só, aplicado sempre aqui.
 * (No Agentop um card mostrava "Anual: R$ 1.078,92/mês" porque lia um campo
 * aposentado que guardava o total do ano.)
 */
export function mensalidadeAnualEmCentavos(monthlyCents: number, descontoPct: number): number {
  const fator = 1 - (Number.isFinite(descontoPct) ? descontoPct : 0) / 100;
  return Math.round(monthlyCents * fator);
}

// ── Leitura ─────────────────────────────────────────────────────────────────

type ModuleRow = {
  slug: string;
  name: string;
  description: string | null;
  category: string;
  is_core: boolean;
  sort_order: number;
};

type PlanRow = {
  id: string;
  slug: string;
  name: string;
  badge: string | null;
  description: string | null;
  monthly_cents: number;
  annual_discount_pct: number | string;
  max_products: number | null;
  max_team_members: number | null;
  is_visible: boolean;
  is_anchor: boolean;
  sort_order: number;
};

type PlanModuleRow = {
  plan_id: string;
  module_slug: string;
  status: string;
  limit_display: string | null;
  limit_value: number | null;
};

/** Todos os módulos que o sistema SABE entregar (lista fechada, vem do banco). */
export async function listPlatformModules(): Promise<PlatformModule[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("platform_modules")
    .select("slug, name, description, category, is_core, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[planos] falha ao listar módulos:", error);
    throw new Error("Não foi possível carregar a lista de módulos da plataforma.");
  }

  return (data ?? []).map((r) => {
    const row = r as ModuleRow;
    return {
      slug: row.slug,
      name: row.name,
      description: row.description,
      category: row.category,
      isCore: row.is_core === true,
      sortOrder: row.sort_order ?? 0,
    };
  });
}

/** Quantas lojas usam cada plano, contando por `tenants.subscription_plan`. */
async function contarLojasPorPlano(): Promise<Record<string, number>> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("tenants").select("subscription_plan");

  if (error) {
    console.error("[planos] falha ao contar lojas por plano:", error);
    throw new Error("Não foi possível contar quantas lojas usam cada plano.");
  }

  const contagem: Record<string, number> = {};
  for (const linha of data ?? []) {
    const slug = (linha as { subscription_plan: string | null }).subscription_plan;
    if (!slug) continue;
    contagem[slug] = (contagem[slug] ?? 0) + 1;
  }
  return contagem;
}

/** Todos os planos, na ordem de exibição, já com as regras de cada módulo. */
export async function listPlans(): Promise<SubscriptionPlan[]> {
  const admin = createAdminClient();

  const { data: planosData, error: planosErro } = await admin
    .from("subscription_plans")
    .select(
      "id, slug, name, badge, description, monthly_cents, annual_discount_pct, max_products, max_team_members, is_visible, is_anchor, sort_order"
    )
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (planosErro) {
    console.error("[planos] falha ao listar planos:", planosErro);
    throw new Error("Não foi possível carregar os planos.");
  }

  const { data: regrasData, error: regrasErro } = await admin
    .from("plan_modules")
    .select("plan_id, module_slug, status, limit_display, limit_value");

  if (regrasErro) {
    console.error("[planos] falha ao ler as regras de plano × módulo:", regrasErro);
    throw new Error("Não foi possível carregar o que cada plano libera.");
  }

  const lojasPorPlano = await contarLojasPorPlano();

  const regrasPorPlano = new Map<string, PlanModuleRule[]>();
  for (const r of regrasData ?? []) {
    const row = r as PlanModuleRow;
    const lista = regrasPorPlano.get(row.plan_id) ?? [];
    lista.push({
      moduleSlug: row.module_slug,
      status: (["included", "addon", "excluded"] as const).includes(row.status as PlanModuleStatus)
        ? (row.status as PlanModuleStatus)
        : "excluded",
      limitDisplay: row.limit_display,
      limitValue: row.limit_value,
    });
    regrasPorPlano.set(row.plan_id, lista);
  }

  return (planosData ?? []).map((p) => {
    const row = p as PlanRow;
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      badge: row.badge,
      description: row.description,
      monthlyCents: row.monthly_cents ?? 0,
      // `numeric` no Postgres chega como string pelo PostgREST.
      annualDiscountPct: Number(row.annual_discount_pct ?? 0),
      maxProducts: row.max_products,
      maxTeamMembers: row.max_team_members,
      isVisible: row.is_visible !== false,
      isAnchor: row.is_anchor === true,
      sortOrder: row.sort_order ?? 0,
      modules: regrasPorPlano.get(row.id) ?? [],
      lojasUsando: lojasPorPlano[row.slug] ?? 0,
    };
  });
}
