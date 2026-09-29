import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getContent } from "@/modules/content/service";
import type { Product } from "@/modules/catalog/product";
import { discountPercent, resolveRibbon } from "@/modules/flags/logic";

type Promo = { compareAtCents: number | null; flagId: string | null };

/**
 * Preço "de" e flag de cada produto, lidos À PARTE das colunas principais de
 * propósito: se a migração 0051 ainda não rodou (coluna inexistente), esta leitura
 * falha em silêncio e devolve vazio -- a loja segue igual, sem tarja, em vez de a
 * lista de produtos inteira sumir por causa de uma coluna opcional.
 */
const loadPromos = cache(async (tenantId: string): Promise<Map<string, Promo>> => {
  const map = new Map<string, Promo>();
  try {
    const { data, error } = await createAdminClient()
      .from("products")
      .select("id, compare_at_price_cents, flag_id")
      .eq("tenant_id", tenantId);
    if (error || !data) return map;
    for (const row of data as Array<{ id: string; compare_at_price_cents: number | null; flag_id: string | null }>) {
      if (row.compare_at_price_cents || row.flag_id) {
        map.set(row.id, { compareAtCents: row.compare_at_price_cents, flagId: row.flag_id });
      }
    }
  } catch {
    // sem promoções: loja normal
  }
  return map;
});

/** Preço "de/por", % de desconto e tarja de cada produto (nenhum dado = produto inalterado). */
export async function attachPromos(tenantId: string, products: Product[]): Promise<Product[]> {
  if (products.length === 0) return products;
  const [promos, flags] = await Promise.all([loadPromos(tenantId), getContent(tenantId, "flags")]);
  if (promos.size === 0) return products;

  return products.map((product) => {
    const promo = promos.get(product.id);
    if (!promo) return product;
    const priceCents = Math.round(product.price * 100);
    const pct = discountPercent(priceCents, promo.compareAtCents);
    const ribbon = resolveRibbon({ priceCents, compareAtCents: promo.compareAtCents, flagId: promo.flagId }, flags);
    return {
      ...product,
      compareAtPrice: pct !== null && promo.compareAtCents ? promo.compareAtCents / 100 : undefined,
      discountPct: pct ?? undefined,
      ribbon: ribbon ?? undefined,
    };
  });
}

/** Só para o painel: o que está gravado no produto (vazio se a migração 0051 não rodou). */
export async function getProductPromoAdmin(
  tenantId: string,
  productId: string
): Promise<{ compareAtCents: number | null; flagId: string | null; available: boolean }> {
  try {
    const { data, error } = await createAdminClient()
      .from("products")
      .select("compare_at_price_cents, flag_id")
      .eq("tenant_id", tenantId)
      .eq("id", productId)
      .maybeSingle();
    if (error) return { compareAtCents: null, flagId: null, available: false };
    return {
      compareAtCents: (data?.compare_at_price_cents as number | null) ?? null,
      flagId: (data?.flag_id as string | null) ?? null,
      available: true,
    };
  } catch {
    return { compareAtCents: null, flagId: null, available: false };
  }
}
