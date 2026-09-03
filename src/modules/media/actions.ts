"use server";

import "server-only";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/require-staff";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 20 * 1024 * 1024;

type MediaKind = "photo" | "logo" | "video";

async function uploadBuffer(buffer: Buffer, contentType: string, ext: string) {
  const admin = createAdminClient();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await admin.storage.from("site-media").upload(path, buffer, {
    contentType,
    upsert: false,
  });
  if (error) return { ok: false as const, error: "Falha ao enviar o arquivo. Tente de novo." };
  const { data } = admin.storage.from("site-media").getPublicUrl(path);
  return { ok: true as const, url: data.publicUrl };
}

export async function uploadMedia(
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requireStaff();

  const file = formData.get("file");
  const kind = (formData.get("kind") as MediaKind | null) ?? "photo";

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Selecione um arquivo." };
  }

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

  // Foto normal (banner, produto, categoria): converte pra WebP sempre que
  // der. Se a conversão falhar por qualquer motivo, sobe o arquivo original
  // em vez de derrubar o upload inteiro -- nunca vale a pena travar quem
  // está tentando cadastrar uma cesta por causa disso.
  try {
    const webp = await sharp(original, { animated: true }).webp({ quality: 82 }).toBuffer();
    return uploadBuffer(webp, "image/webp", "webp");
  } catch {
    const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    return uploadBuffer(original, file.type, ext);
  }
}
