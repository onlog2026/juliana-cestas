import { getTenantId } from "@/lib/tenant/context";
import { getContent } from "@/modules/content/service";
import { getStoreProfile } from "@/modules/settings/store-profile";
import { CartaozinhoSignature } from "@/components/loja/cartaozinho-signature";

/**
 * Envelope de servidor do bloco do cartãozinho: lê o texto da loja e o nome do
 * negócio no banco e entrega prontos ao componente de cliente, que precisa ser
 * cliente por causa do preview que muda enquanto a pessoa digita.
 */
export async function CartaozinhoSection() {
  const tenantId = await getTenantId();
  const [content, profile] = await Promise.all([
    getContent(tenantId, "signature"),
    getStoreProfile(tenantId),
  ]);

  return (
    <CartaozinhoSignature
      title={content.title}
      body={content.body}
      storeName={profile.businessName?.trim() || ""}
    />
  );
}
