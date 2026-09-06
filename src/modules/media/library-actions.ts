"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureModuleForAction } from "@/lib/auth/require-module";
import { uploadMedia } from "@/modules/media/actions";
import { caminhoNoBucket, getMediaItem, ondeAImagemEstaSendoUsada } from "@/modules/media/library";

/**
 * AÇÕES DA GALERIA.
 *
 * O upload NÃO foi reescrito: quem sobe o arquivo continua sendo
 * `uploadMedia()` de `src/modules/media/actions.ts`, o mesmo caminho que o CMS
 * usa em produção hoje (converte foto para WebP, grava em
 * `<tenant_id>/<arquivo>` -- pasta exigida pela política de storage da migração
 * 0020). Este arquivo só acrescenta: confere módulo, confere tipo e tamanho, e
 * guarda a linha na biblioteca.
 *
 * Duplicar o upload significaria duas regras de conversão, dois limites de
 * tamanho e dois caminhos de pasta -- e um dia eles divergem.
 */

type Falha = { ok: false; error: string };

/**
 * Teto REAL de upload por aqui.
 *
 * O arquivo sobe dentro do corpo de uma Server Action, e a Vercel corta o corpo
 * de qualquer função em 4,5 MB (limite da plataforma, não configurável nem no
 * plano pago). Recusar aqui, com uma frase que explica, é melhor do que deixar
 * a lojista esperar a barrinha e receber um erro de rede que ninguém entende.
 */
const MAX_BYTES = 4 * 1024 * 1024;

const TIPOS_IMAGEM = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const TIPOS_VIDEO = ["video/mp4", "video/webm", "video/quicktime"];

/** Envia uma foto ou um vídeo para a biblioteca da loja. */
export async function enviarParaGaleria(
  formData: FormData
): Promise<{ ok: true; url: string } | Falha> {
  const gate = await ensureModuleForAction("galeria");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  const arquivo = formData.get("file");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { ok: false, error: "Escolha um arquivo para enviar." };
  }

  // Validação no SERVIDOR. O `accept` do campo de arquivo é conveniência da
  // tela: qualquer pessoa pode chamar esta função com o que quiser.
  const tipo = (arquivo.type ?? "").toLowerCase();
  const ehVideo = TIPOS_VIDEO.includes(tipo);
  const ehImagem = TIPOS_IMAGEM.includes(tipo);
  if (!ehVideo && !ehImagem) {
    return {
      ok: false,
      error: "Formato não aceito. Envie foto (JPG, PNG, WebP, GIF) ou vídeo (MP4, WebM, MOV).",
    };
  }
  if (arquivo.size > MAX_BYTES) {
    return {
      ok: false,
      error: "Arquivo muito grande. O limite por envio é 4 MB — comprima a foto ou corte o vídeo antes de enviar.",
    };
  }

  // Reuso do upload que já roda em produção.
  const envio = new FormData();
  envio.set("file", arquivo);
  envio.set("kind", ehVideo ? "video" : "photo");
  const resultado = await uploadMedia(envio);
  if (!resultado.ok) return { ok: false, error: resultado.error };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("media_library")
    .insert({
      tenant_id: staff.tenantId,
      kind: ehVideo ? "video" : "imagem",
      url: resultado.url,
      title: arquivo.name.replace(/\.[^.]+$/, "").slice(0, 120) || null,
      size_bytes: arquivo.size,
      created_by: staff.id,
    })
    .select("id");

  if (error || !data || data.length === 0) {
    console.error("[galeria] arquivo enviado mas não entrou na biblioteca:", error);
    return {
      ok: false,
      error: "O arquivo foi enviado, mas não consegui salvá-lo na galeria. Tente enviar de novo.",
    };
  }

  revalidatePath("/admin/galeria");
  return { ok: true, url: resultado.url };
}

/** Muda o título e o texto alternativo (o que leitores de tela leem). */
export async function atualizarMidia(input: {
  id: string;
  title: string;
  alt: string;
}): Promise<{ ok: true } | Falha> {
  const gate = await ensureModuleForAction("galeria");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("media_library")
    .update({
      title: (input.title ?? "").trim().slice(0, 160) || null,
      alt: (input.alt ?? "").trim().slice(0, 300) || null,
    })
    .eq("id", input.id)
    .eq("tenant_id", staff.tenantId)
    .select("id");

  if (error || !data || data.length === 0) {
    console.error("[galeria] falha ao salvar título/texto alternativo:", error);
    return { ok: false, error: "Não foi possível salvar. Recarregue a página e tente de novo." };
  }

  revalidatePath("/admin/galeria");
  return { ok: true };
}

/** Onde este arquivo está sendo usado — para a tela avisar ANTES de apagar. */
export async function conferirUsoDaMidia(
  id: string
): Promise<{ ok: true; usos: string[]; naoVerificados: string[] } | Falha> {
  const gate = await ensureModuleForAction("galeria");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  const item = await getMediaItem(staff.tenantId, id);
  if (!item) return { ok: false, error: "Esse arquivo não está na galeria desta loja." };

  const uso = await ondeAImagemEstaSendoUsada(staff.tenantId, item.url);
  return { ok: true, usos: uso.usos, naoVerificados: uso.naoVerificados };
}

/**
 * Apaga um arquivo da galeria.
 *
 * Recusa por padrão quando o arquivo está em uso. Só apaga um arquivo em uso
 * quando a tela manda `confirmarMesmoEmUso: true`, o que só acontece depois de
 * a lojista ler a lista de onde ele aparece.
 */
export async function excluirMidia(input: {
  id: string;
  confirmarMesmoEmUso?: boolean;
}): Promise<{ ok: true } | (Falha & { usos?: string[]; naoVerificados?: string[] })> {
  const gate = await ensureModuleForAction("galeria");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  const item = await getMediaItem(staff.tenantId, input.id);
  if (!item) return { ok: false, error: "Esse arquivo não está na galeria desta loja." };

  const uso = await ondeAImagemEstaSendoUsada(staff.tenantId, item.url);
  if (uso.usos.length > 0 && !input.confirmarMesmoEmUso) {
    return {
      ok: false,
      error: "Este arquivo está sendo usado no site. Confira a lista antes de apagar.",
      usos: uso.usos,
      naoVerificados: uso.naoVerificados,
    };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("media_library")
    .delete()
    .eq("id", input.id)
    .eq("tenant_id", staff.tenantId)
    .select("id");

  if (error || !data || data.length === 0) {
    console.error("[galeria] falha ao apagar da biblioteca:", error);
    return { ok: false, error: "Não foi possível apagar esse arquivo." };
  }

  // O arquivo em si só sai do storage se estiver na pasta DESTA loja. URL colada
  // de fora, ou arquivo antigo na raiz do bucket, não é apagado -- pode estar
  // servindo outra coisa.
  const caminho = caminhoNoBucket(item.url, staff.tenantId);
  if (caminho) {
    const { error: erroStorage } = await admin.storage.from("site-media").remove([caminho]);
    if (erroStorage) console.error("[galeria] linha apagada, arquivo permaneceu no storage:", erroStorage);
  }

  revalidatePath("/admin/galeria");
  return { ok: true };
}
