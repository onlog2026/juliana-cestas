import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { MODULE_SLUGS, MODULE_REGISTRY, FOUNDER_PLAN_SLUG } from "@/lib/modules/registry";
import {
  accountState,
  diasAte,
  resolveAllowedModules,
  resolveModuleAccess,
  type AccountState,
  type EntitlementConfig,
  type PlanModuleRule,
  type PlanRef,
  type TenantBilling,
} from "@/modules/entitlements/resolve";

/**
 * O SERVIÇO de direitos de acesso: lê o banco (loja + plano + regras do plano +
 * configuração da plataforma) e devolve o conjunto de módulos liberados.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DECISÃO IMPORTANTE, E DELIBERADA: **erro de leitura NÃO bloqueia a loja.**
 *
 * Se qualquer uma das consultas falhar (banco fora, variável de ambiente
 * faltando, coluna renomeada, rede caída), este serviço LIBERA TUDO, marca o
 * resultado como `degradado: true` e registra no `console.error`.
 *
 * O outro caminho -- negar quando a leitura falha -- é o "fail-closed" que a
 * docs/SUPER-ADMIN-SPEC.md recomenda para a lista do trial. Aqui a escolha é a
 * oposta, de propósito, e o motivo é o tamanho dos dois estragos:
 *
 *   - liberar demais por alguns minutos = alguém vê um menu a mais;
 *   - trancar o lojista fora do próprio painel por causa de uma consulta que
 *     falhou = ele não consegue despachar os pedidos do dia, e nem entende por
 *     quê.
 *
 * A loja da Juliana está em produção. Entre o menu completo por engano e o
 * painel vazio por engano, o menu completo é o erro barato.
 *
 * O gate de dinheiro de verdade (cobrança, webhook) NÃO segue esta regra --
 * aquilo é fail-closed. Isto aqui é só quem vê qual tela.
 * ───────────────────────────────────────────────────────────────────────────
 */

export type StaffLike = {
  tenantId: string;
  isSuperAdmin: boolean;
};

export type TenantEntitlements = {
  tenantId: string;
  /** Slug do plano contratado (ou o da cortesia, se ela estiver valendo). */
  planSlug: string | null;
  /** Nome do plano para mostrar na tela. `null` se o plano não foi encontrado. */
  planName: string | null;
  state: AccountState;
  /** Fim do teste, como veio do banco (ISO). */
  trialEndsAt: string | null;
  /** Dias inteiros que faltam para o teste acabar. `null` quando não há teste. */
  diasDeTesteRestantes: number | null;
  /** Slugs liberados NESTA requisição, já resolvidos pela regra pura. */
  allowed: string[];
  /**
   * `true` = a leitura falhou e liberamos tudo por segurança. Quem mostra
   * banner/telemetria deve olhar isto antes de afirmar qualquer coisa sobre o
   * plano do lojista.
   */
  degradado: boolean;
};

/** Módulo liberado para esta loja? */
export function moduloLiberado(ent: TenantEntitlements, slug: string): boolean {
  return ent.allowed.includes((slug ?? "").trim().toLowerCase());
}

/** Tudo liberado -- a resposta quando a leitura falha (ver decisão acima). */
function liberaTudo(tenantId: string, motivo: string, erro?: unknown): TenantEntitlements {
  console.error(`[entitlements] ${motivo} -- liberando todos os módulos por segurança.`, erro ?? "");
  return {
    tenantId,
    planSlug: null,
    planName: null,
    state: "ok",
    trialEndsAt: null,
    diasDeTesteRestantes: null,
    allowed: [...MODULE_SLUGS],
    degradado: true,
  };
}

type BillingContext = {
  tenant: TenantBilling;
  plan: PlanRef;
  planModules: Record<string, PlanModuleRule[]>;
  config: EntitlementConfig;
};

const TENANT_COLUMNS =
  "subscription_plan, subscription_status, trial_ends_at, paid_until, bonus_until, bonus_plan_slug, granted_modules, granted_modules_until";

/**
 * Lê do banco tudo o que a regra precisa. Uma vez por requisição (`cache()` do
 * React), mesmo que dez componentes perguntem.
 *
 * Lança em qualquer falha -- quem trata é `getEntitlements`, que transforma a
 * falha em "libera tudo". A separação existe para o caminho de erro ficar num
 * lugar só e visível.
 */
