"use server";

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/require-staff";

const MAX_BYTES = 8 * 1024 * 1024;

export async function uploadMedia(
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requireStaff();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Selecione uma imagem." };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Envie um arquivo de imagem (JPG, PNG ou WebP)." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Imagem muito grande (máximo 8MB)." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const admin = createAdminClient();
  const { error } = await admin.storage.from("site-media").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return { ok: false, error: "Falha ao enviar a imagem. Tente de novo." };

  const { data } = admin.storage.from("site-media").getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}
