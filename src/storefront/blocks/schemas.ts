/**
 * O CATÁLOGO DE BLOCOS — parte de DADO PURO.
 *
 * Aqui mora tudo que descreve um bloco menos o componente React: o tipo, as
 * variações, o formato dos campos (zod, igual ao `src/modules/content/types.ts`)
 * e os valores padrão. Só strings, números e schemas.
 *
 * Por que separado do componente: este arquivo é lido pelo painel, pelo
 * serviço que grava no banco e pelos testes unitários. Se ele importasse os
 * componentes, importaria junto `next/image`, `server-only` e as consultas ao
 * banco — e um teste de "trocar de modelo não perde texto" passaria a depender
 * de renderizar JSX. O componente entra em `src/storefront/registry.ts`, que é
 * quem junta as duas metades.
 *
 * O `schema` de cada bloco VIRA FORMULÁRIO no painel: acrescentar um campo é
 * acrescentar uma linha no zod, não reescrever tela.
 */
import { z } from "zod";
import type { StoreSection } from "@/modules/content/types";

/** Nomes de ícone do lucide-react aceitos nos blocos que têm ícone. */
export const BLOCK_ICON_NAMES = [
  "PenLine",
  "ShieldCheck",
  "Truck",
  "Headset",
  "Gift",
  "Clock",
  "Heart",
  "Star",
  "Sparkles",
  "MapPin",
  "CreditCard",
  "PackageCheck",
] as const;

export const blockIconSchema = z.enum(BLOCK_ICON_NAMES);
export type BlockIconName = (typeof BLOCK_ICON_NAMES)[number];

/** Caminho interno da loja. Nunca aceita `javascript:` nem host de fora. */
const internalHref = z
  .string()
  .trim()
  .max(200)
  .refine((v) => v === "" || v.startsWith("/") || v.startsWith("#"), {
    message: "O link tem que começar com / ou #",
  });

const imageUrlSchema = z.string().trim().max(500);

export type BlockVariant = {
  key: string;
  label: string;
  /** Uma frase em português explicando quando usar esta variação. */
  description: string;
};

export type BlockSpec<P> = {
  type: string;
  label: string;
  description: string;
  variants: readonly BlockVariant[];
  schema: z.ZodType<P>;
  defaults: P;
  /**
   * Módulo que a loja precisa ter contratado para este bloco aparecer.
   * Sem isso, o renderizador simplesmente pula o bloco.
   */
  requiresModule?: string;
  /**
   * Seção de `site_content` de onde este bloco tira o TEXTO.
   *
   * É esta ligação que faz a troca de modelo não perder nada: o texto não mora
   * na página, mora em `site_content`. Trocar o modelo troca a montagem das
   * seções; o texto continua exatamente onde estava.
   */
  contentSection?: StoreSection;
};

/* ────────────────────── blocos que embrulham o que já existe ────────────── */

export const heroSchema = z.object({
  /** Botões logo abaixo do carrossel (a "Ver cestas" / "Mais pedidas" de hoje). */
  quickLinks: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(40),
        href: internalHref,
        /** `solid` = botão cheio; `outline` = botão vazado. */
        style: z.enum(["solid", "outline"]),
      })
    )
    .max(4),
  /** Daqui para baixo, só a variação `split` usa. */
  eyebrow: z.string().trim().max(80),
  headline: z.string().trim().max(160),
  body: z.string().trim().max(600),
  imageUrl: imageUrlSchema,
  imageAlt: z.string().trim().max(160),
});
export type HeroProps = z.infer<typeof heroSchema>;

export const heroBlock: BlockSpec<HeroProps> = {
  type: "hero",
  label: "Topo da página",
  description: "A primeira coisa que o cliente vê.",
  variants: [
    {
      key: "carousel",
      label: "Carrossel de banners",
      description: "As fotos grandes que passam sozinhas, do jeito que está hoje.",
    },
    {
      key: "split",
      label: "Foto + manifesto",
      description: "Metade foto, metade texto. Para loja que se apresenta pela historia.",
    },
  ],
  schema: heroSchema,
  defaults: {
    quickLinks: [],
    eyebrow: "",
    headline: "",
    body: "",
    imageUrl: "",
    imageAlt: "",
  },
};

export const categoryGridSchema = z.object({
  /** Vazio = mostra o título gravado em CMS > Textos. */
  titleOverride: z.string().trim().max(160),
  sticky: z.boolean(),
});
export type CategoryGridProps = z.infer<typeof categoryGridSchema>;

