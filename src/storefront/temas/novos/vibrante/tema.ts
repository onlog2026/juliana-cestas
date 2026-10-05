import { S } from "../../fotos";
import type { Tema } from "../../types";

/** VIBRANTE — blocos de cor chapada, tipografia gigante, faixa em movimento e fotos recortadas em formas. */
export const TEMA: Tema = {
  key: "vibrante",
  name: "Vibrante",
  resumo: "Blocos de cor chapada, letras gigantes, faixa em movimento e fotos recortadas em círculo e arco.",
  paraQuem: "Marcas jovens e coloridas que querem uma loja com muita personalidade.",
  destaques: [
    "Seções em blocos de cor de ponta a ponta",
    "Títulos gigantes e faixa de texto em movimento",
    "Cartões coloridos com foto recortada em arco",
    "Botões em pílula grossa com contorno",
  ],
  plano: "pro",
  variacoes: [
    {
      key: "tutti", name: "Tutti",
      paleta: { bg: "#fff3e2", fg: "#2b0b1f", primary: "#e0115f", onPrimary: "#ffffff", accent: "#ffa31a", surface: "#ffd9e6", muted: "#6a3a54", line: "#e8c9b8" },
      fontes: { titulo: "unbounded", texto: "dm-sans" },
      demo: {
        loja: "Tutti Cestas",
        aviso: "Entrega com data marcada e cartão escrito do seu jeito",
        titulo: "Presente com cor, barulho e festa",
        texto: "Cestas de aniversário para quem merece comemorar em grande.",
        heroImagem: "slug:" + S.pink,
        cestas: [S.pink, S.baloes, S.miniBolo, S.ferrero, S.coracao, S.caneca, S.blue, S.afeto],
        categorias: ["Aniversário", "Balões", "Doces", "Crianças", "Mensagens"],
      },
    },
    {
      key: "eletrico", name: "Elétrico",
      paleta: { bg: "#eef3ff", fg: "#07123a", primary: "#2a2cf0", onPrimary: "#ffffff", accent: "#c8ff2e", surface: "#dfe6ff", muted: "#3d4a7a", line: "#b9c6f0" },
      fontes: { titulo: "bricolage", texto: "inter-tight" },
      demo: {
        loja: "Pulso Cestas",
        aviso: "Presentes com energia: entrega agendada em poucos cliques",
        titulo: "Presentes com energia de sobra",
        texto: "Cestas modernas para quem não gosta do óbvio.",
        heroImagem: "/images/banners/banner-vitrine.webp",
        cestas: [S.blue, S.baloes, S.caneca, S.executivo, S.ferrero, S.miniBolo, S.coracao, S.essencia],
        categorias: ["Para ele", "Para ela", "Amigos", "Escritório", "Surpresas"],
      },
    },
    {
      key: "sol", name: "Sol",
      paleta: { bg: "#fffbe6", fg: "#2a0f3d", primary: "#4a1a6b", onPrimary: "#ffffff", accent: "#ffc01e", surface: "#ffe9a0", muted: "#5a4570", line: "#ecd98a" },
      fontes: { titulo: "abril", texto: "work-sans" },
      demo: {
        loja: "Girassol Cestas",
        aviso: "Dias de sol: café da manhã e flores com entrega marcada",
        titulo: "Um raio de sol na porta de casa",
        texto: "Cestas de café da manhã e flores para alegrar o dia de quem você ama.",
        heroImagem: "slug:" + S.porDoSol,
        cestas: [S.porDoSol, S.kolanchoe, S.flores, S.aconchego, S.essencia, S.afeto, S.encanto, S.orquidea],
        categorias: ["Café da manhã", "Flores", "Manhãs", "Mães", "Kits"],
      },
    },
  ],
};
