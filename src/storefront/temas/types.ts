import type { TemaFonte } from "./fonts";

export type TemaKey = "classica" | "boutique" | "mercado" | "festa" | "noir" | "rustico";

/** Cores de uma variação. Todas viram variáveis CSS `--t-*` no invólucro do modelo. */
export type Paleta = {
  bg: string;
  fg: string;
  primary: string;
  onPrimary: string;
  accent: string;
  surface: string;
  muted: string;
  line: string;
};

export type Variacao = {
  key: string;
  name: string;
  paleta: Paleta;
  fontes: { titulo: TemaFonte; texto: TemaFonte; detalhe?: TemaFonte };
  /** Loja de exemplo desta variação (nome fictício, textos e fotos curadas). */
  demo: {
    loja: string;
    aviso: string;
    titulo: string;
    texto: string;
    heroImagem: string;
    /** slugs das cestas de exemplo, na ordem em que aparecem. */
    cestas: string[];
    categorias: string[];
  };
};

export type Tema = {
  key: TemaKey;
  name: string;
  /** Uma linha: o que o modelo é. */
  resumo: string;
  paraQuem: string;
  destaques: string[];
  /** Plano mínimo para instalar. */
  plano: "start" | "pro";
  variacoes: Variacao[];
};

/** O que todo modelo recebe para montar a página (loja demo ou loja real). */
export type DadosLoja = {
  loja: string;
  aviso: string;
  titulo: string;
  texto: string;
  heroImagem: string;
  categorias: Array<{ nome: string; imagem: string }>;
  cestas: Array<{ nome: string; preco: number; precoDe?: number; imagem: string; serve?: string; href: string }>;
};
