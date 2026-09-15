import { NextResponse } from "next/server";
import { z } from "zod";
import { quoteCheckout } from "@/modules/checkout/quote";
import { checkRateLimit, clientIp } from "@/lib/security/rate-limit";
import { getTenantId } from "@/lib/tenant/context";

/**
 * Calcula o frete a partir do CEP, para o cartão do checkout ("Entrega para X —
 * R$ Y · até Z dias"). Reusa o `quoteCheckout` (mesma conta do servidor), então
 * o valor mostrado é exatamente o que será cobrado. Sem cupom aqui.
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
  const result = await quoteCheckout(tenantId, {
    productSlug: parsed.data.productSlug,
    addonSlugs: parsed.data.addonSlugs,
    upsellSlugs: parsed.data.upsellSlugs,
    deliveryType: "delivery",
    cep: parsed.data.cep,
  });

  if (!result.ok) {
    // CEP não atendido (ou inválido): a loja mostra o WhatsApp em vez de travar.
    return NextResponse.json({ served: false, message: result.error });
  }

  return NextResponse.json({
    served: true,
    zoneName: result.zoneName,
    deliveryFeeCents: result.deliveryFeeCents,
    prazoMinDays: result.prazoMinDays,
    prazoMaxDays: result.prazoMaxDays,
    freeShipping: result.freeShipping,
    totalCents: result.totalCents,
  });
}
