"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { TENANT_ID } from "@/lib/tenant";
import { requireStaff } from "@/lib/auth/require-staff";

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function updateSocialLinks(input: {
  instagram: string;
  facebook: string;
  x: string;
  youtube: string;
  linkedin: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();

  const admin = createAdminClient();
  const { error } = await admin
    .from("social_links")
    .upsert(
      {
        tenant_id: TENANT_ID,
        instagram: normalizeUrl(input.instagram),
        facebook: normalizeUrl(input.facebook),
        x: normalizeUrl(input.x),
        youtube: normalizeUrl(input.youtube),
        linkedin: normalizeUrl(input.linkedin),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id" }
    );

  if (error) return { ok: false, error: "Não foi possível salvar." };

  revalidatePath("/", "layout");
  revalidatePath("/admin/cms");
  return { ok: true };
}
