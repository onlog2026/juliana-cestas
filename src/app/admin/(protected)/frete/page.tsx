import { requireStaffWithModule } from "@/lib/auth/require-module";
import { getAllDeliveryZones } from "@/modules/delivery/settings";
import { DeliveryZonesManager } from "@/components/admin/delivery-zones-manager";

export const dynamic = "force-dynamic";

/**
 * Frete: cadastro das áreas de entrega (bairro/região + preço). É um módulo
 * próprio no menu, separado da agenda de Entregas. O checkout já lê essas áreas
 * e o cliente escolhe a dele num menu; aqui a lojista controla quais existem e
 * quanto custa cada uma, sem precisar de programador.
 */
export default async function AdminFretePage() {
  // TRAVA DE SERVIDOR: quem chega sem o módulo "frete" vai para a oferta.
  const staff = await requireStaffWithModule("frete");
  const zones = await getAllDeliveryZones(staff.tenantId);

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Frete</h1>

      <div className="mt-4 max-w-2xl">
        <p className="text-sm text-muted-foreground">
          Cadastre cada bairro ou região que você atende e o valor do frete. No checkout, o cliente escolhe a
          área dele e o valor entra no total do pedido. Use <strong>0</strong> no preço para frete grátis.
        </p>

        <div className="mt-5">
          <DeliveryZonesManager zones={zones} />
        </div>
      </div>
    </div>
  );
}