export const categoryGridBlock: BlockSpec<CategoryGridProps> = {
  type: "category-grid",
  label: "Categorias",
  description: "Atalhos para os grupos de produtos da loja.",
  variants: [
    { key: "tiles", label: "Quadradinhos com foto", description: "Foto, nome e porção. É o de hoje." },
    {
      key: "pills",
      label: "Pílulas no topo",
      description: "Só o nome, em pílulas que acompanham a rolagem. Para catálogo grande.",
    },
  ],
  schema: categoryGridSchema,
  defaults: { titleOverride: "", sticky: false },
  contentSection: "category_tiles",
};

export const productGridSchema = z.object({
  title: z.string().trim().max(120),
  subtitle: z.string().trim().max(300),
  /** 0 = mostra todos. */
  limit: z.number().int().min(0).max(60),
  /** Só a variação `dense` usa: mostra as pílulas de filtro por categoria. */
  showFilters: z.boolean(),
});
export type ProductGridProps = z.infer<typeof productGridSchema>;

export const productGridBlock: BlockSpec<ProductGridProps> = {
  type: "product-grid",
  label: "Grade de produtos",
  description: "Os produtos da loja em grade.",
  variants: [
    {
      key: "featured",
      label: "Mais pedidas",
      description: "A grade de hoje, com o titulo fixo Mais pedidas.",
    },
    {
      key: "asymmetric",
      label: "Destaques desiguais",
      description: "Um produto grande ao lado de outros menores. Visual de revista.",
    },
    {
      key: "dense",
      label: "Grade densa com filtros",
      description: "Muitos produtos por tela, com filtro por categoria. Para catálogo grande.",
    },
  ],
  schema: productGridSchema,
  defaults: { title: "Mais pedidas", subtitle: "", limit: 0, showFilters: false },
};

export const signatureBlockSchema = z.object({
  /** Vazio = usa a foto gravada em CMS > Textos. */
  imageOverride: imageUrlSchema,
});
export type SignatureProps = z.infer<typeof signatureBlockSchema>;

export const signatureBlock: BlockSpec<SignatureProps> = {
  type: "signature",
  label: "Cartãozinho",
  description: "O bloco do cartão escrito à mão que vai junto com o pedido.",
  variants: [
    { key: "image-text", label: "Como está hoje", description: "Preview do cartão com o texto ao lado." },
    { key: "split", label: "Foto grande ao lado", description: "Mesma ideia, com mais peso na foto." },
  ],
  schema: signatureBlockSchema,
  defaults: { imageOverride: "" },
  contentSection: "signature",
};

export const collectionSpotlightSchema = z.object({});
export type CollectionSpotlightProps = z.infer<typeof collectionSpotlightSchema>;

export const collectionSpotlightBlock: BlockSpec<CollectionSpotlightProps> = {
  type: "collection-spotlight",
  label: "Seleção especial",
  description: "Uma faixa de preço em destaque + um produto escolhido a dedo.",
  variants: [{ key: "spotlight", label: "Como está hoje", description: "Duas colunas: a seleção e o destaque." }],
  schema: collectionSpotlightSchema,
  defaults: {},
  contentSection: "collections",
};

export const benefitsBlockSchema = z.object({});
export type BenefitsProps = z.infer<typeof benefitsBlockSchema>;

export const benefitsBlock: BlockSpec<BenefitsProps> = {
  type: "benefits",
  label: "Benefícios",
  description: "A faixa com os motivos para comprar aqui.",
  variants: [
    { key: "icons-row", label: "Ícone + texto", description: "Quatro colunas com ícone, título e frase. É o de hoje." },
    { key: "compact", label: "Faixa fina", description: "Só ícone e título, numa linha só. Ocupa menos espaço." },
  ],
  schema: benefitsBlockSchema,
  defaults: {},
  contentSection: "benefits",
};

export const faqBlockSchema = z.object({});
export type FaqProps = z.infer<typeof faqBlockSchema>;

export const faqBlock: BlockSpec<FaqProps> = {
  type: "faq",
  label: "Perguntas frequentes",
  description: "As dúvidas que mais chegam, com a resposta.",
  variants: [{ key: "accordion", label: "Sanfona", description: "Clica na pergunta e abre a resposta." }],
  schema: faqBlockSchema,
  defaults: {},
  contentSection: "faq",
};

export const ctaWhatsappSchema = z.object({});
export type CtaWhatsappProps = z.infer<typeof ctaWhatsappSchema>;

export const ctaWhatsappBlock: BlockSpec<CtaWhatsappProps> = {
  type: "cta-whatsapp",
  label: "Chamada do WhatsApp",
  description: "A faixa que convida o cliente a chamar no WhatsApp.",
  variants: [{ key: "band", label: "Faixa larga", description: "Faixa com o botão do WhatsApp. É o de hoje." }],
  schema: ctaWhatsappSchema,
  defaults: {},
  contentSection: "whatsapp_cta",
};

