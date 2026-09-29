/**
 * Formato dos blocos de conteúdo editáveis da loja.
 *
 * Cada seção tem um formato próprio, validado por zod na hora de salvar --
 * o formulário do painel é gerado a partir daí, então acrescentar um campo é
 * mudar o schema, não reescrever tela.
 */
import { z } from "zod";

export const benefitItemSchema = z.object({
  title: z.string().trim().min(1).max(60),
  description: z.string().trim().min(1).max(160),
  icon: z.enum(["PenLine", "ShieldCheck", "Truck", "Headset", "Gift", "Clock", "Heart", "Star"]),
});

export const benefitsSchema = z.object({
  items: z.array(benefitItemSchema).max(8),
});

export const faqItemSchema = z.object({
  question: z.string().trim().min(1).max(200),
  answer: z.string().trim().min(1).max(1200),
});

export const faqSchema = z.object({
  title: z.string().trim().max(120).optional(),
  items: z.array(faqItemSchema).max(20),
});

export const signatureSchema = z.object({
  eyebrow: z.string().trim().max(80),
  title: z.string().trim().max(160),
  body: z.string().trim().max(800),
  imageUrl: z.string().trim().max(500),
});

export const whatsappCtaSchema = z.object({
  title: z.string().trim().max(160),
  body: z.string().trim().max(600),
  buttonLabel: z.string().trim().max(60),
});

export const collectionsSchema = z.object({
  title: z.string().trim().max(120),
  subtitle: z.string().trim().max(300).optional(),
  maxPriceCents: z.number().int().positive().optional(),
  highlightProductSlug: z.string().trim().max(120).optional(),
});

/**
 * Bloco de texto de uma página. `title` é opcional de propósito: a página de
 * trocas tem regras com subtítulo em negrito ("Item indisponível", "Reentrega"),
 * e achatar tudo em parágrafo corrido piorava a leitura. Com o título opcional,
 * o mesmo formato serve para os dois casos.
 */
export const pageBlockSchema = z.object({
  title: z.string().trim().max(160).optional(),
  text: z.string().trim().max(2000),
});

export const richPageSchema = z.object({
  title: z.string().trim().max(160),
  /** Texto puro, sem HTML -- não abre porta para injeção de código. */
  blocks: z.array(pageBlockSchema).max(40),
});

export const businessSchema = z.object({
  description: z.string().trim().max(400),
  priceRange: z.string().trim().max(40),
  streetAddress: z.string().trim().max(200),
  addressLocality: z.string().trim().max(120),
  addressRegion: z.string().trim().max(40),
  areaServed: z.string().trim().max(120),
  opensAt: z.string().trim().max(10),
  closesAt: z.string().trim().max(10),
  openDays: z.array(
    z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"])
  ),
});

export const categoryTilesSchema = z.object({
  title: z.string().trim().max(160),
});

/**
 * Link editável pelo painel: vazio (sem link), caminho interno ("/categoria/x")
 * ou https. Recusa `javascript:`, `data:` e "//dominio" (protocolo relativo,
 * que o navegador trataria como site de fora).
 */
export const safeHrefSchema = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || /^\/(?!\/)/.test(v) || /^https:\/\//i.test(v), {
    message: "Use um caminho do site (começando com /) ou um link https.",
  });

const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

/**
 * Barra de aviso no topo da loja (frete grátis, feriado, promoção...). Some
 * inteira quando desligada ou sem texto -- a barra só existe para avisos.
 */
export const announcementSchema = z.object({
  enabled: z.boolean(),
  text: z.string().trim().max(160),
  href: safeHrefSchema.optional(),
  bgColor: hexColorSchema.optional(),
  textColor: hexColorSchema.optional(),
});

/**
 * Imagem de banner enviada pelo painel: só o Storage público do Supabase (o
 * único host que o next/image aceita em next.config.ts) ou um arquivo do
 * próprio site. Qualquer outro host quebraria a página na hora de renderizar.
 */
export const promoImageUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) =>
      v === "" ||
      /^\/(?!\/)/.test(v) ||
      /^https:\/\/oygizajevizwhiymgsly\.supabase\.co\/storage\/v1\/object\/public\//.test(v),
    { message: "Envie a imagem pelo painel." }
  );

export const promoSlotSchema = z.object({
  imageUrl: promoImageUrlSchema,
  mobileImageUrl: promoImageUrlSchema.optional(),
  href: safeHrefSchema,
  alt: z.string().trim().max(160),
});

/**
 * Dois banners promocionais no meio da grade de produtos da home: um largo
 * (2/3 da largura no computador) e um estreito (1/3). Aparecem após a 3ª
 * linha de produtos; slot sem imagem não aparece.
 */
export const promoBannersSchema = z.object({
  enabled: z.boolean(),
  wide: promoSlotSchema,
  narrow: promoSlotSchema,
  /**
   * Banner (só no computador) que ocupa o espaço vazio ao lado da ÚLTIMA linha
   * da grade, quando o nº de produtos não fecha a linha de 5. Opcional: o que
   * já está salvo no banco não tem este campo.
   */
  fill: promoSlotSchema.optional(),
});

/** Toda seção conhecida da vitrine, com seu formato. */
export const STORE_SECTIONS = {
  benefits: benefitsSchema,
  faq: faqSchema,
  signature: signatureSchema,
  whatsapp_cta: whatsappCtaSchema,
  collections: collectionsSchema,
  category_tiles: categoryTilesSchema,
  business: businessSchema,
  about: richPageSchema,
  returns: richPageSchema,
  announcement: announcementSchema,
  promo_banners: promoBannersSchema,
} as const;

export type StoreSection = keyof typeof STORE_SECTIONS;
export type StoreContent = {
  [K in StoreSection]: z.infer<(typeof STORE_SECTIONS)[K]>;
};
