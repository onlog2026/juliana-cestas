// Tipos do carrinho de presentes (client-side). Cada item = UMA cesta com seu
// próprio destinatário, entrega, data/horário e cartãozinho. Vários itens ficam
// sob UM comprador e UMA finalização (o comprador mora fora do item, no carrinho).
//
// IMPORTANTE: os valores em centavos aqui são ESTIMATIVA para exibir na tela. O
// preço que vale (o que o cliente vê no fim) é sempre recalculado no servidor no
// momento de finalizar (quoteCheckout) -- nunca confiar no que veio do navegador.

export type DeliveryType = "delivery" | "pickup";

export type CartGiftDelivery = {
  type: DeliveryType;
  cep: string;
  street: string;
  addressNumber: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  /** "YYYY-MM-DD" */
  deliveryDate: string;
  /** "HH:MM" */
  deliverySlotStart: string;
  /** Frete estimado (centavos) só para exibir; null = ainda não calculado. */
  feeCents: number | null;
  /** Nome da área/zona ou transportadora, para mostrar "Entrega para X". */
  zoneName: string | null;
};

export type CartGiftCard = {
  template: string;
  recipient: string;
  sender: string;
  message: string;
};

/** Foto/nome/preço-base do produto congelados na hora de adicionar, só p/ exibir. */
export type CartItemDisplay = {
  name: string;
  imageUrl: string | null;
  priceCents: number;
};

export type CartItem = {
  /** id local do item no carrinho (não é o id do produto). */
  id: string;
  /** chave de idempotência para o create_order_tx na finalização (Fase 2). */
  idempotencyKey: string;
  productSlug: string;
  productId: string | null;
  /** Adicionais escolhidos; repetição do slug = quantidade (igual ao checkout). */
  addonSlugs: string[];
  upsellSlugs: string[];
  recipient: { name: string; phone: string };
  delivery: CartGiftDelivery;
  card: CartGiftCard;
  notes: string;
  display: CartItemDisplay;
  /** Subtotal estimado da cesta (produto + adicionais + upsell + frete), em
   *  centavos, calculado no editor só para exibir; null = ainda não editada.
   *  O valor que vale é sempre recalculado no servidor na finalização. */
  estimatedCents: number | null;
};

/** Dados do comprador, preenchidos UMA vez na finalização do carrinho. */
export type CartBuyer = {
  name: string;
  email: string;
  phone: string;
  cpf: string;
};

export const CART_STORAGE_KEY = "jc:cart:v1";
export const CART_STORAGE_VERSION = 1;
