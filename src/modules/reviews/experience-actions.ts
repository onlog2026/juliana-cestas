"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/tenant/context";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getCustomerOrderDetail } from "@/modules/customers/service";
import { sanitizeComment, sanitizeName } from "@/modules/reviews/service";

/**
 * O cliente (logado, dono do pedido) conta como foi a entrega: foto + texto curto +
 * AUTORIZAÇÃO para mostrar no site. Regras:
 *  - só pedido ENTREGUE do próprio cliente (a loja e o dono vêm da sessão, nunca do navegador);
 *  - sem autorização marcada, nada é gravado;
 *  - a foto vira WebP (1200 px) na pasta da loja; a avaliação nasce PENDENTE (só a lojista publica);
 *  - reaproveita a linha de avaliação do pedido (uma por pedido): enviar de novo troca a foto e
 *    volta para a fila de aprovação.
 */

const MAX_BYTES = 3.5 * 1024 * 1024; // corpo da função na Vercel é 4,5 MB
const MAX_TEXT = 280;

type Result = { ok: true } | { ok: false; error: string };

export async function submitDeliveryExperience(formData: FormData): Promise<Result> {
  const tenantId = await getTenantId();

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Entre na sua conta para enviar a foto." };

  if (!(await checkRateLimit(`experience:${user.id}`, 6, 600))) {
    return { ok: false, error: "Muitos envios seguidos. Espere alguns minutos e tente de novo." };
  }

  const orderId = String(formData.get("orderId") ?? "");
  const order = await getCustomerOrderDetail(tenantId, user.id, orderId);
  if (!order) return { ok: false, error: "Pedido não encontrado." };
  if (order.status !== "entregue") return { ok: false, error: "Você poderá enviar a foto depois que o pedido for entregue." };

  // Autorização é obrigatória: sem ela, nem lê a foto.
  if (formData.get("consent") !== "on") {
    return { ok: false, error: "Para enviar, marque a autorização de exibição no site." };
  }

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Tire ou escolha uma foto." };
  if (!file.type.startsWith("image/")) return { ok: false, error: "Envie uma imagem (JPG, PNG ou WebP)." };
  if (file.size > MAX_BYTES) return { ok: false, error: "Foto muito grande (máximo 3,5 MB). Tente uma menor." };

  const comment = sanitizeComment(String(formData.get("text") ?? "")).slice(0, MAX_TEXT);

  let buffer: Buffer;
  try {
    buffer = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    return { ok: false, error: "Não consegui abrir essa foto. Tente outra (JPG ou PNG)." };
  }

  const admin = createAdminClient();
  const path = `${tenantId}/experiencias/${crypto.randomUUID()}.webp`;
  const { error: uploadError } = await admin.storage
    .from("site-media")
    .upload(path, buffer, { contentType: "image/webp", upsert: false });
  if (uploadError) return { ok: false, error: "Não foi possível enviar a foto. Tente de novo." };
  const photoUrl = admin.storage.from("site-media").getPublicUrl(path).data.publicUrl;

  const now = new Date().toISOString();
  const { data: existing } = await admin
    .from("product_reviews")
    .select("id, comment, submitted_at")
    .eq("tenant_id", tenantId)
    .eq("order_id", orderId)
    .maybeSingle();

  const fields = {
    photo_url: photoUrl,
    photo_consent_at: now,
    // Nova foto = volta para a fila de aprovação (a lojista revisa antes de ir ao ar).
    status: "pendente",
    approved_at: null,
    approved_by: null,
    featured: false,
    updated_at: now,
  };

  if (existing) {
    const { error } = await admin
      .from("product_reviews")
      .update({
        ...fields,
        // Não apaga o comentário de uma avaliação já feita; só preenche se estava vazio.
        ...(comment && !existing.comment ? { comment } : {}),
        ...(existing.submitted_at ? {} : { submitted_at: now }),
      })
      .eq("id", existing.id)
      .eq("tenant_id", tenantId);
    if (error) return failure(error.code);
  } else {
    const { error } = await admin.from("product_reviews").insert({
      tenant_id: tenantId,
      order_id: orderId,
      customer_name: sanitizeName(order.buyer_name) || "Cliente",
      customer_email: user.email ?? null,
      comment: comment || null,
      submitted_at: now,
      ...fields,
    });
    if (error) return failure(error.code);
  }

  revalidatePath(`/conta/pedidos/${orderId}`);
  revalidatePath("/admin/avaliacoes");
  return { ok: true };
}

function failure(code: string | undefined): Result {
  // 42703 = coluna inexistente (migração 0052 ainda não rodou).
  if (code === "42703") return { ok: false, error: "Este recurso ainda não está liberado na loja." };
  return { ok: false, error: "Não foi possível salvar sua experiência. Tente de novo." };
}
