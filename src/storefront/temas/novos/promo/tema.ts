import { S } from "../../fotos";
import type { Tema } from "../../types";

/** PROMO — "ofertas" organizadas: faixa rolante, contador até o fim do dia, selos de desconto e grade densa. */
export const TEMA: Tema = {
  key: "promo",
  name: "Promo",
  resumo: "Ofertas organizadas: faixa rolante, contador do dia, selos de desconto e grade densa de mais vendidas.",
  paraQuem: "Lojas que vivem de datas e liquidações: Dia das Mães, Black Friday, queima de estoque.",
  destaques: [
    "Faixa de avisos rolante e contador até 23:59",
    "Selo de desconto e preço de/por bem visíveis",
    "Barra de categorias colorida com busca grande",
    "Categoria com barra lateral de faixa de preço",
  ],
  plano: "pro",
  variacoes: [
    {
      key: "liquida", name: "Liquida",
      paleta: { bg: "#fffaf0", fg: "#1c1410", primary: "#d4141c", onPrimary: "#ffffff", accent: "#ffd400", surface: "#fff0c9", muted: "#5c4d44", line: "#e3c98a" },
      fontes: { titulo: "oswald", texto: "work-sans" },
      demo: {
        loja: "Super Cestas",
        aviso: "Liquida de cestas com entrega em data e horário marcados",
        titulo: "Liquida das cestas",
        texto: "Cestas prontas com preço especial, só enquanto durar a oferta.",
        heroImagem: "/images/banners/banner-vitrine.webp",
        cestas: [S.afeto, S.essencia, S.aconchego, S.encanto, S.memoravel, S.porDoSol, S.premium, S.lady],
        categorias: ["Em promoção", "Café da manhã", "Aniversário", "Namorados", "Kits"],
      },
    },
    {
      key: "black", name: "Black",
      paleta: { bg: "#0d0d0d", fg: "#f5efe6", primary: "#ff9f1c", onPrimary: "#111111", accent: "#ffc247", surface: "#1a1a1a", muted: "#b8b0a4", line: "#3a3a3a" },
      fontes: { titulo: "archivo", texto: "inter-tight" },
      demo: {
        loja: "Black Cestas",
        aviso: "Black dos presentes: ofertas por tempo limitado",
        titulo: "Black das cestas",
        texto: "As cestas mais pedidas com preço de Black. As ofertas encerram no fim do dia.",
        heroImagem: "/images/banners/banner-cesta-completa.webp",
        cestas: [S.confraria, S.premium, S.maestro, S.executivo, S.frios, S.memoravel, S.amor, S.lady],
        categorias: ["Black", "Vinhos", "Executivo", "Presentes", "Kits"],
      },
    },
    {
      key: "dia-das-maes", name: "Dia das Mães",
      paleta: { bg: "#fff4f7", fg: "#2b1220", primary: "#c2185b", onPrimary: "#ffffff", accent: "#ffb3cb", surface: "#ffe3ec", muted: "#6e4a5a", line: "#f1bfd0" },
      fontes: { titulo: "oswald", texto: "inter-tight" },
      demo: {
        loja: "Mamãe Cestas",
        aviso: "Dia das Mães: entrega com cartão e flores",
        titulo: "Ofertas para o Dia das Mães",
        texto: "Cestas, flores e chocolates para surpreender quem cuida de você.",
        heroImagem: "/images/banners/banner-dia-das-maes.webp",
        cestas: [S.sinha, S.flores, S.lady, S.amor, S.orquidea, S.coracao, S.ferrero, S.kolanchoe],
        categorias: ["Dia das Mães", "Flores", "Chocolates", "Café da manhã", "Kits"],
      },
    },
  ],
};
