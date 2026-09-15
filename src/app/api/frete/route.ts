import { NextResponse } from "next/server";
import { z } from "zod";
import { getProductForCheckout, getUpsellsForProduct } from "@/modules/catalog/service";
import { resolveZoneByCep, getDeliverySettings } from "@/modules/delivery/settings";
import { checkRateLimit, clientIp } from "@/lib/security/rate-limit";
import { getTenantId } from "@/lib/tenant/context";

/**
 * Calcula o frete a partir do CEP, para o cartão do checkout ("Entrega para X —
 * R$ Y · até Z dias"). Depende SÓ do CEP + produto: não valida o carrinho (um
 * adicional/upsell inválido não pode virar "CEP não atendido"). Os itens
 * entram só para o "frete grátis acima de X", e itens desconhecidos são
 * ignorados. O valor final ainda é reconferido no create-order.
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

  const zone = await resolveZoneByCep(tenantId, parsed.data.cep);
  if (!zone) {
    return NextResponse.json({
      served: false,
      message: "Ainda não entregamos nesse CEP. Fale com a gente no WhatsApp.",
    });
  }

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
