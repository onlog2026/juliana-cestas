import { S } from "../../fotos";
import type { Tema } from "../../types";

/** GALERIA — "lookbook" de luxo: foto em tela cheia, vitrine assimétrica numerada, texto fino e muito espaço. */
export const TEMA: Tema = {
  key: "galeria",
  name: "Galeria",
  resumo: "Lookbook de luxo: foto em tela cheia, vitrine assimétrica numerada e tipografia fina.",
  paraQuem: "Marcas de presentes sofisticados, com poucas peças e muito cuidado visual.",
  destaques: [
    "Abertura em tela cheia com título fino e link discreto",
    "Vitrine assimétrica com fotos de alturas diferentes e peças numeradas",
    "Cesta com tira de miniaturas e zoom suave",
    "Logo central pequeno em caixa-alta espaçada",
  ],
  plano: "pro",
  variacoes: [
    {
      key: "champagne", name: "Champagne",
      paleta: { bg: "#f4ede2", fg: "#2a2420", primary: "#2a2420", onPrimary: "#f4ede2", accent: "#7a5c30", surface: "#ebe1d1", muted: "#675c50", line: "#d3c5ae" },
      fontes: { titulo: "italiana", texto: "jost" },
      demo: {
        loja: "Atelier Lumière",
        aviso: "Entrega com data e horário marcados · cartão escrito à mão",
        titulo: "Presentes que se guardam na memória",
        texto: "Cestas montadas uma a uma, como quem prepara uma vitrine para quem ama.",
        heroImagem: "slug:" + S.premium,
        cestas: [S.premium, S.memoravel, S.essencia, S.lady, S.encanto, S.afeto],
        categorias: ["Coleção Atelier", "Café da manhã", "Aniversário", "Datas especiais"],
      },
    },
    {
      key: "verde-garrafa", name: "Verde-garrafa",
      paleta: { bg: "#f8f6f0", fg: "#17241d", primary: "#1f3d2f", onPrimary: "#f8f6f0", accent: "#6e5f2c", surface: "#eceadf", muted: "#56625a", line: "#d3d6c8" },
      fontes: { titulo: "cormorant", texto: "jost" },
      demo: {
        loja: "Maison Verde",
        aviso: "Vinhos, queijos e flores com entrega agendada",
        titulo: "A arte de presentear à mesa",
        texto: "Seleções de vinhos, queijos e flores para jantares e comemorações sem pressa.",
        heroImagem: "slug:" + S.confraria,
        cestas: [S.confraria, S.frios, S.maestro, S.executivo, S.premium, S.kolanchoe],
        categorias: ["Vinhos", "Queijos e frios", "Flores", "Presentes a dois"],
      },
    },
    {
      key: "rose-antigo", name: "Rosé antigo",
      paleta: { bg: "#f7ecea", fg: "#35201f", primary: "#7a3b44", onPrimary: "#fbf1ef", accent: "#85454f", surface: "#efdddb", muted: "#6e5253", line: "#dfc6c3" },
      fontes: { titulo: "instrument-serif", texto: "dm-sans" },
      demo: {
        loja: "Casa Rosée",
        aviso: "Flores e doces com mensagem escrita por você",
        titulo: "Gestos delicados, para quem merece",
        texto: "Flores, chocolates e cartões escritos à mão, reunidos em peças únicas.",
        heroImagem: "slug:" + S.flores,
        cestas: [S.flores, S.amor, S.orquidea, S.coracao, S.lady, S.ferrero],
        categorias: ["Flores", "Namorados", "Chocolates", "Lembranças"],
      },
    },
  ],
};
