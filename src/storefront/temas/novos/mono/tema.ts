import { S } from "../../fotos";
import type { Tema } from "../../types";

/** MONO — preto e branco tipográfico: letras enormes, fotos coladas sem margem, numeração grande, cantos retos. */
export const TEMA: Tema = {
  key: "mono",
  name: "Mono",
  resumo: "Preto e branco tipográfico: letras enormes, fotos coladas, numeração grande e cantos retos.",
  paraQuem: "Marcas modernas e diretas, com poucas cestas e identidade forte.",
  destaques: [
    "Título gigante na abertura, até 12% da largura da tela",
    "Fotos coladas em grade de 1 px, sem cantos arredondados",
    "Categoria em linhas grandes com foto ao passar o mouse",
    "Cesta com informações em tabela fina",
  ],
  plano: "pro",
  variacoes: [
    {
      key: "branco", name: "Branco puro",
      paleta: { bg: "#ffffff", fg: "#0a0a0a", primary: "#0a0a0a", onPrimary: "#ffffff", accent: "#c8271b", surface: "#f2f2f2", muted: "#595959", line: "#0a0a0a" },
      fontes: { titulo: "space-grotesk", texto: "archivo" },
      demo: {
        loja: "Estúdio Branco",
        aviso: "Entrega com data e horário marcados",
        titulo: "Cestas sem enfeite",
        texto: "Poucas coisas, bem escolhidas. Montadas à mão e entregues no dia marcado.",
        heroImagem: "slug:" + S.essencia,
        cestas: [S.essencia, S.afeto, S.aconchego, S.encanto, S.memoravel, S.premium, S.porDoSol, S.lady],
        categorias: ["Café da manhã", "Aniversário", "Presentes", "Kits"],
      },
    },
    {
      key: "preto", name: "Preto puro",
      paleta: { bg: "#0a0a0a", fg: "#f5f5f5", primary: "#f5f5f5", onPrimary: "#0a0a0a", accent: "#ff6a45", surface: "#161616", muted: "#a3a3a3", line: "#f5f5f5" },
      fontes: { titulo: "syne", texto: "space-grotesk" },
      demo: {
        loja: "Noturno",
        aviso: "Vinhos, frios e kits com entrega agendada",
        titulo: "Presente à altura",
        texto: "Seleções escuras e diretas, para quem prefere dizer pouco.",
        heroImagem: "slug:" + S.confraria,
        cestas: [S.confraria, S.premium, S.maestro, S.frios, S.executivo, S.memoravel, S.amor, S.lady],
        categorias: ["Vinhos", "Executivo", "Datas", "Kits"],
      },
    },
    {
      key: "concreto", name: "Concreto",
      paleta: { bg: "#d9d9d6", fg: "#141414", primary: "#141414", onPrimary: "#d9d9d6", accent: "#962008", surface: "#c8c8c4", muted: "#404040", line: "#141414" },
      fontes: { titulo: "archivo", texto: "space-grotesk" },
      demo: {
        loja: "Cimento e Flor",
        aviso: "Flores e cestas montadas à mão",
        titulo: "Flor sobre concreto",
        texto: "Arranjos e cestas de linhas simples, com um toque de cor.",
        heroImagem: "slug:" + S.flores,
        cestas: [S.flores, S.orquidea, S.kolanchoe, S.lady, S.amor, S.coracao, S.sinha, S.ferrero],
        categorias: ["Flores", "Orquídeas", "Namorados", "Presentes"],
      },
    },
  ],
};
