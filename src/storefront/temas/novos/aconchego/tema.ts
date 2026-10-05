import { S } from "../../fotos";
import type { Tema } from "../../types";

/**
 * ACONCHEGO — suave e orgânico: formas irregulares (blobs), ilustrações de linha,
 * tipografia arredondada e cartões "nuvem" com sombra difusa. Textos curtos e carinhosos.
 */
export const TEMA: Tema = {
  key: "aconchego",
  name: "Aconchego",
  resumo: "Tons suaves, formas orgânicas e ilustrações de linha. Uma loja que parece um abraço.",
  paraQuem: "Cestas de café da manhã, mimos, flores e presentes afetuosos para quem ama.",
  destaques: [
    "Fotos em formas orgânicas sobre manchas suaves",
    "Ilustrações de linha (folha, xícara, laço, coração)",
    "Cartões \"nuvem\" com sombra difusa",
    "Filtros em pílulas e mensagem de carinho em cada cesta",
  ],
  plano: "pro",
  variacoes: [
    {
      key: "pessego", name: "Pêssego",
      paleta: { bg: "#fff4ec", fg: "#3d2a24", primary: "#a8482a", onPrimary: "#ffffff", accent: "#f4bfa4", surface: "#fffaf6", muted: "#7a5446", line: "#efd2c0" },
      fontes: { titulo: "fraunces", texto: "nunito" },
      demo: {
        loja: "Casa de Pêssego",
        aviso: "Entrega com data e horário marcados · cartão escrito à mão",
        titulo: "Um abraço em forma de cesta",
        texto: "Cestas macias e cheirosas, montadas com calma para quem merece um carinho hoje.",
        heroImagem: "slug:" + S.afeto,
        cestas: [S.afeto, S.aconchego, S.essencia, S.encanto, S.memoravel, S.porDoSol, S.lady, S.sinha],
        categorias: ["Café da manhã", "Para agradecer", "Dia das Mães", "Aniversário", "Só porque sim"],
      },
    },
    {
      key: "menta", name: "Menta",
      paleta: { bg: "#eef8f2", fg: "#1f3a31", primary: "#2a7258", onPrimary: "#ffffff", accent: "#a6dcc4", surface: "#f8fdfa", muted: "#4a6a5d", line: "#cde5d9" },
      fontes: { titulo: "quicksand", texto: "nunito" },
      demo: {
        loja: "Folha de Hortelã",
        aviso: "Cestas leves e frescas · entrega com data marcada",
        titulo: "Respire fundo, a cesta chegou",
        texto: "Chás, flores e quitutes leves para transformar uma tarde comum num pedacinho de calma.",
        heroImagem: "slug:" + S.porDoSol,
        cestas: [S.porDoSol, S.essencia, S.flores, S.orquidea, S.kolanchoe, S.aconchego, S.miniBolo, S.afeto],
        categorias: ["Tarde de chá", "Plantas e flores", "Bem-estar", "Café leve", "Presente de casa"],
      },
    },
    {
      key: "lavanda", name: "Lavanda",
      paleta: { bg: "#f5f1fb", fg: "#2f2545", primary: "#6445b0", onPrimary: "#ffffff", accent: "#d3c0f2", surface: "#fcfaff", muted: "#625586", line: "#dcd0f1" },
      fontes: { titulo: "fraunces", texto: "quicksand" },
      demo: {
        loja: "Casinha Lavanda",
        aviso: "Mimos para dias de colo · cartão de mensagem incluso",
        titulo: "Pequenos mimos para dias de colo",
        texto: "Cestas delicadas para dizer o que às vezes é difícil falar: você é importante pra mim.",
        heroImagem: "slug:" + S.lady,
        cestas: [S.lady, S.orquidea, S.caneca, S.miniBolo, S.coracao, S.amor, S.encanto, S.flores],
        categorias: ["Mimos", "Namorados", "Caneca e chá", "Flores", "Cuidar de quem ama"],
      },
    },
  ],
};
