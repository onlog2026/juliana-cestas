import type { Tema } from "../../types";
import { S } from "../../fotos";

/**
 * SIMETRIA — tudo no eixo central: logo ao centro com o menu repartido nos dois lados,
 * fotos em arco espelhadas, coleções em blocos 2×2 com legenda centralizada sobre cor,
 * títulos entre dois fios e rodapé em três colunas espelhadas.
 */
export const TEMA: Tema = {
  key: "simetria",
  name: "Simetria",
  resumo: "Logo ao centro, blocos de cor em 2×2 e destaques em três colunas iguais. Ordem e equilíbrio.",
  paraQuem: "Lojas elegantes que querem uma vitrine arrumada, previsível e fácil de percorrer.",
  destaques: ["Logo central com o menu dividido nos dois lados", "Fotos em arco espelhadas na abertura", "Coleções em blocos 2×2 com legenda sobre cor", "Rodapé em três colunas espelhadas"],
  plano: "pro",
  variacoes: [
    {
      key: "salvia", name: "Sálvia",
      paleta: { bg: "#f3f5ef", fg: "#1f2a22", primary: "#4f6f52", onPrimary: "#ffffff", accent: "#b9c7a8", surface: "#e3e9d9", muted: "#52625a", line: "#ccd6c0" },
      fontes: { titulo: "playfair", texto: "figtree" },
      demo: {
        loja: "Sálvia & Mel", aviso: "Entrega com data e horário marcados",
        titulo: "Presentes com equilíbrio e carinho",
        texto: "Cestas de café da manhã, flores e doces montadas com calma, uma a uma, para quem você quer cuidar.",
        heroImagem: "slug:" + S.essencia,
        cestas: [S.essencia, S.afeto, S.aconchego, S.encanto, S.porDoSol, S.memoravel],
        categorias: ["Café da manhã", "Aniversário", "Flores", "Agradecimento", "Presentes"],
      },
    },
    {
      key: "marinho", name: "Azul-marinho",
      paleta: { bg: "#f4f6fa", fg: "#0f1c33", primary: "#14284b", onPrimary: "#ffffff", accent: "#c9a24a", surface: "#e2e8f2", muted: "#4a5871", line: "#c8d1e0" },
      fontes: { titulo: "bodoni", texto: "jost" },
      demo: {
        loja: "Casa Marinho", aviso: "Pedidos para empresas com nota fiscal",
        titulo: "Presentear bem é uma arte",
        texto: "Seleções de vinhos, frios e doces finos para clientes, equipes e datas que pedem um gesto à altura.",
        heroImagem: "slug:" + S.confraria,
        cestas: [S.confraria, S.executivo, S.maestro, S.premium, S.frios, S.memoravel],
        categorias: ["Clientes", "Equipe", "Vinhos", "Fim de ano"],
      },
    },
    {
      key: "blush", name: "Blush",
      paleta: { bg: "#fdf5f3", fg: "#3a2226", primary: "#964450", onPrimary: "#ffffff", accent: "#e9c2bf", surface: "#f6e0dc", muted: "#764f55", line: "#ecccc7" },
      fontes: { titulo: "playfair", texto: "jost" },
      demo: {
        loja: "Blush Ateliê", aviso: "Cartão escrito à mão em todo pedido",
        titulo: "Delicadeza para dizer o que importa",
        texto: "Flores, chocolates e cestas românticas para namorados, mães e momentos que merecem ser lembrados.",
        heroImagem: "slug:" + S.amor,
        cestas: [S.amor, S.lady, S.flores, S.sinha, S.coracao, S.ferrero],
        categorias: ["Namorados", "Mães", "Flores", "Chocolates", "Lembranças"],
      },
    },
  ],
};
