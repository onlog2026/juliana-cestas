/**
 * MODELO "CATÁLOGO" — a loja com muito produto.
 *
 * Aqui a pergunta do visitante não é "quem faz isso?", é "vocês têm o que eu
 * quero, e chega quando?". A página inteira é montada para responder isso em
 * dois toques:
 *   - faixa de aviso no topo (prazo, frete, promoção) antes de qualquer coisa;
 *   - categorias em pílulas que acompanham a rolagem, para trocar de grupo sem
 *     voltar ao topo;
 *   - grade densa, com filtro por categoria, e nada de foto gigante entre uma
 *     linha e outra de produto;
 *   - marcas parceiras, benefícios em faixa fina e perguntas no fim.
 *
 * Não tem carrossel, não tem manifesto, não tem cartãozinho, não tem seleção
 * por faixa de preço. É outro site, não outra cor.
 *
 * ATENÇÃO às pílulas fixas: elas são `position: sticky` com fundo SÓLIDO.
 * Nada de `filter: blur()` em elemento fixo — essa combinação já travou a
 * rolagem no celular neste tipo de projeto e é regra da casa não repetir.
 */
import type { TemplateDefinition } from "@/storefront/templates/types";

export const catalogo: TemplateDefinition = {
  key: "catalogo",
  name: "Catálogo",
  description:
    "Para quem tem muito produto: aviso no topo, categorias sempre à mão, grade densa com filtro e marcas parceiras.",
  indicadoPara:
    "Loja com dezenas ou centenas de itens, onde o cliente já sabe o que quer e precisa achar rápido.",

  // Mesmos nomes de variável, valores próprios: fundo claro e neutro para a
  // foto do produto mandar, primária mais escura para contraste em texto
  // pequeno, cantos menos arredondados (grade densa fica mais limpa assim).
  theme: {
    background: "#ffffff",
    foreground: "#161a19",
    card: "#ffffff",
    "card-foreground": "#161a19",
    popover: "#ffffff",
    "popover-foreground": "#161a19",
    primary: "#2f5d43",
    "primary-foreground": "#ffffff",
    secondary: "#f2f4f2",
    "secondary-foreground": "#161a19",
    muted: "#f2f4f2",
    "muted-foreground": "#5a6360",
    accent: "#e4efe8",
    "accent-foreground": "#2f5d43",
    destructive: "#c0392b",
    border: "rgba(22, 26, 25, 0.12)",
    input: "rgba(22, 26, 25, 0.12)",
    ring: "#2f5d43",
    radius: "0.5rem",
    "jc-radius-card": "0.5rem",
    "jc-gold": "#c9922e",
    "jc-whatsapp": "#25d366",
    "jc-success": "#2f7d5b",
    "jc-shadow": "0 6px 18px rgba(22, 26, 25, 0.06)",
    "jc-paper": "#f7f8f7",
  },

  fonts: { sans: "poppins", display: "poppins" },

  layout: {
    header: { variant: "search-first", sticky: true, showSearch: true, showCategories: true },
    footer: { variant: "compact", columns: 2, showSocial: false },
    productPage: { variant: "compact-list", showUpsells: true, showRelated: true, stickyBuyBar: true },
  },

  pages: {
    "/": {
      title: "Início",
      sections: [
        {
          id: "aviso",
          type: "promo-bar",
          variant: "bar",
          props: {
            text: "Entrega agendada em toda a cidade. Peça até as 16h para receber amanhã.",
            linkLabel: "Ver prazos",
            linkHref: "/faq",
            tone: "primary",
          },
        },
        {
          id: "categorias",
          type: "category-grid",
          variant: "pills",
          props: { titleOverride: "", sticky: true },
        },
        {
          id: "catalogo",
          type: "product-grid",
          variant: "dense",
          props: {
            title: "Todos os produtos",
            subtitle: "",
            limit: 0,
            showFilters: true,
          },
        },
        {
          id: "marcas",
          type: "gallery",
          variant: "logos",
          props: { title: "Marcas que trabalhamos", items: [] },
        },
        {
          id: "beneficios",
          type: "benefits",
          variant: "compact",
          props: {},
        },
        {
          id: "perguntas",
          type: "faq",
          variant: "accordion",
          props: {},
        },
        {
          id: "novidades",
          type: "newsletter",
          variant: "inline",
          props: {
            title: "Quer saber das novidades?",
            body: "Chame a gente e avisamos quando entrar produto novo.",
            buttonLabel: "Quero ser avisado",
          },
        },
      ],
    },
  },
};
