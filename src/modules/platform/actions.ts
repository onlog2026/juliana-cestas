"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

type Result = { ok: true } | { ok: false; error: string };

/**
 * Toda ação do super admin sobre uma loja passa por aqui e **grava auditoria**.
 *
 * No Agentop não existe registro de "quem entrou na loja de quem e mudou o
 * quê" -- uma edição feita por engano fica indistinguível de uma edição do
 * próprio lojista. Numa plataforma que mexe com dinheiro de terceiros, isso
 * precisa ter resposta.
 */
async function audit(
  tenantId: string | null,
  actorEmail: string,
  action: string,
  target: string | null,
  before: unknown,
  after: unknown
) {
  const admin = createAdminClient();
  const { error } = await admin.from("audit_logs").insert({
    tenant_id: tenantId,
    actor_email: actorEmail,
    action,
    target,
    before: before ?? null,
    after: after ?? null,
  });
  // Auditoria não pode derrubar a ação, mas silêncio total esconde problema.
  if (error) console.error("[platform] falha ao gravar auditoria:", error);
}

async function loadTenant(id: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("tenants")
    .select("id, slug, name, status, subscription_status, subscription_plan, trial_ends_at, bonus_until, bonus_plan_slug, bonus_reason, asaas_subscription_id")
    .eq("id", id)
    .maybeSingle();
  return data;
}

/**
 * Libera acesso manualmente, SEM criar cobrança.
 * A tela precisa deixar isso explícito -- no Agentop o dono achava que
 * "ativar" religava a cobrança, e não religa.
 */
