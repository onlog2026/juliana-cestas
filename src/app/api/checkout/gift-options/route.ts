import { NextResponse } from "next/server";
import { getProductForCheckout, getUpsellsForProduct } from "@/modules/catalog/service";
import { checkRateLimit, clientIp } from "@/lib/security/rate-limit";
import { getTenantId } from "@/lib/tenant/context";

/**
 * Opções de UMA cesta para o editor do carrinho: produto (para exibir) +
 * adicionais ativos + upsells. Mesmos dados que o checkout já mostra na tela do
 * produto -- só leitura, não toca em nada. O editor busca isto quando o cliente
 * abre uma cesta para personalizar.
 */
export async function GET(req: Request) {
  const withinLimit = await checkRateLimit(`gift-options:${clientIp(req)}`, 60, 60);
  if (!withinLimit) {
    return NextResponse.json({ error: "Muitas consultas. Espera um pouco." }, { status: 429 });
  }

  const slug = (new URL(req.url).searchParams.get("slug") || "").trim();
  if (!slug) {
    return NextResponse.json({ error: "Cesta não informada." }, { status: 400 });
  }

  const tenantId = await getTenantId();
  const found = await getProductForCheckout(tenantId, slug);
  if (!found) {
    return NextResponse.json({ error: "Cesta não encontrada." }, { status: 404 });
  }

  const upsells = await getUpsellsForProduct(tenantId, found.product.id);
  const p = found.product;

  return NextResponse.json({
    product: {
      id: p.id,
      slug: p.slug,
      name: p.name,
      serves: p.serves,
      size: p.size,
      image_url: p.image_url,
      price_cents: p.price_cents,
      delivery_fee_cents: p.delivery_fee_cents,
    },
    addons: found.addons,
    upsells,
  });
}
