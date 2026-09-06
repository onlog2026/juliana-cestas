/**
 * MODELO "CLÁSSICA" — a home da Juliana de hoje, escrita como dado.
 *
 * Este arquivo é uma CÓPIA FIEL de `src/app/(store)/page.tsx`, na ordem exata
 * em que as seções aparecem lá. Não é uma versão melhorada, não é uma
 * reinterpretação: é o mesmo site, descrito como lista de seções.
 *
 * Por que a cópia tem que ser fiel: a loja da Juliana está no ar, vendendo. O
 * dia em que alguém ligar a chave e a home passar a ser montada por aqui, o
 * resultado tem que ser IDÊNTICO ao que ela tem hoje — mesmo HTML, mesma
 * ordem, mesmas classes. Se este arquivo "melhorar" alguma coisa, a troca
 * deixa de ser reversível sem susto.
 *
 * Conferência (linha a linha de `page.tsx`, 06/09/2026):
 *   19  <BannerCarousel banners={banners} />          -> hero / carousel
 *   20-33 os dois botões "Ver cestas" e "Mais pedidas" -> hero.quickLinks
 *   34  <CategoryTiles />                             -> category-grid / tiles
 *   35  <FeaturedProducts />                          -> product-grid / featured
 *   36-38 <Reveal><CartaozinhoSection /></Reveal>     -> signature / image-text
 *   39  <Collections />                               -> collection-spotlight
 *   40  <Benefits />                                  -> benefits / icons-row
 *   41  <Faq />                                       -> faq / accordion
 *   42-44 <Reveal><WhatsappCta /></Reveal>            -> cta-whatsapp / band
 *
 * O tema é, token por token, o `:root` do `globals.css` de hoje. Materializar
 * este modelo tem que ser visualmente um NADA ACONTECEU.
 */
import type { TemplateDefinition } from "@/storefront/templates/types";

export const classica: TemplateDefinition = {
  key: "classica",
  name: "Clássica",
  description:
    "A loja como ela é hoje: banner grande, categorias com foto, produtos, cartãozinho e perguntas frequentes.",
  indicadoPara:
    "Loja artesanal, com poucos produtos e foto bonita em cada um. É o modelo da Juliana Present.",

  // Mesmos valores do :root do globals.css. Nada aqui é cor nova.
  theme: {
    background: "#f6f1e8",
    foreground: "#1f2a24",
    card: "#fffdf9",
    "card-foreground": "#1f2a24",
    popover: "#fffdf9",
    "popover-foreground": "#1f2a24",
    primary: "#556b2f",
    "primary-foreground": "#fbf6ea",
    secondary: "#efe7d9",
    "secondary-foreground": "#1f2a24",
    muted: "#efe7d9",
    "muted-foreground": "#5f6b63",
    accent: "#e6e9d8",
    "accent-foreground": "#556b2f",
    destructive: "#b23a3a",
    border: "rgba(31, 42, 36, 0.1)",
    input: "rgba(31, 42, 36, 0.1)",
    ring: "#556b2f",
    radius: "0.625rem",
    "jc-radius-card": "1rem",
    "jc-gold": "#d9a441",
    "jc-whatsapp": "#25d366",
    "jc-success": "#2f7d5b",
    "jc-shadow": "0 12px 32px rgba(31, 42, 36, 0.08)",
    "jc-paper": "#fbf6ea",
  },

  fonts: { sans: "figtree", display: "young-serif" },

  layout: {
    header: { variant: "classic", sticky: true, showSearch: true, showCategories: true },
    footer: { variant: "full", columns: 3, showSocial: true },
    productPage: { variant: "gallery-left", showUpsells: true, showRelated: true, stickyBuyBar: true },
  },

  pages: {
    "/": {
      title: "Início",
      sections: [
        {
          id: "hero",
          type: "hero",
          variant: "carousel",
          props: {
            quickLinks: [
              { label: "Ver cestas", href: "/categoria/cafe-da-manha", style: "solid" },
              { label: "Mais pedidas", href: "#mais-pedidas", style: "outline" },
            ],
            eyebrow: "",
            headline: "",
            body: "",
            imageUrl: "",
            imageAlt: "",
          },
        },
        {
          id: "categorias",
          type: "category-grid",
          variant: "tiles",
          props: { titleOverride: "", sticky: false },
        },
        {
          id: "mais-pedidas",
          type: "product-grid",
          variant: "featured",
          props: { title: "Mais pedidas", subtitle: "", limit: 0, showFilters: false },
        },
        {
          id: "cartaozinho",
          type: "signature",
          variant: "image-text",
          props: { imageOverride: "" },
        },
        {
          id: "selecao",
          type: "collection-spotlight",
          variant: "spotlight",
          props: {},
        },
        {
          id: "beneficios",
          type: "benefits",
          variant: "icons-row",
          props: {},
        },
        {
          id: "perguntas",
          type: "faq",
          variant: "accordion",
          props: {},
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
