import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * "Foto da entrega" (leitura). Tudo tolerante à migração 0052 (`photo_consent_at`):
 * antes dela rodar, o recurso simplesmente não aparece -- nada quebra.
 */

/** A coluna de autorização existe? (cache curto por processo: a resposta só muda com a migração.) */
let cache: { at: number; value: boolean } | null = null;
const TTL_MS = 60_000;

export async function experienceAvailable(): Promise<boolean> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  let value = false;
  try {
    const { error } = await createAdminClient().from("product_reviews").select("photo_consent_at").limit(1);
    value = !error;
  } catch {
    value = false;
  }
  cache = { at: Date.now(), value };
  return value;
}

export type MyExperience = {
  photoUrl: string | null;
  comment: string | null;
  status: "pendente" | "aprovada" | "recusada";
  consentAt: string | null;
} | null;

/** A experiência que ESTE pedido já enviou (para mostrar "obrigado" em vez do formulário). */
export async function getMyExperience(tenantId: string, orderId: string): Promise<MyExperience> {
  try {
    const { data, error } = await createAdminClient()
      .from("product_reviews")
      .select("photo_url, comment, status, photo_consent_at, submitted_at")
      .eq("tenant_id", tenantId)
      .eq("order_id", orderId)
      .maybeSingle();
    if (error || !data || !data.photo_url) return null;
    return {
      photoUrl: data.photo_url as string,
      comment: (data.comment as string | null) ?? null,
      status: data.status as "pendente" | "aprovada" | "recusada",
      consentAt: (data.photo_consent_at as string | null) ?? null,
    };
  } catch {
    return null;
  }
}
