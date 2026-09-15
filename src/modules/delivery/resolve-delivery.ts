import "server-only";
import { resolveZoneByCep, type ResolvedZone } from "@/modules/delivery/settings";
import { getMelhorEnvioClient } from "@/modules/shipping/melhor-envio-config";
import { getStoreProfile } from "@/modules/settings/store-profile";
import type { CarrierOption } from "@/modules/shipping/melhor-envio-client";

/**
 * Resolve a entrega para um CEP: local (zona) OU transportadora nacional OU
 * não atendido. Usado só pela COTAÇÃO exibida ao cliente (`/api/frete`) --
 * de propósito NÃO é usado por `quoteCheckout`/`create-order`, que continuam
 * exigindo zona local pra fechar o pedido automaticamente. Fechar um pedido
 * nacional ainda passa por combinar no WhatsApp: a cotação de transportadora
 * não foi testada ao vivo (sem token real disponível), então não convém
 * apostar o cálculo final do checkout nela ainda.
 */
export type ShipsNationallyProduct = {
  deliveryFeeCents: number;
  shipsNationally: boolean;
  weightGrams: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
};

export type DeliveryResolution =
  | { kind: "zone"; zone: ResolvedZone }
  | { kind: "carrier"; options: CarrierOption[] }
  | { kind: "not_served" };

/** O produto tem tudo que uma cotação de transportadora precisa? */
export function isEligibleForCarrierShipping(product: ShipsNationallyProduct): boolean {
  return (
    product.shipsNationally &&
    Number.isInteger(product.weightGrams) &&
    (product.weightGrams as number) > 0 &&
    Number.isInteger(product.lengthCm) &&
    (product.lengthCm as number) > 0 &&
    Number.isInteger(product.widthCm) &&
    (product.widthCm as number) > 0 &&
    Number.isInteger(product.heightCm) &&
    (product.heightCm as number) > 0
  );
}

export async function resolveDelivery(
  tenantId: string,
  input: { cep: string; product: ShipsNationallyProduct }
): Promise<DeliveryResolution> {
  const zone = await resolveZoneByCep(tenantId, input.cep);
  if (zone) return { kind: "zone", zone };

  if (!isEligibleForCarrierShipping(input.product)) return { kind: "not_served" };

  const client = getMelhorEnvioClient();
  if (!client) return { kind: "not_served" };

  const profile = await getStoreProfile(tenantId);
  const originCep = (profile.cep ?? "").replace(/\D/g, "");
  if (originCep.length !== 8) return { kind: "not_served" };

  try {
    const options = await client.calculate({
      fromCep: originCep,
      toCep: input.cep,
      weightGrams: input.product.weightGrams as number,
      lengthCm: input.product.lengthCm as number,
      widthCm: input.product.widthCm as number,
      heightCm: input.product.heightCm as number,
    });
    return options.length > 0 ? { kind: "carrier", options } : { kind: "not_served" };
  } catch {
    // Best-effort: qualquer falha da transportadora cai no "não atendido" em
    // vez de quebrar a tela de frete do cliente.
    return { kind: "not_served" };
  }
}
