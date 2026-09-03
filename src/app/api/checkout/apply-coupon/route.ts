import { NextResponse } from "next/server";
import { z } from "zod";
import { quoteCheckout } from "@/modules/checkout/quote";
import { checkRateLimit, clientIp } from "@/lib/security/rate-limit";

const schema = z.object({
  productSlug: z.string().min(1),
  addonSlugs: z.array(z.string()),
  upsellSlugs: z.array(z.string()),
  deliveryType: z.enum(["delivery", "pickup"]),
  zoneId: z.string().uuid().optional().or(z.literal("")),
  couponCode: z.string().trim().min(1).max(40),
  buyerEmail: z.string().trim().email().optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const withinLimit = await checkRateLimit(`apply-coupon:${ip}`, 20, 300);
  if (!withinLimit) {
    return NextResponse.json({ error: "Muitas tentativas. Espera um pouco e tenta de novo." }, { status: 429 });
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

  const result = await quoteCheckout({
    productSlug: parsed.data.productSlug,
    addonSlugs: parsed.data.addonSlugs,
    upsellSlugs: parsed.data.upsellSlugs,
    deliveryType: parsed.data.deliveryType,
    zoneId: parsed.data.zoneId || undefined,
    couponCode: parsed.data.couponCode,
    buyerEmail: parsed.data.buyerEmail || undefined,
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  if (!result.couponCode) return NextResponse.json({ error: "Cupom inválido." }, { status: 400 });

  return NextResponse.json({
    couponCode: result.couponCode,
    discountCents: result.discountCents,
    deliveryFeeCents: result.deliveryFeeCents,
    totalCents: result.totalCents,
  });
}
