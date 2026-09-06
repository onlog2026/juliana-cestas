"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { PLATFORM_SECTIONS, type PlatformSection } from "@/modules/platform/landing-content";

/**
 * Ações do editor da landing da plataforma.
 *
 * ATENÇÃO ao mexer neste arquivo: com `"use server"` no topo, TODO export tem
 * que ser uma função async. Uma constante exportada aqui quebra o módulo
 * inteiro em tempo de execução (o build passa). Constantes moram em
 * `landing-content.ts`.
 */

type Result = { ok: true } | { ok: false; error: string };

const SURFACE = "platform";
const SLOT = "default";

/**
 * Grava a seção. Não usa `upsert` de propósito.
 *
 * O `ON CONFLICT` do PostgREST depende da constraint `site_content_key` ser
 * `NULLS NOT DISTINCT` (migration 0024). Se o banco for Postgres 14, a
 * constraint vira a versão comum -- e aí, como NULL nunca é igual a NULL, cada
 * "Salvar" criaria uma linha nova e a página passaria a ler conteúdo
 * duplicado, sem erro nenhum. Ler antes e decidir entre UPDATE e INSERT
 * funciona nos dois casos.
 */
async function gravar(
  section: PlatformSection,
  payload: unknown,
  actorEmail: string
): Promise<Result> {
  const admin = createAdminClient();

  const { data: existente, error: erroLeitura } = await admin
    .from("site_content")
    .select("id")
    .is("tenant_id", null)
    .eq("surface", SURFACE)
    .eq("section", section)
    .eq("slot", SLOT)
    .maybeSingle();

  if (erroLeitura) {
    console.error("[landing] falha ao procurar a seção antes de salvar:", erroLeitura);
    return { ok: false, error: "Não foi possível salvar: o banco não respondeu. Tente de novo." };
  }

  const agora = new Date().toISOString();

  if (existente) {
    const { data, error } = await admin
      .from("site_content")
      .update({ payload, updated_at: agora })
      .eq("id", existente.id)
      .select("id");

    // `.update()` não lança: devolve `{ error }`. E pode devolver sucesso com
    // ZERO linhas (RLS, id que sumiu) -- sem checar as linhas, a tela mentiria
    // "Salvo".
    if (error) {
      console.error("[landing] falha ao atualizar a seção:", error);
      return { ok: false, error: "Não foi possível salvar o texto." };
    }
    if (!data || data.length === 0) {
      return { ok: false, error: "Nada foi salvo: a linha não foi encontrada. Recarregue a página." };
    }
  } else {
    const { data, error } = await admin
      .from("site_content")
      .insert({
        tenant_id: null,
        surface: SURFACE,
        section,
        slot: SLOT,
        payload,
        updated_at: agora,
      })
      .select("id");

    if (error) {
      console.error("[landing] falha ao inserir a seção:", error);
      return { ok: false, error: "Não foi possível salvar o texto." };
    }
    if (!data || data.length === 0) {
      return { ok: false, error: "Nada foi salvo. Tente de novo." };
    }
  }

  await auditar(actorEmail, existente ? "landing.update" : "landing.create", section);
  return { ok: true };
}

/** Auditoria: quem mudou o quê na página pública da plataforma. */
async function auditar(actorEmail: string, action: string, target: string) {
  const admin = createAdminClient();
  const { error } = await admin.from("audit_logs").insert({
    tenant_id: null,
    actor_email: actorEmail,
    action,
    target,
    before: null,
    after: null,
  });
  // Auditoria não pode derrubar a ação -- mas silêncio total esconde problema.
  if (error) console.error("[landing] falha ao gravar auditoria:", error);
}

/** Salva uma seção da landing da plataforma. */
export async function updatePlatformContent(section: PlatformSection, payload: unknown): Promise<Result> {
  const admin = await requireSuperAdmin();

  const schema = PLATFORM_SECTIONS[section];
  if (!schema) return { ok: false, error: "Seção desconhecida." };

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Confira os campos: algum está vazio ou passou do tamanho máximo.",
    };
  }

  const resultado = await gravar(section, parsed.data, admin.email);
  if (!resultado.ok) return resultado;

  revalidatePath("/plataforma");
  revalidatePath("/super/landing");
  revalidatePath("/super/marca");
  return { ok: true };
}

/** Volta a seção para o texto padrão (apaga a personalização). */
export async function resetPlatformContent(section: PlatformSection): Promise<Result> {
  const admin = await requireSuperAdmin();

  if (!PLATFORM_SECTIONS[section]) return { ok: false, error: "Seção desconhecida." };

  const client = createAdminClient();
  const { error } = await client
    .from("site_content")
    .delete()
    .is("tenant_id", null)
    .eq("surface", SURFACE)
    .eq("section", section)
    .eq("slot", SLOT);

  if (error) {
    console.error("[landing] falha ao restaurar o padrão:", error);
    return { ok: false, error: "Não foi possível restaurar o padrão." };
  }

  await auditar(admin.email, "landing.reset", section);
  revalidatePath("/plataforma");
  revalidatePath("/super/landing");
  revalidatePath("/super/marca");
  return { ok: true };
}

/* ───────────────────────── Upload da marca ───────────────────────── */

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

type UploadResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * Envio de imagem da PLATAFORMA (logo e favicon do próprio produto).
 *
 * Por que não reusa `uploadMedia` de `src/modules/media/actions.ts`: aquela
 * ação começa com `requireStaff()` e grava em `<tenantId>/...`. Quem administra
 * a plataforma não é staff de loja nenhuma -- chamaria e levaria "sem
 * permissão". O tratamento do arquivo aqui é o mesmo de lá (logo mantém o
 * original para não perder transparência/animação; favicon é encaixado num
 * quadrado de 256px, senão o ícone da aba sai cortado), e o destino é o mesmo
 * bucket, na pasta `platform/`.
 */
export async function uploadPlatformImage(formData: FormData): Promise<UploadResult> {
  await requireSuperAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Selecione um arquivo." };
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Envie um arquivo de imagem (JPG, PNG, WebP ou SVG)." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Imagem muito grande (máximo 8MB)." };
  }

  const kind = formData.get("kind") === "favicon" ? "favicon" : "logo";
  const original = Buffer.from(await file.arrayBuffer());

  if (kind === "favicon") {
    try {
      const quadrado = await sharp(original)
        .resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      return subir(quadrado, "image/png", "png");
    } catch {
      // SVG e formatos que o sharp não abre: sobe o original em vez de
      // derrubar o envio inteiro.
      return subir(original, file.type, extensaoDe(file.name, "png"));
    }
  }

  return subir(original, file.type, extensaoDe(file.name, "png"));
}

function extensaoDe(nome: string, padrao: string): string {
  return nome.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || padrao;
}

async function subir(buffer: Buffer, contentType: string, ext: string): Promise<UploadResult> {
  const admin = createAdminClient();
  const path = `platform/${crypto.randomUUID()}.${ext}`;
  const { error } = await admin.storage.from("site-media").upload(path, buffer, {
    contentType,
    upsert: false,
  });
  if (error) {
    console.error("[landing] falha no envio da imagem:", error);
    return { ok: false, error: "Falha ao enviar o arquivo. Tente de novo." };
  }
  const { data } = admin.storage.from("site-media").getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}
