"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureModuleForAction } from "@/lib/auth/require-module";
import { STORE_SECTIONS, type StoreSection } from "@/modules/content/types";

/**
 * Salva uma seção de conteúdo da loja. A loja vem da sessão do staff --
 * nunca do navegador.
 */
export async function updateContent(
  section: StoreSection,
  payload: unknown
): Promise<{ ok: true } | { ok: false; error: string }> {
  // TRAVA DE SERVIDOR (módulo "cms"): a action é um endpoint HTTP -- some
  // do menu não quer dizer que sumiu da rede. Devolve a recusa em vez de
  // redirecionar, porque quem chamou é um formulário que precisa mostrar o
  // aviso na tela.
  const gate = await ensureModuleForAction("cms");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  const schema = STORE_SECTIONS[section];
  if (!schema) return { ok: false, error: "Seção desconhecida." };

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: "Confira os campos: algum valor está fora do formato esperado." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("site_content")
    .upsert(
      {
        tenant_id: staff.tenantId,
        surface: "store",
        section,
        slot: "default",
        payload: parsed.data,
        updated_at: new Date().toISOString(),
        updated_by: staff.id,
      },
      { onConflict: "tenant_id,surface,section,slot" }
    );

  if (error) return { ok: false, error: "Não foi possível salvar o texto." };

  // O conteúdo aparece na home, nas páginas estáticas e no rodapé.
  revalidatePath("/", "layout");
  revalidatePath("/admin/cms");
  return { ok: true };
}

/** Volta a seção para o texto padrão (apaga a personalização da loja). */
export async function resetContent(
  section: StoreSection
): Promise<{ ok: true } | { ok: false; error: string }> {
  // TRAVA DE SERVIDOR (módulo "cms"): a action é um endpoint HTTP -- some
  // do menu não quer dizer que sumiu da rede. Devolve a recusa em vez de
  // redirecionar, porque quem chamou é um formulário que precisa mostrar o
  // aviso na tela.
  const gate = await ensureModuleForAction("cms");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  const admin = createAdminClient();
  const { error } = await admin
    .from("site_content")
    .delete()
    .eq("tenant_id", staff.tenantId)
    .eq("surface", "store")
    .eq("section", section)
    .eq("slot", "default");

  if (error) return { ok: false, error: "Não foi possível restaurar o padrão." };

  revalidatePath("/", "layout");
  revalidatePath("/admin/cms");
  return { ok: true };
}