const loadBillingContext = cache(async (tenantId: string): Promise<BillingContext> => {
  const admin = createAdminClient();

  const { data: tenantRow, error: tenantError } = await admin
    .from("tenants")
    .select(TENANT_COLUMNS)
    .eq("id", tenantId)
    .maybeSingle();

  // `.select()` do Supabase não lança: devolve `{ error }`. Sem checar, a falha
  // vira "loja sem plano" em silêncio.
  if (tenantError) throw new Error(`falha ao ler a loja: ${tenantError.message}`);
  if (!tenantRow) throw new Error("loja não encontrada");

  const tenant: TenantBilling = {
    subscriptionPlan: (tenantRow.subscription_plan as string | null) ?? null,
    subscriptionStatus: (tenantRow.subscription_status as string | null) ?? null,
    trialEndsAt: (tenantRow.trial_ends_at as string | null) ?? null,
    paidUntil: (tenantRow.paid_until as string | null) ?? null,
    bonusUntil: (tenantRow.bonus_until as string | null) ?? null,
    bonusPlanSlug: (tenantRow.bonus_plan_slug as string | null) ?? null,
    grantedModules: (tenantRow.granted_modules as string[] | null) ?? [],
    grantedModulesUntil: (tenantRow.granted_modules_until as string | null) ?? null,
  };

  // Os dois planos que podem valer: o contratado e o da cortesia.
  const slugs = [tenant.subscriptionPlan, tenant.bonusPlanSlug].filter(
    (s): s is string => typeof s === "string" && s.length > 0
  );

  let plan: PlanRef = null;
  const planModules: Record<string, PlanModuleRule[]> = {};

  if (slugs.length > 0) {
    const { data: planRows, error: planError } = await admin
      .from("subscription_plans")
      .select("id, slug, name")
      .in("slug", slugs);
    if (planError) throw new Error(`falha ao ler os planos: ${planError.message}`);

    const planos = (planRows ?? []) as { id: string; slug: string; name: string }[];
    plan = planos.find((p) => p.slug === tenant.subscriptionPlan) ?? null;

    if (planos.length > 0) {
      const { data: ruleRows, error: ruleError } = await admin
        .from("plan_modules")
        .select("plan_id, module_slug, status")
        .in(
          "plan_id",
          planos.map((p) => p.id)
        );
      if (ruleError) throw new Error(`falha ao ler as regras do plano: ${ruleError.message}`);

      const slugPorId = new Map(planos.map((p) => [p.id, p.slug]));
      for (const p of planos) planModules[p.slug] = [];
      for (const row of (ruleRows ?? []) as { plan_id: string; module_slug: string; status: string }[]) {
        const planSlug = slugPorId.get(row.plan_id);
        if (!planSlug) continue;
        planModules[planSlug].push({
          moduleSlug: row.module_slug,
          status: (row.status as PlanModuleRule["status"]) ?? "excluded",
        });
      }
    }
  }

  const { data: cfgRow, error: cfgError } = await admin
    .from("saas_config")
    .select("trial_module_slugs")
    .eq("id", 1)
    .maybeSingle();
  if (cfgError) throw new Error(`falha ao ler a configuração da plataforma: ${cfgError.message}`);

  const config: EntitlementConfig = {
    // Ausente = o teste libera tudo. É o padrão declarado na migração 0026.
    trialModuleSlugs: (cfgRow?.trial_module_slugs as string[] | null) ?? null,
  };

  return { tenant, plan, planModules, config };
});

/**
 * Os direitos de acesso desta loja, nesta requisição.
 *
 * NUNCA lança. No pior caso devolve tudo liberado com `degradado: true`.
 */
export async function getEntitlements(staff: StaffLike): Promise<TenantEntitlements> {
  if (!staff?.tenantId) return liberaTudo("", "requisição sem loja no contexto");

  let ctx: BillingContext;
  try {
    ctx = await loadBillingContext(staff.tenantId);
  } catch (e) {
    return liberaTudo(staff.tenantId, `não foi possível ler os direitos da loja ${staff.tenantId}`, e);
  }

  try {
    const agora = new Date();
    const base = {
      tenant: ctx.tenant,
      plan: ctx.plan,
      planModules: ctx.planModules,
      staff: { isSuperAdmin: staff.isSuperAdmin },
      agora,
      config: ctx.config,
    };

    const allowed = resolveAllowedModules(base, MODULE_SLUGS);
    const state = accountState(ctx.tenant, agora);

    return {
      tenantId: staff.tenantId,
      planSlug: ctx.plan?.slug ?? ctx.tenant.subscriptionPlan ?? null,
      planName: ctx.plan?.name ?? null,
      state,
      trialEndsAt: typeof ctx.tenant.trialEndsAt === "string" ? ctx.tenant.trialEndsAt : null,
      diasDeTesteRestantes: state === "teste" ? diasAte(ctx.tenant.trialEndsAt, agora) : null,
      allowed,
      degradado: false,
    };
  } catch (e) {
    // A regra é pura e testada, mas se um dia ela lançar por um dado
    // inesperado, o painel continua de pé.
    return liberaTudo(staff.tenantId, "a regra de acesso falhou", e);
  }
}

/**
 * Uma pergunta só: esta loja pode usar este módulo?
 * Usa o mesmo caminho (e o mesmo cache) de `getEntitlements`.
 */
export async function canUseModule(staff: StaffLike, slug: string): Promise<boolean> {
  const ent = await getEntitlements(staff);
  return moduloLiberado(ent, slug);
}

/**
 * A resposta detalhada (com o motivo) para UM módulo. É o que a página de
 * oferta usa para explicar por que aquela tela não está disponível.
 *
 * Em modo degradado devolve liberado com motivo `leitura_indisponivel`.
 */
export async function explainModule(staff: StaffLike, slug: string): Promise<{ allowed: boolean; reason: string }> {
  if (!staff?.tenantId) return { allowed: true, reason: "leitura_indisponivel" };
  let ctx: BillingContext;
  try {
    ctx = await loadBillingContext(staff.tenantId);
  } catch (e) {
    console.error("[entitlements] explicação indisponível, tratando como liberado:", e);
    return { allowed: true, reason: "leitura_indisponivel" };
  }
  return resolveModuleAccess({
    tenant: ctx.tenant,
    plan: ctx.plan,
    planModules: ctx.planModules,
    staff: { isSuperAdmin: staff.isSuperAdmin },
    module: slug,
    agora: new Date(),
    config: ctx.config,
  });
}

/**
 * Só para telas de oferta/upsell: os módulos que existem e NÃO estão liberados.
 * Fora do menu, porque menu mostra o que dá para usar -- oferta é outra tela.
 */
export function modulosNaoLiberados(ent: TenantEntitlements) {
  return MODULE_REGISTRY.filter((m) => !ent.allowed.includes(m.slug));
}

/** Exportado para quem precisa comparar com o plano da primeira loja. */
export { FOUNDER_PLAN_SLUG };
