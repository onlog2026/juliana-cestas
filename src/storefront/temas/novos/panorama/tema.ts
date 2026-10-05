import type { Tema } from "../../types";
import { S } from "../../fotos";

/**
 * PANORAMA — seções de tela inteira: metade foto, metade texto, alternando de lado.
 * Cabeçalho mínimo (nome + botão de menu), foto presa na página da cesta e revelação
 * suave ao rolar (só CSS, desligada para quem pede menos movimento).
 */
export const TEMA: Tema = {
  key: "panorama",
  name: "Panorama",
  resumo: "Cada seção ocupa a tela: foto de um lado, texto do outro, alternando. Poucas cestas, muito impacto.",
  paraQuem: "Lojas com poucas cestas e fotos fortes, que querem contar cada uma como uma história.",
  destaques: ["Seções de tela cheia com foto em metade", "Lados alternados e revelação suave ao rolar", "Foto presa enquanto o texto da cesta rola", "Cabeçalho mínimo com menu em botão"],
  plano: "pro",
  variacoes: [
    {
      key: "terra", name: "Terra",
      paleta: { bg: "#f4ebe1", fg: "#2b1d15", primary: "#8c4124", onPrimary: "#ffffff", accent: "#c98a5b", surface: "#e8d8c4", muted: "#64503f", line: "#d6bfa5" },
      fontes: { titulo: "fraunces", texto: "dm-sans" },
      demo: {
        loja: "Casa de Barro", aviso: "Feito por encomenda, com data de entrega marcada",
        titulo: "Café colonial para a mesa de domingo",
        texto: "Pães, geleias e queijos escolhidos com calma, montados à mão e entregues quando você combinar.",
        heroImagem: "/images/banners/banner-ingredientes.webp",
        cestas: [S.afeto, S.aconchego, S.porDoSol, S.essencia, S.encanto, S.memoravel],
        categorias: ["Café colonial", "Pães e geleias", "Queijos", "Presentes"],
      },
    },
    {
      key: "oceano", name: "Oceano",
      paleta: { bg: "#eef2f4", fg: "#14232e", primary: "#2f5d77", onPrimary: "#ffffff", accent: "#7da3b8", surface: "#dce5ea", muted: "#47606f", line: "#c3d2db" },
      fontes: { titulo: "dm-serif", texto: "dm-sans" },
      demo: {
        loja: "Maré Presentes", aviso: "Presentes corporativos e de família com entrega agendada",
        titulo: "Um brinde para quem merece",
        texto: "Cestas com vinhos, frios e doces finos, prontas para agradecer clientes, equipes e quem você ama.",
        heroImagem: "slug:" + S.confraria,
        cestas: [S.confraria, S.maestro, S.executivo, S.premium, S.frios, S.memoravel],
        categorias: ["Executivo", "Vinhos", "Pais", "Clientes"],
      },
    },
    {
      key: "floresta", name: "Floresta",
      paleta: { bg: "#eff1ea", fg: "#17261c", primary: "#2f5a3c", onPrimary: "#ffffff", accent: "#8aa66b", surface: "#dde4d3", muted: "#4a5d4e", line: "#c4cdb7" },
      fontes: { titulo: "fraunces", texto: "dm-sans" },
      demo: {
        loja: "Raiz & Flor", aviso: "Flores frescas, entrega no dia e horário que você escolher",
        titulo: "Flores que contam o que você sente",
        texto: "Arranjos, orquídeas e cestas montados no dia, com um cartão escrito do seu jeito.",
        heroImagem: "slug:" + S.flores,
        cestas: [S.flores, S.orquidea, S.kolanchoe, S.lady, S.amor, S.sinha],
        categorias: ["Arranjos", "Orquídeas", "Cestas com flores", "Datas especiais"],
      },
    },
  ],
};
