import { NextResponse } from "next/server";
import { z } from "zod";
import { checkoutBuyerSchema, giftInputSchema, type CheckoutInput } from "@/modules/checkout/schemas";
import { createOrderGroup } from "@/modules/checkout/create-order-group";
import { checkRateLimit, clientIp } from "@/lib/security/rate-limit";
import { getTenantId } from "@/lib/tenant/context";

function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // chamadas server-to-server/sem browser não mandam Origin
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  try {
    const originHost = new URL(origin).host;
    const requestHost = new URL(req.url).host;
    if (originHost === requestHost) return true;
    if (siteUrl && originHost === new URL(siteUrl).host) return true;
    return false;
  } catch {
    return false;
  }
}

// Nomes amigáveis (nome/email/telefone/cpf) que o carrinho usa; reaproveita
// EXATAMENTE os mesmos validadores de checkoutBuyerSchema (mesma conta de
// CPF, mesmo formato de telefone) -- só troca o rótulo do campo.
const buyerRequestSchema = z.object({
  name: checkoutBuyerSchema.shape.buyerName,
  email: checkoutBuyerSchema.shape.buyerEmail,
  phone: checkoutBuyerSchema.shape.buyerPhone,
  cpf: checkoutBuyerSchema.shape.buyerCpf,
});

const requestSchema = z.object({
  buyer: buyerRequestSchema,
  gifts: z.array(giftInputSchema).min(1, "O carrinho está vazio.").max(30, "Carrinho grande demais."),
});

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  }

  const ip = clientIp(req);
  const withinLimit = await checkRateLimit(`create-order-group:${ip}`, 5, 600);
  if (!withinLimit) {
    return NextResponse.json(
      { error: "Muitas tentativas. Espera um pouco e tenta de novo." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { buyer, gifts } = parsed.data;
  const fullGifts: CheckoutInput[] = gifts.map((gift) => ({
    ...gift,
    buyerName: buyer.name,
    buyerEmail: buyer.email,
    buyerPhone: buyer.phone,
    buyerCpf: buyer.cpf,
  }));

  // A loja vem do endereço acessado, nunca do corpo do pedido.
  const tenantId = await getTenantId();
  const result = await createOrderGroup(tenantId, fullGifts);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, createdOrders: result.createdOrders },
      { status: 400 }
    );
  }

  return NextResponse.json({
    groupId: result.groupId,
    orders: result.orders,
    totalCents: result.totalCents,
  });
}
