import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PLATFORM_DEFAULTS,
  PLATFORM_SECTIONS,
  type PlatformContent,
  type PlatformSection,
} from "@/modules/platform/landing-content";

/**
 * Leitura do conteúdo da landing da plataforma e dos planos que ela mostra.
 *
 * Duas regras diferentes, de propósito:
 *
 * - **Falha de leitura LANÇA.** Nunca vira `{}` nem lista vazia. No Agentop
 *   uma coluna inexistente derrubava a consulta, o `data || []` engolia o erro
 *   e a tela aparecia vazia sem ninguém saber por quê. Quem chama decide o que
 *   fazer com a exceção -- mas fica sabendo que houve exceção.
 * - **Conteúdo fora do formato cai no padrão.** Se o schema mudou depois de
 *   alguém salvar, é melhor mostrar o texto padrão do que derrubar a página de
 *   vendas. É o mesmo comportamento de `src/modules/content/service.ts`.
 */

type RawContent = Partial<Record<PlatformSection, unknown>>;

/**
 * Carrega TODAS as seções da plataforma de uma vez.
 *
 * `tenant_id is null` é o que marca "conteúdo da plataforma" -- não existe
 * loja com id nulo. `.is("tenant_id", null)` (e não `.eq`) porque no SQL nada
 * é igual a NULL.
 */
const loadAll = cache(async (): Promise<RawContent> => {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_content")
    .select("section, payload")
    .is("tenant_id", null)
    .eq("surface", "platform")
    .eq("slot", "default");

  if (error) {
    throw new Error(`Não foi possível ler o conteúdo da plataforma: ${error.message}`);
  }

  const out: RawContent = {};
  for (const row of data ?? []) out[row.section as PlatformSection] = row.payload;
  return out;
});

function parse<K extends PlatformSection>(section: K, raw: unknown): PlatformContent[K] {
  if (raw === undefined) return PLATFORM_DEFAULTS[section];

  const parsed = PLATFORM_SECTIONS[section].safeParse(raw);
  if (!parsed.success) {
    console.error(`[landing] seção "${section}" gravada fora do formato`, parsed.error.flatten());
    return PLATFORM_DEFAULTS[section];
  }
  return parsed.data as PlatformContent[K];
}

/** Uma seção da landing, já validada (ou o padrão). */
export async function getPlatformContent<K extends PlatformSection>(section: K): Promise<PlatformContent[K]> {
  const all = await loadAll();
  return parse(section, all[section]);
}

/** Todas as seções de uma vez -- é o que a página `/plataforma` precisa. */
export async function getAllPlatformContent(): Promise<PlatformContent> {
  const all = await loadAll();
  return {
    hero: parse("hero", all.hero),
    audiences: parse("audiences", all.audiences),
    features: parse("features", all.features),
    steps: parse("steps", all.steps),
    plans_intro: parse("plans_intro", all.plans_intro),
    faq: parse("faq", all.faq),
    closing: parse("closing", all.closing),
    branding: parse("branding", all.branding),
  };
}

/** Só para o editor: o valor + se já foi personalizado (habilita "voltar ao padrão"). */
export async function getPlatformContentForAdmin<K extends PlatformSection>(
  section: K
): Promise<{ value: PlatformContent[K]; isCustom: boolean }> {
  const all = await loadAll();
  return { value: parse(section, all[section]), isCustom: all[section] !== undefined };
}

/* ────────────────────────── Planos da vitrine ────────────────────────── */

/** Um módulo do jeito que a landing mostra. */
export type PlanFeature = {
  slug: string;
  name: string;
  /** Texto de vitrine ("até 500 produtos"). Nunca é trava -- a trava é `limit_value`. */
  limitDisplay: string | null;
};

export type PublicPlan = {
  slug: string;
  name: string;
  badge: string | null;
  description: string | null;
  /** SEMPRE em centavos. Duas unidades de dinheiro na mesma tela já custou incidente. */
  monthlyCents: number;
  isAnchor: boolean;
  included: PlanFeature[];
  addons: PlanFeature[];
};

type PlanRow = {
  id: string;
  slug: string;
  name: string;
  badge: string | null;
  description: string | null;
  monthly_cents: number;
  is_anchor: boolean;
  sort_order: number;
};

/**
 * Os planos que aparecem na landing: só `is_visible = true`, na ordem de
 * `sort_order`, com preço vindo do banco em centavos.
 *
 * Nunca devolve preço que não esteja gravado. Se a leitura falhar, LANÇA --
 * quem chama mostra "não foi possível carregar", que é diferente de "não há
 * planos". Confundir os dois é como se vende um plano que não existe.
 */
export async function listPublicPlans(): Promise<PublicPlan[]> {
  const supabase = createAdminClient();

  const { data: planRows, error: planError } = await supabase
    .from("subscription_plans")
    .select("id, slug, name, badge, description, monthly_cents, is_anchor, sort_order")
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });

  if (planError) {
    throw new Error(`Não foi possível ler os planos: ${planError.message}`);
  }

  const plans = (planRows ?? []) as PlanRow[];
  if (plans.length === 0) return [];

  const { data: linkRows, error: linkError } = await supabase
    .from("plan_modules")
    .select("plan_id, module_slug, status, limit_display")
    .in(
      "plan_id",
      plans.map((p) => p.id)
    );

  if (linkError) {
    throw new Error(`Não foi possível ler o que cada plano inclui: ${linkError.message}`);
  }

  const { data: moduleRows, error: moduleError } = await supabase
    .from("platform_modules")
    .select("slug, name, sort_order");

  if (moduleError) {
    throw new Error(`Não foi possível ler a lista de recursos: ${moduleError.message}`);
  }

  const moduleName = new Map<string, string>();
  const moduleOrder = new Map<string, number>();
  for (const m of (moduleRows ?? []) as { slug: string; name: string; sort_order: number }[]) {
    moduleName.set(m.slug, m.name);
    moduleOrder.set(m.slug, m.sort_order);
  }

  const links = (linkRows ?? []) as {
    plan_id: string;
    module_slug: string;
    status: string;
    limit_display: string | null;
  }[];

  return plans.map((plan) => {
    const doPlano = links.filter((l) => l.plan_id === plan.id);

    const pega = (status: string): PlanFeature[] =>
      doPlano
        .filter((l) => l.status === status)
        // Módulo que existe no vínculo mas sumiu da lista fechada não vira
        // linha sem nome na vitrine -- some.
        .filter((l) => moduleName.has(l.module_slug))
        .sort((a, b) => (moduleOrder.get(a.module_slug) ?? 0) - (moduleOrder.get(b.module_slug) ?? 0))
        .map((l) => ({
          slug: l.module_slug,
          name: moduleName.get(l.module_slug)!,
          limitDisplay: l.limit_display,
        }));

    return {
      slug: plan.slug,
      name: plan.name,
      badge: plan.badge,
      description: plan.description,
      monthlyCents: plan.monthly_cents,
      isAnchor: plan.is_anchor,
      included: pega("included"),
      addons: pega("addon"),
    };
  });
}
