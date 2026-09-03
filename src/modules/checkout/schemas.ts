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

export const checkoutInputSchema = z
  .object({
    idempotencyKey: z.string().uuid(),
    productSlug: z.string().min(1),
    addonSlugs: z.array(z.string()),
    upsellSlugs: z.array(z.string()),

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

    recipientName: z.string().trim().min(2, "Digite o nome de quem vai receber").max(120),
    recipientPhone: z
      .string()
      .trim()
      .transform((v) => v.replace(/\D/g, ""))
      .optional()
      .or(z.literal("")),

    deliveryType: z.enum(["delivery", "pickup"]),
    cep: z.string().trim().optional(),
    street: z.string().trim().optional(),
    addressNumber: z.string().trim().max(20).optional(),
    complement: z.string().trim().max(80).optional(),
    neighborhood: z.string().trim().optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().max(2).optional(),
    // "" é o valor real que o <select> não tocado manda (retirada na loja
    // nunca renderiza esse campo) -- sem aceitar "", checkout com retirada
    // falhava a validação em silêncio e o botão "Ir para pagamento" não
    // fazia nada.
    zoneId: z.union([z.string().uuid(), z.literal("")]).optional(),

    deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    deliverySlotStart: z.string().regex(/^\d{2}:\d{2}$/),

    cardTemplate: z.enum(cardTemplateSlugs),
    cardRecipient: z.string().trim().min(1).max(60),
    cardSender: z.string().trim().max(60).optional(),
    cardMessage: z.string().trim().min(1).max(400),

    notes: z.string().trim().max(300).optional(),
  })
  .refine(
    (data) =>
      data.deliveryType === "pickup" ||
      (data.addressNumber && data.zoneId && data.street && data.neighborhood),
    { message: "Endereço incompleto", path: ["addressNumber"] }
  );

export type CheckoutInput = z.infer<typeof checkoutInputSchema>;
