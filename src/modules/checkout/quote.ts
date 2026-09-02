import "server-only";
import { getProductForCheckout } from "@/modules/catalog/service";
import { getDeliveryZones } from "@/modules/delivery/settings";

export type QuoteResult =
  | { ok: true; subtotalCents: number; addonsCents: number; deliveryFeeCents: number; totalCents: number; zoneName: string | null }
  | { ok: false; error: string };

/**
 * Recalcula o preço inteiro a partir do banco -- nunca confia em valor
 * vindo do cliente. Único lugar que decide quanto uma compra custa.
 */
export async function quoteCheckout(input: {
  productSlug: string;
  addonSlugs: string[];
  deliveryType: "delivery" | "pickup";
  zoneId?: string;
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

  let deliveryFeeCents = 0;
  let zoneName: string | null = null;
  if (input.deliveryType === "delivery") {
    if (!input.zoneId) return { ok: false, error: "Escolha a região de entrega." };
    const zones = await getDeliveryZones();
    const zone = zones.find((z) => z.id === input.zoneId);
    if (!zone) return { ok: false, error: "Região de entrega inválida." };
    deliveryFeeCents = zone.fee_cents;
    zoneName = zone.name;
  }

  const totalCents = subtotalCents + addonsCents + deliveryFeeCents;
  if (totalCents < 500) return { ok: false, error: "Valor total abaixo do mínimo." };

  return { ok: true, subtotalCents, addonsCents, deliveryFeeCents, totalCents, zoneName };
}
