"use server";

import "server-only";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/require-staff";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 20 * 1024 * 1024;

type MediaKind = "photo" | "logo" | "video";
type UploadResult = { ok: true; url: string } | { ok: false; error: string };

async function uploadBuffer(buffer: Buffer, contentType: string, ext: string): Promise<UploadResult> {
  const admin = createAdminClient();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await admin.storage.from("site-media").upload(path, buffer, {
    contentType,
    upsert: false,
  });
  if (error) return { ok: false, error: "Falha ao enviar o arquivo. Tente de novo." };
  const { data } = admin.storage.from("site-media").getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}

async function processUpload(file: File, kind: MediaKind): Promise<UploadResult> {
  if (kind === "video") {
    if (!file.type.startsWith("video/")) return { ok: false, error: "Envie um arquivo de vídeo." };
    if (file.size > MAX_VIDEO_BYTES) return { ok: false, error: "Vídeo muito grande (máximo 20MB)." };
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4";
    return uploadBuffer(buffer, file.type, ext);
  }

  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Envie um arquivo de imagem (JPG, PNG, WebP ou GIF)." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Imagem muito grande (máximo 8MB)." };
  }

  const original = Buffer.from(await file.arrayBuffer());

  // Logo/favicon: mantém o arquivo original -- precisa preservar
  // transparência e animação (PNG/GIF), coisa que converter arriscaria.
  if (kind === "logo") {
    const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
    return uploadBuffer(original, file.type, ext);
  }

  // Foto normal (banner, produto, categoria, anexo de chamado): converte pra
  // WebP sempre que der. Se a conversão falhar por qualquer motivo, sobe o
  // arquivo original em vez de derrubar o upload inteiro.
  try {
    const webp = await sharp(original, { animated: true }).webp({ quality: 82 }).toBuffer();
    return uploadBuffer(webp, "image/webp", "webp");
  } catch {
    const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    return uploadBuffer(original, file.type, ext);
  }
}

function fileFromFormData(formData: FormData): File | null {
  const file = formData.get("file");
  return file instanceof File && file.size > 0 ? file : null;
}

/** Upload de mídia do painel admin (banner, produto, categoria, logo, favicon). */
export async function uploadMedia(formData: FormData): Promise<UploadResult> {
  await requireStaff();

  const file = fileFromFormData(formData);
  if (!file) return { ok: false, error: "Selecione um arquivo." };

  const kind = (formData.get("kind") as MediaKind | null) ?? "photo";
  return processUpload(file, kind);
}

/** Upload de anexo de chamado do SAC -- só exige estar logado (não precisa ser staff). */
export async function uploadSupportAttachment(formData: FormData): Promise<UploadResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Faça login pra anexar um arquivo." };

  const file = fileFromFormData(formData);
  if (!file) return { ok: false, error: "Selecione um arquivo." };

  return processUpload(file, "photo");
}
