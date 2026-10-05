import { S } from "../../fotos";
import type { Tema } from "../../types";

/**
 * EMPRESAS — B2B: quantidade e orçamento. Estrutura sóbria e densa (cantos retos,
 * tabelas, passos numerados), "Adicionar ao orçamento" no lugar de "comprar".
 */
export const TEMA: Tema = {
  key: "empresas",
  name: "Empresas",
  resumo: "Presentes para equipes e clientes: passo a passo, tabela de quantidades e pedido de orçamento.",
  paraQuem: "Quem vende cestas e brindes para empresas, eventos e datas corporativas.",
  destaques: [
    "\"Como funciona\" em 3 passos",
    "Tabela de quantidades (exemplo editável na loja)",
    "Pedido de orçamento com formulário",
    "Lista densa com \"a partir de\" e seletor de quantidade",
  ],
  plano: "pro",
  variacoes: [
    {
      key: "corporativo", name: "Corporativo",
      paleta: { bg: "#f3f6fb", fg: "#0f1f33", primary: "#1d4ed8", onPrimary: "#ffffff", accent: "#9ccbf3", surface: "#ffffff", muted: "#4d5f78", line: "#d3dce9" },
      fontes: { titulo: "inter-tight", texto: "dm-sans", detalhe: "archivo" },
      demo: {
        loja: "Gesto Corporativo",
        aviso: "Atendimento dedicado para empresas · entrega com data agendada",
        titulo: "Presentes para equipes e clientes, sem complicação",
        texto: "Escolha a cesta, informe a quantidade e a data. A gente monta, embala e entrega no prazo combinado.",
        heroImagem: "slug:" + S.executivo,
        cestas: [S.executivo, S.maestro, S.confraria, S.premium, S.frios, S.memoravel],
        categorias: ["Para clientes", "Para equipes", "Datas comemorativas", "Boas-vindas", "Fim de ano"],
      },
    },
    {
      key: "escritorio", name: "Escritório",
      paleta: { bg: "#f2f4f3", fg: "#1c2327", primary: "#1f6f4a", onPrimary: "#ffffff", accent: "#a9dcc0", surface: "#ffffff", muted: "#525e63", line: "#d6dcd9" },
      fontes: { titulo: "dm-sans", texto: "archivo", detalhe: "inter-tight" },
      demo: {
        loja: "Pausa de Escritório",
        aviso: "Cafés e kits para a rotina da equipe · entrega agendada",
        titulo: "Cafés e kits para o dia a dia da sua equipe",
        texto: "Do café da manhã de segunda ao kit de boas-vindas: peça em quantidade e receba no escritório.",
        heroImagem: "/images/banners/banner-mesa-manha.webp",
        cestas: [S.afeto, S.essencia, S.aconchego, S.encanto, S.frios, S.porDoSol],
        categorias: ["Café da manhã da equipe", "Boas-vindas ao time", "Aniversariantes do mês", "Kits de reunião", "Agradecimento"],
      },
    },
    {
      key: "eventos", name: "Eventos",
      paleta: { bg: "#faf4ec", fg: "#2a1418", primary: "#7a1f35", onPrimary: "#ffffff", accent: "#dcb86e", surface: "#fffdf9", muted: "#6a5055", line: "#e6d8c4" },
      fontes: { titulo: "inter-tight", texto: "archivo", detalhe: "dm-sans" },
      demo: {
        loja: "Brinde & Ocasião",
        aviso: "Lotes para eventos, formaturas e confraternizações",
        titulo: "Brindes que dão o tom do seu evento",
        texto: "Convenções, formaturas e confraternizações: cestas em lote, com cartão e entrega no horário do evento.",
        heroImagem: "slug:" + S.confraria,
        cestas: [S.confraria, S.premium, S.maestro, S.memoravel, S.ferrero, S.executivo],
        categorias: ["Confraternização", "Formatura", "Convenção", "Homenagens", "Brindes de fim de ano"],
      },
    },
  ],
};
