import type { ComponentType } from "react";
import { getTenantId } from "@/lib/tenant/context";
import { getStoreProfile, getStoreWhatsapp } from "@/modules/settings/store-profile";
import { CartPageClient } from "@/components/loja/cart/cart-page-client";
import { INTERNAS } from "../internas";
import type { PropsCarrinhoModelo } from "../encaixes";
import type { DadosLoja, TemaKey } from "../types";

// removido quando os modelos aceitarem `conteudo` (aí `INTERNAS[tema].Carrinho` já terá este tipo).
type CarrinhoComConteudo = ComponentType<PropsCarrinhoModelo>;

/**
 * Carrinho AO VIVO na casca do modelo. O carrinho/checkout real (destinatário, data e horário, cartãozinho,
 * adicionais, cupom, frete, PIX/cartão/boleto) é o `CartPageClient` da loja, INTACTO: o modelo só
 * decide o título, o espaçamento e as cores em volta.
 */
export async function CarrinhoAoVivo({ tema, d }: { tema: TemaKey; d: DadosLoja }) {
  const tenantId = await getTenantId();
  const [perfil, whatsapp] = await Promise.all([getStoreProfile(tenantId), getStoreWhatsapp(tenantId)]);
  const conteudo = (
    <div data-recurso="carrinho" className="min-w-0">
      <CartPageClient storeName={perfil.businessName?.trim() || ""} whatsapp={whatsapp} />
    </div>
  );
  const Modelo = INTERNAS[tema].Carrinho as unknown as CarrinhoComConteudo;
  return <Modelo d={d} conteudo={conteudo} />;
}
