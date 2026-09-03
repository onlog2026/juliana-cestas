import "server-only";
import { getProductForCheckout, getUpsellsForProduct } from "@/modules/catalog/service";
import { getDeliveryZones } from "@/modules/delivery/settings";
import { validateCoupon, computeDiscount } from "@/modules/coupons/validate";

export type QuoteResult =
  | {
      ok: true;
      subtotalCents: number;
      addonsCents: number;
      upsellsCents: number;
      deliveryFeeCents: number;
      discountCents: number;
      couponId: string | null;
      couponCode: string | null;
      totalCents: number;
      zoneName: string | null;
      upsellItems: { id: string; slug: string; name: string; price_cents: number }[];
    }
  | { ok: false; error: string };

/**
 * Recalcula o preço inteiro a partir do banco -- nunca confia em valor
 * vindo do cliente. Único lugar que decide quanto uma compra custa.
 */
export async function quoteCheckout(input: {
  productSlug: string;
  addonSlugs: string[];
  upsellSlugs?: string[];
  deliveryType: "delivery" | "pickup";
  zoneId?: string;
  couponCode?: string;
  buyerEmail?: string;
}): Promise<QuoteResult> {
  const found = await getProductForCheckout(input.productSlug);
  if (!found) return { ok: false, error: "Cesta não encontrada." };

  const { product, addons } = found;
  const subtotalCents = product.price_cents;

  let addonsCents = 0;
  for (const slug of input.addonSlugs) {
    const addon = addons.find((a) => a.slug === slug);
    if (!addon) return { ok: false, error: `Adicional inválido: ${slug}` };
    addonsCents += addon.price_cents;
  }

  let upsellsCents = 0;
  const upsellItems: { id: string; slug: string; name: string; price_cents: number }[] = [];
  if (input.upsellSlugs && input.upsellSlugs.length > 0) {
    const available = await getUpsellsForProduct(product.id);
    for (const slug of input.upsellSlugs) {
      const upsell = available.find((u) => u.slug === slug);
      if (!upsell) return { ok: false, error: `Produto adicional inválido: ${slug}` };
      upsellsCents += upsell.price_cents;
      upsellItems.push(upsell);
    }
  }

  let deliveryFeeCents = 0;
  let zoneName: string | null = null;
  if (input.deliveryType === "delivery") {
    if (!input.zoneId) return { ok: false, error: "Escolha a região de entrega." };
    const zones = await getDeliveryZones();
    const zone = zones.find((z) => z.id === input.zoneId);
    if (!zone) return { ok: false, error: "Região de entrega inválida." };
    deliveryFeeCents = zone.fee_cents + product.delivery_fee_cents;
    zoneName = zone.name;
  }

  let discountCents = 0;
  let couponId: string | null = null;
  let couponCode: string | null = null;
  if (input.couponCode && input.couponCode.trim()) {
    const merchandiseCents = subtotalCents + addonsCents + upsellsCents;
    const result = await validateCoupon({
      code: input.couponCode,
      buyerEmail: input.buyerEmail ?? "",
      merchandiseCents,
    });
    if (!result.ok) return { ok: false, error: result.error };
    couponId = result.coupon.id;
    couponCode = result.coupon.code;
    if (result.coupon.type === "free_shipping") {
      deliveryFeeCents = 0;
    } else {
      discountCents = computeDiscount(result.coupon, merchandiseCents);
    }
  }

  const totalCents = subtotalCents + addonsCents + upsellsCents + deliveryFeeCents - discountCents;
  if (totalCents < 500) return { ok: false, error: "Valor total abaixo do mínimo." };

  return {
    ok: true,
    subtotalCents,
    addonsCents,
    upsellsCents,
    deliveryFeeCents,
    discountCents,
    couponId,
    couponCode,
    totalCents,
    zoneName,
    upsellItems,
  };
}
