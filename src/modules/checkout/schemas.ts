import { z } from "zod";
import { CARD_TEMPLATES } from "@/modules/cards/templates";

const cardTemplateSlugs = CARD_TEMPLATES.map((t) => t.slug) as [string, ...string[]];

function isValidCpf(raw: string): boolean {
  const cpf = raw.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digits = cpf.split("").map(Number);
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += digits[i] * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calc(9) === digits[9] && calc(10) === digits[10];
}

// Campos do comprador, isolados para o carrinho poder validar o mesmo bloco
// (uma vez por carrinho) sem duplicar a conta do dígito verificador do CPF.
// Fonte única: checkoutInputSchema usa exatamente este shape via spread abaixo.
export const checkoutBuyerSchema = z.object({
  buyerName: z.string().trim().min(3, "Digite o nome completo").max(120),
  buyerEmail: z.string().trim().email("E-mail inválido"),
  buyerPhone: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length === 10 || v.length === 11, "Telefone inválido"),
  buyerCpf: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .refine(isValidCpf, "CPF inválido"),
});

// Objeto base (pré-refine), exportado para o carrinho poder derivar o shape de
// UM presente (mesmos campos, sem os de comprador -- o comprador é validado
// uma vez só via checkoutBuyerSchema). checkoutInputSchema abaixo é este
// mesmo objeto + o refine de entrega; nada muda pro checkout de 1 produto.
export const checkoutObjectSchema = z.object({
  idempotencyKey: z.string().uuid(),
  productSlug: z.string().min(1),
  addonSlugs: z.array(z.string()).max(60),
  upsellSlugs: z.array(z.string()),
  couponCode: z.string().trim().max(40).optional(),

  ...checkoutBuyerSchema.shape,

  recipientName: z.string().trim().min(2, "Digite o nome de quem vai receber").max(120),
  recipientPhone: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .optional()
    .or(z.literal("")),

  deliveryType: z.enum(["delivery", "pickup"]),
  // O CEP define a zona/frete (derivada no servidor via faixa de CEP). Não há
  // mais seleção manual de região.
  cep: z.string().trim().optional(),
  street: z.string().trim().optional(),
  addressNumber: z.string().trim().max(20).optional(),
  complement: z.string().trim().max(80).optional(),
  neighborhood: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().max(2).optional(),

  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  deliverySlotStart: z.string().regex(/^\d{2}:\d{2}$/),

  cardTemplate: z.enum(cardTemplateSlugs),
  cardRecipient: z.string().trim().min(1).max(60),
  cardSender: z.string().trim().max(60).optional(),
  cardMessage: z.string().trim().min(1).max(400),

  notes: z.string().trim().max(300).optional(),
});

function requiresAddressWhenDelivery(data: {
  deliveryType: "delivery" | "pickup";
  cep?: string;
  addressNumber?: string;
  street?: string;
  neighborhood?: string;
}): boolean {
  return (
    data.deliveryType === "pickup" ||
    ((data.cep ?? "").replace(/\D/g, "").length === 8 &&
      Boolean(data.addressNumber) &&
      Boolean(data.street) &&
      Boolean(data.neighborhood))
  );
}

export const checkoutInputSchema = checkoutObjectSchema.refine(requiresAddressWhenDelivery, {
  message: "Preencha o CEP e o endereço para a entrega.",
  path: ["cep"],
});

export type CheckoutInput = z.infer<typeof checkoutInputSchema>;

// Shape de UM presente do carrinho: o mesmo objeto, sem os campos de
// comprador (validados uma vez via checkoutBuyerSchema) nem cupom (v1 do
// carrinho não aplica cupom por grupo). O mesmo refine de entrega vale aqui.
export const giftInputSchema = checkoutObjectSchema
  .omit({ buyerName: true, buyerEmail: true, buyerPhone: true, buyerCpf: true, couponCode: true })
  .refine(requiresAddressWhenDelivery, {
    message: "Preencha o CEP e o endereço para a entrega.",
    path: ["cep"],
  });

export type GiftInput = z.infer<typeof giftInputSchema>;
