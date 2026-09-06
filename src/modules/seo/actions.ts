"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureModuleForAction } from "@/lib/auth/require-module";

export async function updateSeoSettings(input: {
  siteTitle: string;
  siteDescription: string;
  keywords: string;
  ogImageUrl: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  // TRAVA DE SERVIDOR (módulo "seo"): a action é um endpoint HTTP -- some
  // do menu não quer dizer que sumiu da rede. Devolve a recusa em vez de
  // redirecionar, porque quem chamou é um formulário que precisa mostrar o
  // aviso na tela.
  const gate = await ensureModuleForAction("seo");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  const admin = createAdminClient();
  const keywords = input.keywords
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const { error } = await admin
    .from("seo_settings")
    .upsert(
      {
        tenant_id: staff.tenantId,
        site_title: input.siteTitle,
        site_description: input.siteDescription,
        keywords,
        og_image_url: input.ogImageUrl || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id" }
    );

  if (error) return { ok: false, error: "Não foi possível salvar." };

  revalidatePath("/");
  revalidatePath("/admin/seo");
  return { ok: true };
}
