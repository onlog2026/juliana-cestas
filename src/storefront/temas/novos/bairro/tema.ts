import { S } from "../../fotos";
import type { Tema } from "../../types";

/** BAIRRO — loja local: entrega por região, "pediu até 14h, chega hoje", horários e WhatsApp em destaque. */
export const TEMA: Tema = {
  key: "bairro",
  name: "Bairro",
  resumo: "Loja de vizinhança: regiões atendidas, horários de entrega e WhatsApp sempre à mão.",
  paraQuem: "Floriculturas, padarias e cestarias que entregam só na própria região.",
  destaques: [
    "Faixa com as regiões atendidas",
    "Bloco \"Pediu até 14h, chega hoje\"",
    "Tabela de horários de entrega",
    "Botão de WhatsApp em destaque",
  ],
  plano: "pro",
  variacoes: [
    {
      key: "verde-whatsapp", name: "Verde WhatsApp",
      paleta: { bg: "#f3faf5", fg: "#10261a", primary: "#0b7a43", onPrimary: "#ffffff", accent: "#25d366", surface: "#ffffff", muted: "#456052", line: "#cde3d3" },
      fontes: { titulo: "rubik", texto: "work-sans" },
      demo: {
        loja: "Cantinho Verde",
        aviso: "Entregamos nos bairros da região, com data e horário marcados",
        titulo: "Flores e cestas entregues no seu bairro",
        texto: "Peça pela manhã e receba em casa no mesmo dia, com cartão escrito do seu jeito.",
        heroImagem: "slug:" + S.flores,
        cestas: [S.flores, S.orquidea, S.kolanchoe, S.lady, S.amor, S.sinha, S.afeto, S.aconchego],
        categorias: ["Flores", "Orquídeas", "Cestas", "Presentes", "Mães", "Opcionais"],
      },
    },
    {
      key: "azul-bairro", name: "Azul bairro",
      paleta: { bg: "#f2f6fc", fg: "#0f2238", primary: "#1d4ed8", onPrimary: "#ffffff", accent: "#f59e0b", surface: "#ffffff", muted: "#4a5f7a", line: "#cfdcee" },
      fontes: { titulo: "rubik", texto: "work-sans" },
      demo: {
        loja: "Cesta da Vila",
        aviso: "Aniversários e surpresas entregues na sua rua",
        titulo: "A surpresa chega antes do parabéns",
        texto: "Balões, doces e cestas de aniversário com entrega agendada na vizinhança.",
        heroImagem: "slug:" + S.baloes,
        cestas: [S.baloes, S.blue, S.miniBolo, S.ferrero, S.caneca, S.pink, S.coracao, S.afeto],
        categorias: ["Aniversário", "Balões", "Doces", "Crianças", "Mensagens"],
      },
    },
    {
      key: "laranja-padaria", name: "Laranja padaria",
      paleta: { bg: "#fff6ea", fg: "#3a1d0a", primary: "#b84a00", onPrimary: "#ffffff", accent: "#f5a524", surface: "#fffdf8", muted: "#6b4a33", line: "#f0d9b8" },
      fontes: { titulo: "rubik", texto: "work-sans" },
      demo: {
        loja: "Forno da Esquina",
        aviso: "Café da manhã fresquinho entregue até às 10h",
        titulo: "Café da manhã quentinho, da nossa esquina para a sua mesa",
        texto: "Pães, bolos e frios montados no dia e entregues no bairro.",
        heroImagem: "/images/banners/banner-mesa-manha.webp",
        cestas: [S.porDoSol, S.aconchego, S.essencia, S.afeto, S.encanto, S.memoravel, S.frios, S.miniBolo],
        categorias: ["Café da manhã", "Pães e bolos", "Frios", "Kits", "Opcionais"],
      },
    },
  ],
};
