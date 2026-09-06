"use server";

import "server-only";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantId } from "@/lib/tenant/context";
import { ensureModuleForAction } from "@/lib/auth/require-module";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { hashToken } from "@/modules/orders/token";
import {
  isValidRating,
  sanitizeComment,
  sanitizeReply,
  type ReviewStatus,
} from "@/modules/reviews/service";
import { dispatchPendingReviewInvites, type DispatchSummary } from "@/modules/reviews/invite";

/**
 * Server actions do módulo de avaliações.
 *
 * Duas famílias com regras BEM diferentes:
 *   - `submitReview` / `uploadReviewPhoto`: quem chama é o CLIENTE, sem login.
 *     A autorização é o token do convite (só quem recebeu o e-mail tem). Tudo
 *     que vem do navegador — nota, comentário, foto — é revalidado aqui.
 *   - o resto: painel da lojista. Passa por `ensureModuleForAction("avaliacoes")`,
 *     que confere sessão de staff DESTA loja E o direito ao módulo. Esconder o
 *     item do menu não é trava: quem sabe o endereço digita e entra.
 *
 * Arquivo com "use server" só pode exportar função async — por isso os tipos
 * ficam em `service.ts` / `invite.ts`.
 */

type SimpleResult = { ok: true } | { ok: false; error: string };

const MAX_PHOTO_BYTES = 3.5 * 1024 * 1024; // teto de corpo da função na Vercel é 4,5MB

async function clientIpFromHeaders(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "desconhecido";
}

// ── Cliente (sem login, autorizado pelo token do convite) ─────────────────

export async function submitReview(input: {
  token: string;
  rating: number;
  comment?: string | null;
  photoUrl?: string | null;
}): Promise<SimpleResult> {
  const tenantId = await getTenantId();

  // Trava contra chute de token: cada tentativa é um token diferente, então o
  // limite tem que ser por origem, não por token.
  const ip = await clientIpFromHeaders();
  const dentroDoLimite = await checkRateLimit(`review-submit:${ip}`, 20, 600);
  if (!dentroDoLimite) {
    return { ok: false, error: "Muitas tentativas seguidas. Espere alguns minutos e tente de novo." };
  }

  const token = (input.token ?? "").trim();
  if (!token) return { ok: false, error: "Link de avaliação inválido." };

  // A nota vem do navegador — nunca confiar. 1 a 5, inteiro, e só.
  if (!isValidRating(input.rating)) {
    return { ok: false, error: "Escolha uma nota de 1 a 5 estrelas." };
  }

  const admin = createAdminClient();
  const { data: review, error: lookupError } = await admin
    .from("product_reviews")
    .select("id, submitted_at")
    .eq("tenant_id", tenantId)
    .eq("invite_token_hash", hashToken(token))
    .maybeSingle();

  if (lookupError || !review) return { ok: false, error: "Link de avaliação inválido." };
  if (review.submitted_at) return { ok: false, error: "Essa avaliação já foi enviada. Obrigado!" };

  const comment = sanitizeComment(input.comment);
  const photoUrl = typeof input.photoUrl === "string" && input.photoUrl.startsWith("http")
    ? input.photoUrl
    : null;

  const { data: atualizado, error: updateError } = await admin
    .from("product_reviews")
    .update({
      rating: input.rating,
      comment: comment || null,
      photo_url: photoUrl,
      submitted_at: new Date().toISOString(),
      // A avaliação NASCE pendente: só a lojista publica.
      status: "pendente" satisfies ReviewStatus,
      // O hash do convite FICA no banco de propósito: quem clicar de novo no
      // link do e-mail cai numa página que diz "já foi enviada, obrigado" em
      // vez de "convite não encontrado". O que impede um segundo envio é o
      // `submitted_at` (condição do próprio UPDATE, logo abaixo), não apagar
      // o token.
      updated_at: new Date().toISOString(),
    })
    .eq("id", review.id)
    .eq("tenant_id", tenantId)
    // Sem esta condição, duas abas abertas gravariam duas vezes.
    .is("submitted_at", null)
    .select("id")
    .maybeSingle();

  if (updateError) return { ok: false, error: "Não foi possível enviar sua avaliação. Tente de novo." };
  // Zero linhas não é exceção no Supabase: sem esta checagem a tela mentiria
  // "enviado!" com o banco intacto.
  if (!atualizado) return { ok: false, error: "Essa avaliação já foi enviada. Obrigado!" };

  revalidatePath("/admin/avaliacoes");
  return { ok: true };
}

/**
 * Foto opcional da avaliação. Autorizada pelo token do convite — o mesmo que
 * autoriza enviar a avaliação. Sem token válido, ninguém sobe arquivo aqui.
 */
