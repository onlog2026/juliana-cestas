import type { CartItem } from "./types";

/**
 * Pendências de uma cesta (lista vazia = pronta para finalizar). Mesmas regras
 * que o editor usa para liberar o "Salvar" e que a lista usa para o selo
 * "faltam dados". Fonte única para não divergir. Não é a validação final -- o
 * servidor revalida tudo (checkoutInputSchema) na hora de criar o pedido.
 */
export function giftIssues(gift: CartItem): string[] {
  const out: string[] = [];

  if (gift.recipient.name.trim().length < 2) out.push("quem vai receber");

  if (gift.delivery.type === "delivery") {
    if (gift.delivery.cep.replace(/\D/g, "").length !== 8) out.push("CEP");
    if (!gift.delivery.street.trim()) out.push("rua");
    if (!gift.delivery.addressNumber.trim()) out.push("número");
    if (!gift.delivery.neighborhood.trim()) out.push("bairro");
  }

  if (!gift.delivery.deliveryDate) out.push("data");
  if (!gift.delivery.deliverySlotStart) out.push("horário");

  if (!gift.card.template) out.push("modelo do cartão");
  if (!gift.card.recipient.trim()) out.push("nome no cartão (Para)");
  if (!gift.card.message.trim()) out.push("mensagem do cartão");

  return out;
}

export function isGiftComplete(gift: CartItem): boolean {
  return giftIssues(gift).length === 0;
}
