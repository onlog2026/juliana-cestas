import { requireStaffWithModule } from "@/lib/auth/require-module";
import {
  getAllDeliveryZones,
  getDeliveryCepRanges,
  getDeliverySettings,
} from "@/modules/delivery/settings";
import { DeliveryZonesManager } from "@/components/admin/delivery-zones-manager";
import { FreeShippingField } from "@/components/admin/free-shipping-field";

export const dynamic = "force-dynamic";

/**
 * Frete: cadastro das áreas de entrega (bairro/região + preço + prazo + faixas
 * de CEP). É um módulo próprio no menu, separado da agenda de Entregas. No
 * checkout, o cliente digita o CEP e o sistema acha a faixa e calcula o frete —
 * aqui a lojista controla quais áreas existem, o preço, o prazo e quais CEPs
 * cada uma atende, sem precisar de programador.
 */
export default async function AdminFretePage() {
  // TRAVA DE SERVIDOR: quem chega sem o módulo "frete" vai para a oferta.
  const staff = await requireStaffWithModule("frete");
  const [zones, ranges, settings] = await Promise.all([
    getAllDeliveryZones(staff.tenantId),
    getDeliveryCepRanges(staff.tenantId),
    getDeliverySettings(staff.tenantId),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Frete</h1>

      <div className="mt-4 max-w-2xl space-y-5">
        <p className="text-sm text-muted-foreground">
          Cadastre cada bairro ou região que você atende, com o valor do frete, o prazo e as faixas de CEP.
          No checkout, o cliente digita o CEP e o sistema acha a área e calcula o frete automaticamente. Use{" "}
          <strong>0</strong> no preço para frete grátis. CEP que não cai em nenhuma faixa mostra o WhatsApp.
        </p>

        <FreeShippingField initialCents={settings?.freeShippingMinCents ?? null} />

        <DeliveryZonesManager zones={zones} ranges={ranges} />
      </div>
    </div>
  );
}
