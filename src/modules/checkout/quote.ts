import "server-only";
import { getProductForCheckout, getUpsellsForProduct } from "@/modules/catalog/service";
import { resolveZoneByCep, getDeliverySettings } from "@/modules/delivery/settings";
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
      zoneId: string | null;
      zoneName: string | null;
      prazoMinDays: number | null;
      prazoMaxDays: number | null;
      freeShipping: boolean;
      upsellItems: { id: string; slug: string; name: string; price_cents: number }[];
    }
  | { ok: false; error: string };

/**
 * Recalcula o preço inteiro a partir do banco -- nunca confia em valor
 * vindo do cliente. Único lugar que decide quanto uma compra custa.
 */
export async function quoteCheckout(
  tenantId: string,
  input: {
    productSlug: string;
    addonSlugs: string[];
    upsellSlugs?: string[];
    deliveryType: "delivery" | "pickup";
    /** CEP do cliente (8 dígitos, com ou sem máscara). Define a zona/frete. */
    cep?: string;
    couponCode?: string;
    buyerEmail?: string;
  }
): Promise<QuoteResult> {
  const found = await getProductForCheckout(tenantId, input.productSlug);
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
    const available = await getUpsellsForProduct(tenantId, product.id);
    for (const slug of input.upsellSlugs) {
      const upsell = available.find((u) => u.slug === slug);
      if (!upsell) return { ok: false, error: `Produto adicional inválido: ${slug}` };
      upsellsCents += upsell.price_cents;
      upsellItems.push(upsell);
    }
  }

  const merchandiseCents = subtotalCents + addonsCents + upsellsCents;

  // Frete: derivado do CEP (não do cliente). A zona sai da faixa de CEP.
  let deliveryFeeCents = 0;
  let zoneId: string | null = null;
  let zoneName: string | null = null;
  let prazoMinDays: number | null = null;
  let prazoMaxDays: number | null = null;
  let freeShipping = false;
  if (input.deliveryType === "delivery") {
    if (!input.cep) return { ok: false, error: "Informe o CEP para calcular o frete." };
    const zone = await resolveZoneByCep(tenantId, input.cep);
    if (!zone) {
      return { ok: false, error: "Ainda não entregamos nesse CEP. Fale com a gente no WhatsApp." };
    }
    zoneId = zone.zoneId;
    zoneName = zone.name;
    prazoMinDays = zone.prazoMinDays;
    prazoMaxDays = zone.prazoMaxDays;
    deliveryFeeCents = zone.feeCents + product.delivery_fee_cents;

    // Frete grátis acima de um valor (configuração da loja).
    const settings = await getDeliverySettings(tenantId);
    if (settings?.freeShippingMinCents != null && merchandiseCents >= settings.freeShippingMinCents) {
      deliveryFeeCents = 0;
      freeShipping = true;
    }
  }

  let discountCents = 0;
  let couponId: string | null = null;
  let couponCode: string | null = null;
  if (input.couponCode && input.couponCode.trim()) {
    const result = await validateCoupon(tenantId, {
      code: input.couponCode,
      buyerEmail: input.buyerEmail ?? "",
      merchandiseCents,
    });
    if (!result.ok) return { ok: false, error: result.error };
    couponId = result.coupon.id;
    couponCode = result.coupon.code;
    if (result.coupon.type === "free_shipping") {
      deliveryFeeCents = 0;
      freeShipping = true;
    } else {
      discountCents = computeDiscount(result.coupon, merchandiseCents);
    }
  }

  const totalCents = merchandiseCents + deliveryFeeCents - discountCents;
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
    zoneId,
    zoneName,
    prazoMinDays,
    prazoMaxDays,
    freeShipping,
    upsellItems,
  };
}