/* ────────────────────────────── blocos novos ────────────────────────────── */

export const richTextSchema = z.object({
  eyebrow: z.string().trim().max(80),
  title: z.string().trim().max(160),
  /** Texto puro, sem HTML — mesma decisão do `pageBlockSchema` do CMS. */
  body: z.string().trim().max(2000),
  align: z.enum(["left", "center"]),
});
export type RichTextProps = z.infer<typeof richTextSchema>;

export const richTextBlock: BlockSpec<RichTextProps> = {
  type: "rich-text",
  label: "Texto",
  description: "Um trecho de texto solto — história da loja, aviso, explicação.",
  variants: [
    { key: "prose", label: "Parágrafo normal", description: "Texto corrido, tamanho de leitura." },
    {
      key: "manifesto",
      label: "Manifesto",
      description: "Letra grande, poucas linhas. Para a frase que define a loja.",
    },
  ],
  schema: richTextSchema,
  defaults: {
    eyebrow: "",
    title: "Sobre a nossa loja",
    body: "Conte aqui, em poucas linhas, o que faz a sua loja ser diferente.",
    align: "left",
  },
};

export const testimonialsSchema = z.object({
  title: z.string().trim().max(160),
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        city: z.string().trim().max(80),
        text: z.string().trim().min(1).max(600),
        /** 0 = não mostra estrela nenhuma. */
        rating: z.number().int().min(0).max(5),
      })
    )
    .max(12),
});
export type TestimonialsProps = z.infer<typeof testimonialsSchema>;

export const testimonialsBlock: BlockSpec<TestimonialsProps> = {
  type: "testimonials",
  label: "Depoimentos",
  description: "O que os clientes disseram. Só entra aqui o que o cliente autorizou.",
  variants: [
    { key: "cards", label: "Cartões lado a lado", description: "Vários depoimentos curtos em cartões." },
    {
      key: "quote",
      label: "Um depoimento grande",
      description: "Um só, em letra grande. Para o depoimento mais forte.",
    },
  ],
  schema: testimonialsSchema,
  defaults: {
    title: "Quem já pediu",
    items: [],
  },
};

export const gallerySchema = z.object({
  title: z.string().trim().max(160),
  items: z
    .array(
      z.object({
        imageUrl: imageUrlSchema,
        alt: z.string().trim().max(160),
        caption: z.string().trim().max(160),
      })
    )
    .max(24),
});
export type GalleryProps = z.infer<typeof gallerySchema>;

export const galleryBlock: BlockSpec<GalleryProps> = {
  type: "gallery",
  label: "Galeria de fotos",
  description: "Fotos soltas — bastidores, entregas, marcas que você trabalha.",
  variants: [
    { key: "masonry", label: "Mosaico", description: "Fotos de alturas diferentes, encaixadas." },
    { key: "strip", label: "Faixa horizontal", description: "Uma fila de fotos que rola para o lado." },
    { key: "logos", label: "Marcas", description: "Logos lado a lado, para a faixa de marcas parceiras." },
  ],
  schema: gallerySchema,
  defaults: { title: "", items: [] },
};

export const promoBarSchema = z.object({
  text: z.string().trim().max(160),
  linkLabel: z.string().trim().max(40),
  linkHref: internalHref,
  tone: z.enum(["primary", "gold", "dark"]),
});
export type PromoBarProps = z.infer<typeof promoBarSchema>;

export const promoBarBlock: BlockSpec<PromoBarProps> = {
  type: "promo-bar",
  label: "Faixa de aviso",
  description: "Uma linha fina no topo com promoção, frete ou prazo.",
  variants: [
    { key: "bar", label: "Faixa colorida", description: "Uma linha com o aviso e um link." },
    { key: "badges", label: "Selos", description: "Três selos curtos, tipo entrega no mesmo dia." },
  ],
  schema: promoBarSchema,
  defaults: { text: "", linkLabel: "", linkHref: "", tone: "primary" },
};

export const stepsSchema = z.object({
  title: z.string().trim().max(160),
  subtitle: z.string().trim().max(300),
  items: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(80),
        description: z.string().trim().max(300),
        icon: blockIconSchema,
      })
    )
    .max(6),
});
export type StepsProps = z.infer<typeof stepsSchema>;

