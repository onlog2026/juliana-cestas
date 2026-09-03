"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { TENANT_ID } from "@/lib/tenant";
import { requireStaff } from "@/lib/auth/require-staff";

export async function updateSeoSettings(input: {
  siteTitle: string;
  siteDescription: string;
  keywords: string;
  ogImageUrl: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();

  const admin = createAdminClient();
  const keywords = input.keywords
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const { error } = await admin
    .from("seo_settings")
    .upsert(
      {
        tenant_id: TENANT_ID,
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
