import type { EmailBrand } from "../send";
import { NEUTRAL_BRAND } from "./base";
import { orderPlacedEmail } from "./order-placed";

/**
 * Confirmação de pedido AVULSO (a de carrinho com várias cestas usa
 * `orderPlacedEmail` direto, com uma linha por cesta). Mantida com a mesma
 * assinatura de sempre para o checkout não precisar mudar.
 */
export function orderConfirmedEmail(
  params: {
    orderNumber: number;
    buyerName: string;
    recipientName: string;
    deliveryDateLabel: string;
    slotLabel: string;
    totalCents: number;
    orderUrl: string;
  },
  brand: EmailBrand = NEUTRAL_BRAND
) {
  const { orderNumber, buyerName, recipientName, deliveryDateLabel, slotLabel, totalCents, orderUrl } = params;
  return orderPlacedEmail(
    {
      buyerName,
      orders: [{ orderNumber, recipientName, deliveryDateLabel, slotLabel, totalCents }],
      totalCents,
      orderUrl,
    },
    brand
  );
}
