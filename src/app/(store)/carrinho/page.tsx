import type { Metadata } from "next";
import { getStoreProfile, getStoreWhatsapp } from "@/modules/settings/store-profile";
import { getTenantId } from "@/lib/tenant/context";
import { CartPageClient } from "@/components/loja/cart/cart-page-client";
import { getTemaInstalado } from "@/storefront/temas/instalado";
import { dadosLoja } from "@/storefront/temas/dados-loja";
import { CarrinhoAoVivo } from "@/storefront/temas/ao-vivo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Carrinho", robots: { index: false, follow: false } };

export default async function CarrinhoPage() {
  const tenantId = await getTenantId();
  // Loja com modelo instalado: o carrinho REAL (e o checkout) dentro da casca do modelo.
  const instalado = await getTemaInstalado(tenantId);
  if (instalado) {
    const d = await dadosLoja(tenantId, "", instalado.variacao);
    return <CarrinhoAoVivo tema={instalado.tema.key} d={d} />;
  }
  const [storeProfile, whatsapp] = await Promise.all([
    getStoreProfile(tenantId),
    getStoreWhatsapp(tenantId),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl text-foreground md:text-4xl">Seu carrinho</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Monte várias cestas para pessoas diferentes, cada uma com seu destinatário, entrega e cartãozinho.
      </p>

      <div className="mt-6">
        <CartPageClient storeName={storeProfile.businessName?.trim() || ""} whatsapp={whatsapp} />
      </div>
    </div>
  );
}
