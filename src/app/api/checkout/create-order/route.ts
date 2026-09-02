import { NextResponse } from "next/server";
import { checkoutInputSchema } from "@/modules/checkout/schemas";
import { createOrder } from "@/modules/checkout/create-order";

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

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = checkoutInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const result = await createOrder(parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    orderId: result.orderId,
    number: result.number,
    token: result.token,
    totalCents: result.totalCents,
  });
}
