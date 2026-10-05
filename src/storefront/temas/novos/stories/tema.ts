import type { Tema } from "../../types";
import { S } from "../../fotos";

/**
 * STORIES — feito para o celular, no jeito de um aplicativo de fotos: círculos de histórias
 * no topo (abrem em tela cheia), feed vertical de cartões estilo post e barra de app embaixo.
 * No computador vira uma coluna estreita e calma no centro.
 */
export const TEMA: Tema = {
  key: "stories",
  name: "Stories",
  resumo: "Histórias em círculos, feed de fotos quadradas e barra de app fixa: a loja com cara de aplicativo.",
  paraQuem: "Quem vende pelo Instagram e WhatsApp e tem cliente que compra quase só pelo celular.",
  destaques: ["Círculos de histórias que abrem em tela cheia", "Feed vertical com foto quadrada e botão", "Barra de app fixa (início, cestas, carrinho)", "Folha de compra fixa na página da cesta"],
  plano: "pro",
  variacoes: [
    {
      key: "claro", name: "Claro limpo",
      paleta: { bg: "#ffffff", fg: "#121417", primary: "#cf1f56", onPrimary: "#ffffff", accent: "#f5a524", surface: "#f3f4f6", muted: "#5b6068", line: "#e2e4e8" },
      fontes: { titulo: "outfit", texto: "dm-sans" },
      demo: {
        loja: "Cesta do Dia", aviso: "Entrega com data e horário marcados",
        titulo: "Café da manhã que chega por mensagem",
        texto: "Escolha a cesta, marque o dia e a gente leva até a porta com um cartão escrito por você.",
        heroImagem: "slug:" + S.afeto,
        cestas: [S.afeto, S.essencia, S.aconchego, S.encanto, S.porDoSol, S.memoravel, S.premium, S.lady],
        categorias: ["Café da manhã", "Aniversário", "Namorados", "Kits", "Presentes"],
      },
    },
    {
      key: "neon", name: "Escuro neon",
      paleta: { bg: "#0b0b12", fg: "#f2f2f7", primary: "#3dff8f", onPrimary: "#04130a", accent: "#ff4de3", surface: "#16161f", muted: "#a9a9bd", line: "#2c2c3c" },
      fontes: { titulo: "outfit", texto: "dm-sans" },
      demo: {
        loja: "Neon Mimos", aviso: "Pedidos até as 14h chegam no mesmo dia",
        titulo: "Presente com cara de festa",
        texto: "Balões, doces e uma mensagem que você escolhe. Tudo montado e entregue na hora combinada.",
        heroImagem: "slug:" + S.baloes,
        cestas: [S.baloes, S.pink, S.blue, S.ferrero, S.miniBolo, S.coracao, S.caneca, S.afeto],
        categorias: ["Festa", "Balões", "Doces", "Bolos", "Mensagens"],
      },
    },
    {
      key: "pastel", name: "Pastel",
      paleta: { bg: "#fff5f8", fg: "#35203d", primary: "#7a4fc2", onPrimary: "#ffffff", accent: "#ffb36b", surface: "#ffe6ef", muted: "#6d5877", line: "#f4cfdd" },
      fontes: { titulo: "outfit", texto: "dm-sans" },
      demo: {
        loja: "Mimo Pastel", aviso: "Cartão de mensagem incluso em todo pedido",
        titulo: "Carinho em forma de cesta",
        texto: "Cestas e flores para mães, namoradas e amigas, entregues com todo o cuidado.",
        heroImagem: "slug:" + S.lady,
        cestas: [S.lady, S.sinha, S.flores, S.amor, S.coracao, S.orquidea, S.memoravel, S.kolanchoe],
        categorias: ["Mães", "Flores", "Namorados", "Amigas", "Lembranças"],
      },
    },
  ],
};
