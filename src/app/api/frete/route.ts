import { NextResponse } from "next/server";
import { z } from "zod";
import { getProductForCheckout, getUpsellsForProduct } from "@/modules/catalog/service";
import { getDeliverySettings } from "@/modules/delivery/settings";
import { resolveDelivery } from "@/modules/delivery/resolve-delivery";
import { checkRateLimit, clientIp } from "@/lib/security/rate-limit";
import { getTenantId } from "@/lib/tenant/context";

/**
 * Calcula o frete a partir do CEP, para o cartão do checkout ("Entrega para X —
 * R$ Y · até Z dias"). Depende SÓ do CEP + produto: não valida o carrinho (um
 * adicional/upsell inválido não pode virar "CEP não atendido"). Os itens
 * entram só para o "frete grátis acima de X", e itens desconhecidos são
 * ignorados. O valor final ainda é reconferido no create-order.
 *
 * Fase 2 (envio nacional): fora da área local, se o produto permitir
 * transportadora, devolve uma ESTIMATIVA (`carrierOptions`) em vez de só
 * "não atendido". O pedido continua sendo fechado no WhatsApp -- esta rota
 * não fecha compra, só cota.
 */
const schema = z.object({
  productSlug: z.string().min(1),
  addonSlugs: z.array(z.string()).default([]),
  upsellSlugs: z.array(z.string()).default([]),
  cep: z.string().trim().min(1),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const withinLimit = await checkRateLimit(`frete:${ip}`, 40, 300);
  if (!withinLimit) {
    return NextResponse.json({ error: "Muitas consultas. Espere um pouco." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 422 });
  }

  const tenantId = await getTenantId();
  const found = await getProductForCheckout(tenantId, parsed.data.productSlug);
  if (!found) {
    return NextResponse.json({ served: false, message: "Produto não encontrado." });
  }

  const resolution = await resolveDelivery(tenantId, {
    cep: parsed.data.cep,
    product: {
      deliveryFeeCents: found.product.delivery_fee_cents,
      shipsNationally: found.product.ships_nationally,
      weightGrams: found.product.weight_grams,
      lengthCm: found.product.length_cm,
      widthCm: found.product.width_cm,
      heightCm: found.product.height_cm,
    },
  });

  if (resolution.kind === "not_served") {
    return NextResponse.json({
      served: false,
      message: "Ainda não entregamos nesse CEP. Fale com a gente no WhatsApp.",
    });
  }

  if (resolution.kind === "carrier") {
    return NextResponse.json({
      served: false,
      message: "Fora da nossa área de entrega local. Veja a estimativa por transportadora e fale com a gente pra fechar.",
      carrierOptions: resolution.options.map((o) => ({
        name: o.name,
        companyName: o.companyName,
        priceCents: o.priceCents,
        deliveryDays: o.deliveryDays,
      })),
    });
  }

  const zone = resolution.zone;
  let deliveryFeeCents = zone.feeCents + found.product.delivery_fee_cents;

  // Mercadoria só para o frete-grátis-acima-de-X. Itens desconhecidos são
  // ignorados (não é papel deste endpoint validar o carrinho).
  let merchandiseCents = found.product.price_cents;
  for (const addon of found.addons) {
    if (parsed.data.addonSlugs.includes(addon.slug)) merchandiseCents += addon.price_cents;
  }
  const upsells = await getUpsellsForProduct(tenantId, found.product.id);
  for (const upsell of upsells) {
    if (parsed.data.upsellSlugs.includes(upsell.slug)) merchandiseCents += upsell.price_cents;
  }

  const settings = await getDeliverySettings(tenantId);
  let freeShipping = false;
  if (settings?.freeShippingMinCents != null && merchandiseCents >= settings.freeShippingMinCents) {
    deliveryFeeCents = 0;
    freeShipping = true;
  }

  return NextResponse.json({
    served: true,
    zoneName: zone.name,
    deliveryFeeCents,
    prazoMinDays: zone.prazoMinDays,
    prazoMaxDays: zone.prazoMaxDays,
    freeShipping,
  });
}
