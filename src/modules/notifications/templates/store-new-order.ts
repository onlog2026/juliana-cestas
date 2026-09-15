import { formatCents } from "@/lib/money";

/**
 * Monta o texto do aviso de "pedido novo" que vai pro WhatsApp da loja.
 * Função pura (sem `server-only`, sem banco) para ser testável isolada -- quem
 * chama (create-order.ts) já tem todos os dados prontos, sem query extra.
 */
export type StoreNewOrderInput = {
  orderNumber: number;
  buyerName: string;
  buyerPhone: string;
  recipientName: string;
  items: { name: string; unit_price_cents: number; qty: number }[];
  deliveryType: "delivery" | "pickup";
  /** Endereço já formatado numa linha (rua, número — bairro), ou null para retirada. */
  addressLine: string | null;
  zoneName: string | null;
  deliveryDateLabel: string;
  slotLabel: string;
  cardRecipient: string;
  cardMessage: string;
  totalCents: number;
  orderUrl: string;
};

export function buildStoreNewOrderText(input: StoreNewOrderInput): string {
  const linhasItens = input.items
    .map((item) => `• ${item.qty}x ${item.name} — ${formatCents(item.unit_price_cents * item.qty)}`)
    .join("\n");

  const linhaEntrega =
    input.deliveryType === "pickup"
      ? "Retirada na loja"
      : [input.addressLine, input.zoneName ? `(${input.zoneName})` : null].filter(Boolean).join(" ");

  return [
    `🛍️ *Novo pedido #${input.orderNumber}*`,
    "",
    `*Cliente:* ${input.buyerName} — ${formatPhoneDisplay(input.buyerPhone)}`,
    `*Para:* ${input.recipientName}`,
    "",
    linhasItens,
    "",
    `*Entrega:* ${linhaEntrega}`,
    `*Data:* ${input.deliveryDateLabel}, entre ${input.slotLabel}`,
    "",
    `*Cartão para ${input.cardRecipient}:*`,
    `"${input.cardMessage}"`,
    "",
    `*Total: ${formatCents(input.totalCents)}*`,
    "",
    `Ver pedido: ${input.orderUrl}`,
  ].join("\n");
}

/** "61999999999" -> "(61) 99999-9999" (só para exibição; nunca usado para enviar). */
function formatPhoneDisplay(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digits;
}