export async function activateTenant(tenantId: string): Promise<Result> {
  const platformAdmin = await requireSuperAdmin();
  const before = await loadTenant(tenantId);
  if (!before) return { ok: false, error: "Loja não encontrada." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tenants")
    .update({ subscription_status: "active", status: "active" })
    .eq("id", tenantId)
    .select("id");

  if (error || !data || data.length === 0) {
    return { ok: false, error: "Não foi possível ativar a loja." };
  }

  await audit(tenantId, platformAdmin.email, "loja_ativada_manualmente", before.slug, before, {
    subscription_status: "active",
  });
  revalidatePath("/super/lojas");
  revalidatePath(`/super/lojas/${tenantId}`);
  return { ok: true };
}

/**
 * Suspende a VITRINE da loja (o site sai do ar), mantendo o painel acessível
 * para o lojista resolver a pendência. No Agentop as duas coisas eram a mesma
 * — numa plataforma de lojas não podem ser.
 */
export async function suspendStorefront(tenantId: string, motivo: string): Promise<Result> {
  const platformAdmin = await requireSuperAdmin();
  const before = await loadTenant(tenantId);
  if (!before) return { ok: false, error: "Loja não encontrada." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tenants")
    .update({ status: "suspended" })
    .eq("id", tenantId)
    .select("id");

  if (error || !data || data.length === 0) return { ok: false, error: "Não foi possível suspender a loja." };

  await audit(tenantId, platformAdmin.email, "vitrine_suspensa", before.slug, before, { motivo });
  revalidatePath("/super/lojas");
  revalidatePath(`/super/lojas/${tenantId}`);
  return { ok: true };
}

export async function resumeStorefront(tenantId: string): Promise<Result> {
  const platformAdmin = await requireSuperAdmin();
  const before = await loadTenant(tenantId);
  if (!before) return { ok: false, error: "Loja não encontrada." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tenants")
    .update({ status: "active" })
    .eq("id", tenantId)
    .select("id");

  if (error || !data || data.length === 0) return { ok: false, error: "Não foi possível reativar a loja." };

  await audit(tenantId, platformAdmin.email, "vitrine_reativada", before.slug, before, null);
  revalidatePath("/super/lojas");
  revalidatePath(`/super/lojas/${tenantId}`);
  return { ok: true };
}

/** Estende o período de teste. */
export async function extendTrial(tenantId: string, dias: number): Promise<Result> {
  const platformAdmin = await requireSuperAdmin();
  if (!Number.isFinite(dias) || dias < 1 || dias > 365) {
    return { ok: false, error: "Informe de 1 a 365 dias." };
  }
  const before = await loadTenant(tenantId);
  if (!before) return { ok: false, error: "Loja não encontrada." };

  // Nunca ENCURTA acesso: parte da data que for maior, hoje ou o trial atual.
  const base = before.trial_ends_at && new Date(before.trial_ends_at) > new Date()
    ? new Date(before.trial_ends_at)
    : new Date();
  const novoFim = new Date(base.getTime() + dias * 86400000);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tenants")
    .update({ trial_ends_at: novoFim.toISOString(), subscription_status: "trialing" })
    .eq("id", tenantId)
    .select("id");

  if (error || !data || data.length === 0) return { ok: false, error: "Não foi possível estender o teste." };

  await audit(tenantId, platformAdmin.email, "trial_estendido", before.slug, before, {
    dias,
    trial_ends_at: novoFim.toISOString(),
  });
  revalidatePath(`/super/lojas/${tenantId}`);
  return { ok: true };
}

/** Cortesia: libera um plano por um prazo, sem cobrar. */
export async function grantBonus(
  tenantId: string,
  input: { dias: number; planoSlug: string; motivo: string }
): Promise<Result> {
  const platformAdmin = await requireSuperAdmin();
  if (!Number.isFinite(input.dias) || input.dias < 1 || input.dias > 365) {
    return { ok: false, error: "Informe de 1 a 365 dias." };
  }
  if (!input.motivo.trim()) return { ok: false, error: "Escreva o motivo da cortesia." };

  const before = await loadTenant(tenantId);
  if (!before) return { ok: false, error: "Loja não encontrada." };

  // Igual ao trial: nunca encurta uma cortesia que já existe.
  const base = before.bonus_until && new Date(before.bonus_until) > new Date()
    ? new Date(before.bonus_until)
    : new Date();
  const ate = new Date(base.getTime() + input.dias * 86400000);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tenants")
    .update({
      bonus_until: ate.toISOString(),
      bonus_plan_slug: input.planoSlug || null,
      bonus_reason: input.motivo.trim(),
      bonus_granted_by: platformAdmin.email,
      bonus_granted_at: new Date().toISOString(),
    })
    .eq("id", tenantId)
    .select("id");

  if (error || !data || data.length === 0) return { ok: false, error: "Não foi possível conceder a cortesia." };

  await audit(tenantId, platformAdmin.email, "cortesia_concedida", before.slug, before, {
    dias: input.dias,
    plano: input.planoSlug,
    motivo: input.motivo,
    ate: ate.toISOString(),
  });
  revalidatePath(`/super/lojas/${tenantId}`);
  return { ok: true };
}

export async function removeBonus(tenantId: string): Promise<Result> {
  const platformAdmin = await requireSuperAdmin();
  const before = await loadTenant(tenantId);
  if (!before) return { ok: false, error: "Loja não encontrada." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tenants")
    .update({
      bonus_until: null,
      bonus_plan_slug: null,
      bonus_reason: null,
      bonus_granted_by: null,
      bonus_granted_at: null,
    })
    .eq("id", tenantId)
    .select("id");

  if (error || !data || data.length === 0) return { ok: false, error: "Não foi possível remover a cortesia." };

  await audit(tenantId, platformAdmin.email, "cortesia_removida", before.slug, before, null);
  revalidatePath(`/super/lojas/${tenantId}`);
  return { ok: true };
}

/** Troca o plano da loja. NÃO ajusta o valor cobrado no gateway. */
export async function changePlan(tenantId: string, planoSlug: string): Promise<Result> {
  const platformAdmin = await requireSuperAdmin();
  const before = await loadTenant(tenantId);
  if (!before) return { ok: false, error: "Loja não encontrada." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tenants")
    .update({ subscription_plan: planoSlug || null })
    .eq("id", tenantId)
    .select("id");

  if (error || !data || data.length === 0) return { ok: false, error: "Não foi possível trocar o plano." };

  await audit(tenantId, platformAdmin.email, "plano_alterado", before.slug, before, { plano: planoSlug });
  revalidatePath(`/super/lojas/${tenantId}`);
  return { ok: true };
}

/**
 * Registra que o dono da plataforma entrou no painel de uma loja.
 * Chamado pelo link "Entrar na loja" -- é o que dá resposta a "quem mexeu
 * na loja da Juliana às 3h da manhã".
 */
export async function logStoreAccess(tenantId: string, slug: string): Promise<void> {
  const platformAdmin = await requireSuperAdmin();
  await audit(tenantId, platformAdmin.email, "entrou_no_painel_da_loja", slug, null, null);
}