export const stepsBlock: BlockSpec<StepsProps> = {
  type: "steps",
  label: "Como funciona",
  description: "O passo a passo do pedido até a entrega.",
  variants: [
    { key: "numbered", label: "Passos numerados", description: "1, 2, 3 lado a lado." },
    { key: "timeline", label: "Linha do tempo", description: "Um embaixo do outro, ligados por uma linha." },
  ],
  schema: stepsSchema,
  defaults: {
    title: "Como funciona",
    subtitle: "",
    items: [
      { title: "Você escolhe", description: "Monta o pedido pelo site.", icon: "Gift" },
      { title: "A gente prepara", description: "Tudo é montado no dia da entrega.", icon: "PackageCheck" },
      { title: "Chega na data", description: "Você escolhe o dia e o horário.", icon: "Truck" },
    ],
  },
};

/**
 * RECEBER NOVIDADES — atenção ao que este bloco NÃO faz.
 *
 * Ele não tem campo de e-mail. E-mail digitado precisa de tabela de inscritos,
 * consentimento registrado (LGPD), confirmação e envio — nada disso existe
 * neste projeto hoje. Um campo bonito que joga o e-mail no lixo é pior que não
 * ter campo: o cliente acha que se inscreveu e a lojista acha que tem lista.
 *
 * Enquanto isso não existir, o botão leva para o WhatsApp da loja — canal que
 * funciona de verdade hoje. Para virar newsletter de verdade falta: tabela
 * `newsletter_subscribers` (por loja, com a data do consentimento), server
 * action de inscrição e o envio (o Resend já é dependência do projeto).
 */
export const newsletterSchema = z.object({
  title: z.string().trim().max(160),
  body: z.string().trim().max(400),
  buttonLabel: z.string().trim().max(40),
});
export type NewsletterProps = z.infer<typeof newsletterSchema>;

export const newsletterBlock: BlockSpec<NewsletterProps> = {
  type: "newsletter",
  label: "Receber novidades",
  description: "Convite para o cliente acompanhar os lançamentos da loja.",
  variants: [
    { key: "inline", label: "Faixa fina", description: "Uma linha discreta no fim da página." },
    { key: "boxed", label: "Cartão", description: "Um cartão com destaque." },
  ],
  schema: newsletterSchema,
  defaults: {
    title: "Quer saber das novidades?",
    body: "Chame a gente e avisamos quando sair coisa nova.",
    buttonLabel: "Quero ser avisado",
  },
};

/* ──────────────────────────────── o catálogo ────────────────────────────── */

const LISTA: readonly BlockSpec<never>[] = [
  heroBlock,
  categoryGridBlock,
  productGridBlock,
  signatureBlock,
  collectionSpotlightBlock,
  benefitsBlock,
  faqBlock,
  ctaWhatsappBlock,
  richTextBlock,
  testimonialsBlock,
  galleryBlock,
  promoBarBlock,
  stepsBlock,
  newsletterBlock,
] as unknown as readonly BlockSpec<never>[];

/** Todos os blocos, na ordem em que aparecem no painel. */
export const BLOCK_SPECS: readonly BlockSpec<never>[] = LISTA;

export const BLOCK_SPEC_BY_TYPE: ReadonlyMap<string, BlockSpec<never>> = new Map(
  BLOCK_SPECS.map((b) => [b.type, b])
);

export function getBlockSpec(type: string): BlockSpec<never> | null {
  return BLOCK_SPEC_BY_TYPE.get(type) ?? null;
}

export function blockLabel(type: string): string {
  return BLOCK_SPEC_BY_TYPE.get(type)?.label ?? type;
}

export function variantLabel(type: string, variant: string): string {
  const spec = BLOCK_SPEC_BY_TYPE.get(type);
  return spec?.variants.find((v) => v.key === variant)?.label ?? variant;
}

/** Uma seção montada dentro de uma página. */
export type Section = {
  /** Identificador estável da seção dentro da página (usado como `key` do React). */
  id: string;
  type: string;
  variant: string;
  props: Record<string, unknown>;
};

/**
 * Valida uma seção contra o catálogo. Nunca lança: seção de tipo desconhecido
 * vira `null` (o renderizador pula) e props fora do formato caem no padrão do
 * bloco. Página de loja no ar não pode quebrar por causa de um campo salvo
 * errado — é a mesma decisão que o `getContent()` já toma no CMS.
 */
export function normalizeSection(section: Section): Section | null {
  const spec = BLOCK_SPEC_BY_TYPE.get(section.type);
  if (!spec) return null;

  const variant = spec.variants.some((v) => v.key === section.variant)
    ? section.variant
    : spec.variants[0].key;

  const parsed = spec.schema.safeParse(section.props);
  const props = (parsed.success ? parsed.data : spec.defaults) as Record<string, unknown>;

  return { id: section.id, type: section.type, variant, props };
}
