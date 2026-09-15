import { requireStaffWithModule } from "@/lib/auth/require-module";
import { getAllDeliveryZones } from "@/modules/delivery/settings";
import { DeliveryZonesManager } from "@/components/admin/delivery-zones-manager";
import { EntregasTabs } from "@/components/admin/entregas-tabs";

export const dynamic = "force-dynamic";

/**
 * Cadastro das áreas de entrega (bairro/região + preço do frete). O checkout já
 * lê essas áreas e o cliente escolhe a dele num menu; aqui a lojista controla
 * quais existem e quanto custa cada uma, sem precisar de programador.
 */
export default async function AdminAreasEntregaPage() {
  // TRAVA DE SERVIDOR: quem chega sem o módulo "entregas" vai para a oferta.
  const staff = await requireStaffWithModule("entregas");
  const zones = await getAllDeliveryZones(staff.tenantId);

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Entregas</h1>
      <EntregasTabs active="areas" />

      <div className="mt-6 max-w-2xl">
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
