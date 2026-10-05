import { S } from "../../fotos";
import type { Tema } from "../../types";

/** REVISTA — editorial com matérias: manchete, coluna de dicas, destaques da edição e cesta em formato de artigo. */
export const TEMA: Tema = {
  key: "revista",
  name: "Revista",
  resumo: "Layout de jornal e revista: manchete, matérias curtas e cestas como destaques da edição.",
  paraQuem: "Marcas que gostam de contar histórias e vender com curadoria e bom texto.",
  destaques: [
    "Manchete grande com coluna de matérias",
    "Cestas como destaques da edição, com filetes",
    "Lista editorial na categoria",
    "Cesta em formato de artigo, com capitular",
  ],
  plano: "pro",
  variacoes: [
    {
      key: "papel-jornal", name: "Papel jornal",
      paleta: { bg: "#f3ecdc", fg: "#1c1a16", primary: "#1c1a16", onPrimary: "#f3ecdc", accent: "#9b2c1d", surface: "#ebe2cc", muted: "#595247", line: "#cdbf9f" },
      fontes: { titulo: "dm-serif", texto: "lora", detalhe: "inter-tight" },
      demo: {
        loja: "Gazeta da Cesta",
        aviso: "Edição desta semana: cestas montadas com data e horário de entrega marcados",
        titulo: "O café da manhã virou notícia",
        texto: "Uma seleção de cestas para começar o dia com calma, em boa companhia.",
        heroImagem: "/images/banners/banner-lifestyle.webp",
        cestas: [S.afeto, S.essencia, S.aconchego, S.encanto, S.porDoSol, S.memoravel, S.lady, S.premium],
        categorias: ["Café da manhã", "Aniversário", "Mães", "Namorados", "Kits"],
      },
    },
    {
      key: "revista-de-moda", name: "Revista de moda",
      paleta: { bg: "#ffffff", fg: "#111111", primary: "#d4001a", onPrimary: "#ffffff", accent: "#b0001a", surface: "#f4f1ee", muted: "#5f5a57", line: "#dcd6d1" },
      fontes: { titulo: "fraunces", texto: "dm-sans" },
      demo: {
        loja: "Maison Presente",
        aviso: "Nova edição: flores, chocolates e cestas para presentear com estilo",
        titulo: "Presentear também é questão de estilo",
        texto: "Flores, chocolates e cestas escolhidos como em uma boa editorial de moda.",
        heroImagem: "slug:" + S.lady,
        cestas: [S.lady, S.flores, S.amor, S.sinha, S.orquidea, S.premium, S.coracao, S.ferrero],
        categorias: ["Flores", "Românticas", "Mães", "Chocolates", "Presentes"],
      },
    },
    {
      key: "gastronomia", name: "Gastronomia",
      paleta: { bg: "#f1f3e4", fg: "#232a14", primary: "#4d5b1f", onPrimary: "#ffffff", accent: "#a8461a", surface: "#e4e8cc", muted: "#555d3c", line: "#cdd3a8" },
      fontes: { titulo: "lora", texto: "dm-sans", detalhe: "fraunces" },
      demo: {
        loja: "Mesa & Sabor",
        aviso: "Seleções gourmet: queijos, frios, vinhos e doces com entrega agendada",
        titulo: "Uma tábua para dividir e uma boa conversa",
        texto: "Queijos, frios e vinhos escolhidos para quem gosta de receber bem.",
        heroImagem: "slug:" + S.premium,
        cestas: [S.premium, S.frios, S.confraria, S.memoravel, S.essencia, S.maestro, S.executivo, S.afeto],
        categorias: ["Queijos e frios", "Vinhos", "Café", "Doces", "Kits"],
      },
    },
  ],
};
