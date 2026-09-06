import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** Uma loja, do ponto de vista de quem administra a plataforma. */
export type PlatformTenant = {
  id: string;
  slug: string;
  name: string;
  ownerEmail: string | null;
  status: "active" | "suspended";
  subscriptionStatus: "trialing" | "active" | "pending" | "overdue" | "canceled" | "inactive";
  subscriptionPlan: string | null;
  trialEndsAt: string | null;
  paidUntil: string | null;
  bonusUntil: string | null;
  bonusReason: string | null;
  bonusPlanSlug: string | null;
  bonusGrantedBy: string | null;
  bonusGrantedAt: string | null;
  grantedModules: string[];
  grantedModulesUntil: string | null;
  createdAt: string;
};

const COLUMNS =
  "id, slug, name, owner_email, status, subscription_status, subscription_plan, trial_ends_at, paid_until, bonus_until, bonus_reason, bonus_plan_slug, bonus_granted_by, bonus_granted_at, granted_modules, granted_modules_until, created_at";

type Row = {
  id: string;
  slug: string;
  name: string;
  owner_email: string | null;
  status: string;
  subscription_status: string;
  subscription_plan: string | null;
  trial_ends_at: string | null;
  paid_until: string | null;
  bonus_until: string | null;
  bonus_reason: string | null;
  bonus_plan_slug: string | null;
  bonus_granted_by: string | null;
  bonus_granted_at: string | null;
  granted_modules: string[] | null;
  granted_modules_until: string | null;
  created_at: string;
};

function map(row: Row): PlatformTenant {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    ownerEmail: row.owner_email,
    status: (row.status as PlatformTenant["status"]) ?? "active",
    subscriptionStatus: (row.subscription_status as PlatformTenant["subscriptionStatus"]) ?? "trialing",
    subscriptionPlan: row.subscription_plan,
    trialEndsAt: row.trial_ends_at,
    paidUntil: row.paid_until,
    bonusUntil: row.bonus_until,
    bonusReason: row.bonus_reason,
    bonusPlanSlug: row.bonus_plan_slug,
    bonusGrantedBy: row.bonus_granted_by,
    bonusGrantedAt: row.bonus_granted_at,
    grantedModules: row.granted_modules ?? [],
    grantedModulesUntil: row.granted_modules_until,
    createdAt: row.created_at,
  };
}

export async function listTenants(): Promise<PlatformTenant[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("tenants").select(COLUMNS).order("created_at", { ascending: false });
  if (error) {
    // Erro de leitura NÃO vira lista vazia silenciosa -- no Agentop isso fez
    // uma tela aparecer vazia por dias sem ninguém saber por quê.
    console.error("[platform] falha ao listar lojas:", error);
    throw new Error("Não foi possível carregar as lojas.");
  }
  return (data ?? []).map((r) => map(r as Row));
}

export async function getTenantById(id: string): Promise<PlatformTenant | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("tenants").select(COLUMNS).eq("id", id).maybeSingle();
  if (error) {
    console.error("[platform] falha ao carregar loja:", error);
    throw new Error("Não foi possível carregar a loja.");
  }
  return data ? map(data as Row) : null;
}

export type PlatformOverview = {
  total: number;
  porStatus: Record<string, number>;
  emTrial: number;
  inadimplentes: number;
  suspensas: number;
};

export async function getOverview(tenants: PlatformTenant[]): Promise<PlatformOverview> {
  const porStatus: Record<string, number> = {};
  for (const t of tenants) porStatus[t.subscriptionStatus] = (porStatus[t.subscriptionStatus] ?? 0) + 1;
  return {
    total: tenants.length,
    porStatus,
    emTrial: tenants.filter((t) => t.subscriptionStatus === "trialing").length,
    inadimplentes: tenants.filter((t) => t.subscriptionStatus === "overdue").length,
    suspensas: tenants.filter((t) => t.status === "suspended").length,
  };
}

/** Últimas ações do super admin, para a tela de auditoria. */
export async function listAuditLogs(limit = 50) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("audit_logs")
    .select("id, tenant_id, actor_email, action, target, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[platform] falha ao ler auditoria:", error);
    return [];
  }
  return data ?? [];
}
