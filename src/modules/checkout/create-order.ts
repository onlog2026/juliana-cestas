import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { TENANT_ID } from "@/lib/tenant";
import { generatePublicToken, hashToken } from "@/modules/orders/token";
import { getProductForCheckout } from "@/modules/catalog/service";
import { quoteCheckout } from "@/modules/checkout/quote";
import {
  getDeliverySettings,
  getDeliveryZones,
  getSlotOccupancy,
} from "@/modules/delivery/settings";
import { generateSlots, isSlotStillAvailable } from "@/modules/delivery/slots";
import { countWords } from "@/modules/cards/templates";
import type { CheckoutInput } from "@/modules/checkout/schemas";

export type CreateOrderResult =
  | { ok: true; orderId: string; number: number; token: string; totalCents: number }
  | { ok: false; error: string };

export async function createOrder(input: CheckoutInput): Promise<CreateOrderResult> {
  const found = await getProductForCheckout(input.productSlug);
  if (!found) return { ok: false, error: "Cesta não encontrada." };

  const settings = await getDeliverySettings();
  if (!settings) return { ok: false, error: "Configuração de entrega indisponível." };

  if (countWords(input.cardMessage) > settings.cardMaxWords) {
    return { ok: false, error: `A mensagem do cartão passa de ${settings.cardMaxWords} palavras.` };
  }

  // Revalida o slot no servidor -- nunca confia no que o cliente mandou.
  const occupancy = await getSlotOccupancy(input.deliveryDate, input.deliveryDate);
  const days = generateSlots(settings, new Date(), occupancy);
  if (!isSlotStillAvailable(days, input.deliveryDate, input.deliverySlotStart)) {
    return { ok: false, error: "Esse horário não está mais disponível. Escolha outro." };
  }
  const day = days.find((d) => d.date === input.deliveryDate);
  const slot = day?.slots.find((s) => s.start === input.deliverySlotStart);
  if (!slot) return { ok: false, error: "Horário inválido." };

  const quote = await quoteCheckout({
    productSlug: input.productSlug,
    addonSlugs: input.addonSlugs,
    deliveryType: input.deliveryType,
    zoneId: input.zoneId,
  });
  if (!quote.ok) return { ok: false, error: quote.error };

  // O token só é gravado DEPOIS que sabemos se o pedido é novo ou já
  // existia (ver comentário após a chamada da RPC) -- gerar antes e nunca
  // reconciliar deixaria uma reentrega por idempotência com um token que
  // não bate com o hash salvo.
  const placeholderTokenHash = hashToken(generatePublicToken());
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const zones = input.deliveryType === "delivery" ? await getDeliveryZones() : [];
  const zone = zones.find((z) => z.id === input.zoneId);

  const items = [
    {
      kind: "product",
      product_id: found.product.id,
      name: found.product.name,
      unit_price_cents: found.product.price_cents,
      qty: 1,
      items_snapshot: found.product.items,
    },
    ...input.addonSlugs
      .map((slug) => found.addons.find((a) => a.slug === slug))
      .filter((a): a is NonNullable<typeof a> => Boolean(a))
      .map((addon) => ({
        kind: "addon",
        addon_id: addon.id,
        name: addon.name,
        unit_price_cents: addon.price_cents,
        qty: 1,
        items_snapshot: null,
      })),
  ];

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("create_order_tx", {
    p: {
      tenant_id: TENANT_ID,
      idempotency_key: input.idempotencyKey,
      buyer_name: input.buyerName,
      buyer_email: input.buyerEmail,
      buyer_phone: input.buyerPhone,
      buyer_cpf: input.buyerCpf,
      recipient_name: input.recipientName,
      recipient_phone: input.recipientPhone || null,
      delivery_type: input.deliveryType,
      cep: input.cep || null,
      street: input.street || null,
      address_number: input.addressNumber || null,
      complement: input.complement || null,
      neighborhood: input.neighborhood || null,
      city: input.city || null,
      state: input.state || null,
      zone_id: input.zoneId || null,
      zone_name: zone?.name ?? null,
      delivery_date: input.deliveryDate,
      delivery_slot_start: slot.start,
      delivery_slot_end: slot.end,
      card_template: input.cardTemplate,
      card_recipient: input.cardRecipient,
      card_sender: input.cardSender || null,
      card_message: input.cardMessage,
      notes: input.notes || null,
      subtotal_cents: quote.subtotalCents,
      addons_cents: quote.addonsCents,
      delivery_fee_cents: quote.deliveryFeeCents,
      total_cents: quote.totalCents,
      public_token_hash: placeholderTokenHash,
      expires_at: expiresAt,
      items,
    },
  });

  if (error) {
    if (error.message?.includes("slot_full")) {
      return { ok: false, error: "Esse horário acabou de lotar. Escolha outro." };
    }
    return { ok: false, error: "Não foi possível criar o pedido. Tente de novo." };
  }

  const order = Array.isArray(data) ? data[0] : data;

  // Sempre emite um token novo aqui (nunca o placeholder acima) e grava o
  // hash dele no pedido -- seja ele recém-criado ou devolvido pela
  // idempotência (mesma idempotency_key de uma tentativa anterior cuja
  // resposta o cliente nunca chegou a ver, então reemitir é seguro: quem
  // tinha o token antigo nunca existiu do lado do cliente).
  const token = generatePublicToken();
  const { error: tokenError } = await supabase
    .from("orders")
    .update({ public_token_hash: hashToken(token) })
    .eq("id", order.id);
  if (tokenError) {
    return { ok: false, error: "Pedido criado, mas houve falha ao gerar o link de acesso. Fale no WhatsApp." };
  }

  return { ok: true, orderId: order.id, number: order.number, token, totalCents: order.total_cents };
}
