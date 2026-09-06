/**
 * MODELO "EDITORIAL" — a loja que se vende pela história.
 *
 * Estruturalmente diferente da Clássica, não "a Clássica em outra cor":
 *   - o topo não é carrossel: é meia tela de foto e meia tela de manifesto;
 *   - os produtos não entram numa grade regular: entram em destaque desigual;
 *   - existem seções que a Clássica não tem (história, depoimentos, galeria,
 *     como funciona) e não existem seções que a Clássica tem (categorias com
 *     foto, seleção por faixa de preço, perguntas frequentes na home);
 *   - o cabeçalho é centralizado, o rodapé é editorial (uma coluna, texto).
 *
 * Trocar as cores da Clássica JAMAIS produz esta página — é esse o teste.
 */
import type { TemplateDefinition } from "@/storefront/templates/types";

export const editorial: TemplateDefinition = {
  key: "editorial",
  name: "Editorial",
  description:
    "Uma página que conta a história antes de mostrar o preço: foto grande, manifesto, depoimentos e bastidores.",
  indicadoPara:
    "Marca com história para contar e poucos produtos caros. Quem vende pelo cuidado, não pela variedade.",

  // Mesmos NOMES de variável do globals.css, valores próprios. Papel cru,
  // tinta escura, um dourado mais quente. Nenhuma paleta nova foi inventada:
  // é a mesma família de terra e verde da marca, com outro peso.
  theme: {
    background: "#faf7f2",
    foreground: "#20211d",
    card: "#ffffff",
    "card-foreground": "#20211d",
    popover: "#ffffff",
    "popover-foreground": "#20211d",
    primary: "#3f4a33",
    "primary-foreground": "#faf7f2",
    secondary: "#eee9e0",
    "secondary-foreground": "#20211d",
    muted: "#eee9e0",
    "muted-foreground": "#6b6a62",
    accent: "#e3e6d6",
    "accent-foreground": "#3f4a33",
    destructive: "#a33636",
    border: "rgba(32, 33, 29, 0.12)",
    input: "rgba(32, 33, 29, 0.12)",
    ring: "#3f4a33",
    radius: "0.25rem",
    "jc-radius-card": "0.25rem",
    "jc-gold": "#b98b3c",
    "jc-whatsapp": "#25d366",
    "jc-success": "#2f7d5b",
    "jc-shadow": "0 18px 44px rgba(32, 33, 29, 0.10)",
    "jc-paper": "#f4efe4",
  },

  fonts: { sans: "figtree", display: "playfair" },

  layout: {
    header: { variant: "centered", sticky: false, showSearch: false, showCategories: false },
    footer: { variant: "editorial", columns: 1, showSocial: true },
    productPage: { variant: "gallery-full", showUpsells: false, showRelated: true, stickyBuyBar: true },
  },

  pages: {
    "/": {
      title: "Início",
      sections: [
        {
          id: "abertura",
          type: "hero",
          variant: "split",
          props: {
            quickLinks: [{ label: "Ver a coleção", href: "#destaques", style: "solid" }],
            eyebrow: "Feito à mão, um de cada vez",
            headline: "Cada cesta sai daqui com nome e endereço.",
            body:
              "Nada é montado antes da hora. A gente escolhe o que entra, arruma na cesta no dia da entrega e escreve o cartão à mão.",
            imageUrl: "",
            imageAlt: "Foto da loja",
          },
        },
        {
          id: "destaques",
          type: "product-grid",
          variant: "asymmetric",
          props: {
            title: "A coleção",
            subtitle: "Poucas opções, escolhidas com cuidado.",
            limit: 7,
            showFilters: false,
          },
        },
        {
          id: "historia",
          type: "rich-text",
          variant: "manifesto",
          props: {
            eyebrow: "A nossa história",
            title: "Começou com um pedido de uma amiga.",
            body:
              "Escreva aqui como a loja nasceu, quem faz, e o que você não abre mão. É este texto que faz alguém escolher você em vez do supermercado.",
            align: "left",
          },
        },
        {
          id: "depoimentos",
          type: "testimonials",
          variant: "cards",
          props: {
            title: "Quem já pediu",
            items: [],
          },
        },
        {
          id: "bastidores",
          type: "gallery",
          variant: "masonry",
          props: { title: "Bastidores", items: [] },
        },
        {
          id: "como-funciona",
          type: "steps",
          variant: "numbered",
          props: {
            title: "Como funciona",
            subtitle: "Do pedido até a porta de quem vai receber.",
            items: [
              { title: "Você escolhe", description: "Monta o pedido pelo site.", icon: "Gift" },
              { title: "A gente prepara", description: "Tudo é montado no dia da entrega.", icon: "PackageCheck" },
              { title: "Chega na data", description: "Você escolhe o dia e o horário.", icon: "Truck" },
            ],
          },
        },
        {
          id: "cartaozinho",
          type: "signature",
          variant: "split",
          props: { imageOverride: "" },
        },
        {
          id: "whatsapp",
          type: "cta-whatsapp",
          variant: "band",
          props: {},
        },
      ],
    },
  },
};