export async function uploadReviewPhoto(
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const tenantId = await getTenantId();

  const token = String(formData.get("token") ?? "").trim();
  if (!token) return { ok: false, error: "Link de avaliação inválido." };

  const ip = await clientIpFromHeaders();
  const dentroDoLimite = await checkRateLimit(`review-photo:${ip}`, 10, 600);
  if (!dentroDoLimite) return { ok: false, error: "Muitos envios seguidos. Espere alguns minutos." };

  const admin = createAdminClient();
  const { data: review } = await admin
    .from("product_reviews")
    .select("id, submitted_at")
    .eq("tenant_id", tenantId)
    .eq("invite_token_hash", hashToken(token))
    .maybeSingle();
  if (!review || review.submitted_at) return { ok: false, error: "Link de avaliação inválido." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Selecione uma foto." };
  if (!file.type.startsWith("image/")) return { ok: false, error: "Envie uma imagem (JPG, PNG ou WebP)." };
  if (file.size > MAX_PHOTO_BYTES) return { ok: false, error: "Foto muito grande (máximo 3MB)." };

  const original = Buffer.from(await file.arrayBuffer());
  let buffer = original;
  let contentType = file.type;
  let ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  try {
    buffer = await sharp(original).rotate().resize(1200, 1200, { fit: "inside" }).webp({ quality: 80 }).toBuffer();
    contentType = "image/webp";
    ext = "webp";
  } catch {
    // Conversão falhou: sobe o original em vez de derrubar o envio.
  }

  const path = `${tenantId}/avaliacoes/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await admin.storage
    .from("site-media")
    .upload(path, buffer, { contentType, upsert: false });
  if (uploadError) return { ok: false, error: "Não foi possível enviar a foto. Tente de novo." };

  const { data } = admin.storage.from("site-media").getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}

// ── Painel da lojista ─────────────────────────────────────────────────────

async function mudarStatus(reviewId: string, status: ReviewStatus): Promise<SimpleResult> {
  const gate = await ensureModuleForAction("avaliacoes");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  const admin = createAdminClient();
  const agora = new Date().toISOString();
  const { data, error } = await admin
    .from("product_reviews")
    .update({
      status,
      approved_at: status === "aprovada" ? agora : null,
      approved_by: status === "aprovada" ? staff.id : null,
      // Recusada nunca fica em destaque na loja.
      ...(status === "aprovada" ? {} : { featured: false }),
      updated_at: agora,
    })
    .eq("id", reviewId)
    .eq("tenant_id", staff.tenantId)
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: "Não foi possível salvar. Tente de novo." };
  if (!data) return { ok: false, error: "Avaliação não encontrada." };

  revalidatePath("/admin/avaliacoes");
  revalidatePath("/avaliacoes");
  revalidatePath("/");
  return { ok: true };
}

export async function approveReview(reviewId: string): Promise<SimpleResult> {
  return mudarStatus(reviewId, "aprovada");
}

export async function rejectReview(reviewId: string): Promise<SimpleResult> {
  return mudarStatus(reviewId, "recusada");
}

/** Destaque: aparece primeiro na vitrine. Só faz sentido em avaliação aprovada. */
export async function setReviewFeatured(reviewId: string, featured: boolean): Promise<SimpleResult> {
  const gate = await ensureModuleForAction("avaliacoes");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("product_reviews")
    .update({ featured, updated_at: new Date().toISOString() })
    .eq("id", reviewId)
    .eq("tenant_id", staff.tenantId)
    .eq("status", "aprovada")
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: "Não foi possível salvar. Tente de novo." };
  if (!data) return { ok: false, error: "Só dá para destacar uma avaliação já aprovada." };

  revalidatePath("/admin/avaliacoes");
  revalidatePath("/avaliacoes");
  revalidatePath("/");
  return { ok: true };
}

/** Resposta pública da loja. Texto vazio apaga a resposta. */
export async function replyToReview(reviewId: string, reply: string): Promise<SimpleResult> {
  const gate = await ensureModuleForAction("avaliacoes");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  const texto = sanitizeReply(reply);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("product_reviews")
    .update({
      reply: texto || null,
      replied_at: texto ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .eq("tenant_id", staff.tenantId)
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: "Não foi possível salvar a resposta." };
  if (!data) return { ok: false, error: "Avaliação não encontrada." };

  revalidatePath("/admin/avaliacoes");
  revalidatePath("/avaliacoes");
  revalidatePath("/");
  return { ok: true };
}

/**
 * Botão "Enviar convites pendentes" do painel: varre os pedidos entregues sem
 * avaliação e manda o e-mail. Idempotente — clicar duas vezes não duplica.
 */
export async function sendPendingReviewInvites(): Promise<
  { ok: true; resumo: DispatchSummary } | { ok: false; error: string }
> {
  const gate = await ensureModuleForAction("avaliacoes");
  if (!gate.ok) return { ok: false, error: gate.mensagem };

  const resumo = await dispatchPendingReviewInvites(gate.staff.tenantId, { limit: 50 });
  revalidatePath("/admin/avaliacoes");
  return { ok: true, resumo };
}
