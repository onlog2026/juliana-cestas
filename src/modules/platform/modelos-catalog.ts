import { TEMPLATES } from "@/storefront/templates";

/** O que a vitrine de modelos mostra de cada modelo (textos de venda + capturas reais). */
export type ModeloVitrine = {
  key: "classica" | "editorial" | "catalogo";
  name: string;
  plano: string;
  resumo: string;
  paraQuem: string;
  destaques: string[];
  ficha: Array<[string, string]>;
  telas: Array<{ rotulo: string; desktop: string; celular: string }>;
};

const tela = (k: string, a: string, b: string) => [
  { rotulo: a, desktop: `/modelos/${k}-d1.webp`, celular: `/modelos/${k}-m1.webp` },
  { rotulo: b, desktop: `/modelos/${k}-d2.webp`, celular: `/modelos/${k}-m2.webp` },
];

export const MODELOS: ModeloVitrine[] = [
  {
    key: "classica",
    name: "Clássica",
    plano: "Incluso em todos os planos",
    resumo:
      "Banner grande com texto, atalhos redondos das categorias e uma grade de cestas com moldura e preço logo abaixo.",
    paraQuem: "Quem tem várias cestas e quer a vitrine que já vende todos os dias.",
    destaques: [
      "Banner com carrossel e texto por cima",
      "Atalhos das categorias em círculos",
      "Selos de promoção e desconto automático",
      "Vitrines de mais vendidos",
    ],
    ficha: [
      ["Celular", "Menu inferior com WhatsApp"],
      ["Cabeçalho", "Menu e busca"],
      ["Página da cesta", "Galeria à esquerda"],
      ["Ideal para", "Muitas cestas"],
    ],
    telas: tela("classica", "Início", "Cestas"),
  },
  {
    key: "editorial",
    name: "Editorial",
    plano: "Plano Pro ou superior",
    resumo:
      "Conta a história antes de mostrar o preço: foto grande ao lado de um manifesto, cestas em destaque e depoimentos.",
    paraQuem: "Marca com história para contar e poucas cestas mais caras.",
    destaques: [
      "Abertura dividida: foto e texto",
      "Cesta em destaque maior que as outras",
      "Depoimentos com foto da entrega",
      "Galeria de bastidores",
    ],
    ficha: [
      ["Celular", "Foto e texto empilhados"],
      ["Cabeçalho", "Centralizado"],
      ["Página da cesta", "Galeria em tela cheia"],
      ["Ideal para", "Poucas cestas premium"],
    ],
    telas: tela("editorial", "Início", "Cestas"),
  },
  {
    key: "catalogo",
    name: "Catálogo",
    plano: "Plano Pro ou superior",
    resumo:
      "Busca em destaque, faixa de aviso e grade compacta com filtros por categoria. Pensado para muita variedade.",
    paraQuem: "Quem tem muitas opções e o cliente quer achar rápido.",
    destaques: [
      "Busca sempre à vista",
      "Faixa de aviso para prazos e promoções",
      "Filtros por categoria",
      "Grade compacta com 5 cestas por linha",
    ],
    ficha: [
      ["Celular", "Grade de 2 colunas"],
      ["Cabeçalho", "Busca em destaque"],
      ["Página da cesta", "Lista compacta"],
      ["Ideal para", "Muita variedade"],
    ],
    telas: tela("catalogo", "Início", "Todos os produtos"),
  },
];

export function getModelo(key: string): ModeloVitrine | undefined {
  return MODELOS.find((m) => m.key === key && TEMPLATES.some((t) => t.key === key));
}
