import type { StoreContent } from "@/modules/content/types";

/**
 * Conteúdo padrão de uma loja NOVA -- neutro de propósito, sem marca, cidade
 * ou telefone de ninguém. É o que aparece antes do dono editar qualquer coisa.
 *
 * A loja da Juliana NÃO usa isto: o texto atual dela está gravado em
 * `site_content` pelo seed da migration 0022, então a tela dela continua
 * exatamente igual.
 */
export const STORE_DEFAULTS: StoreContent = {
  benefits: {
    items: [
      { title: "Feito à mão", description: "Cada pedido é preparado sob encomenda.", icon: "PenLine" },
      { title: "Pagamento seguro", description: "Pix ou cartão, por link de pagamento.", icon: "ShieldCheck" },
      { title: "Entrega agendada", description: "Você escolhe o dia e a hora.", icon: "Truck" },
      { title: "Atendimento direto", description: "Fale com a gente pelo WhatsApp.", icon: "Headset" },
    ],
  },
  faq: {
    title: "Perguntas frequentes",
    items: [
      {
        question: "Como faço um pedido?",
        answer: "Escolha o produto, preencha os dados de entrega e finalize pelo site.",
      },
      {
        question: "Quais as formas de pagamento?",
        answer: "Pix ou cartão de crédito. O pedido é confirmado após o pagamento.",
      },
      {
        question: "Como funcionam as entregas?",
        answer: "As entregas são agendadas. Você escolhe a data e o horário no checkout.",
      },
    ],
  },
  signature: {
    eyebrow: "Um detalhe que faz diferença",
    title: "Acompanha um cartão com a sua mensagem",
    body: "Escreva o que quiser dizer e a gente entrega junto com o pedido.",
    imageUrl: "",
  },
  whatsapp_cta: {
    title: "Ficou com dúvida?",
    body: "Chama a gente no WhatsApp que a gente te ajuda a escolher.",
    buttonLabel: "Falar no WhatsApp",
  },
  collections: {
    title: "Seleção especial",
    subtitle: undefined,
    maxPriceCents: undefined,
    highlightProductSlug: undefined,
  },
  category_tiles: {
    title: "Nossos produtos",
  },
  business: {
    description: "",
    priceRange: "",
    streetAddress: "",
    addressLocality: "",
    addressRegion: "",
    areaServed: "",
    opensAt: "08:00",
    closesAt: "18:00",
    openDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  },
  about: {
    title: "Sobre a loja",
    blocks: [{ text: "Conte aqui a história da sua loja. Este texto é editável no painel, em CMS." }],
  },
  returns: {
    title: "Trocas e devoluções",
    blocks: [
      { text: "Descreva aqui a sua política de trocas e devoluções. Este texto é editável no painel, em CMS." },
    ],
  },
};
