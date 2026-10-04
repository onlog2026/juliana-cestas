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

export type ProdutoLoja = {
  slug: string;
  nome: string;
  preco: number;
  precoDe?: number;
  serve?: string;
  itens: string[];
  descricao: string;
  fotos: string[];
  categoria: string;
  href: string;
};

/**
 * O que todo modelo recebe para montar as páginas: de uma loja demo, da prévia com
 * os produtos do lojista ou da loja ao vivo.  é o prefixo de todos os links
 * ("/demo/noir/vinhos", "" na loja ao vivo) — assim a mesma página funciona nos 3 contextos.
 */
export type DadosLoja = {
  base: string;
  /** Loja de demonstração: checkout desligado, carrinho local. */
  demo: boolean;
  loja: string;
  aviso: string;
  titulo: string;
  texto: string;
  heroImagem: string;
  whatsapp?: string;
  categorias: Array<{ slug: string; nome: string; imagem: string; href: string }>;
  /** Destaques da página inicial (subconjunto de ). */
  cestas: Array<{ nome: string; preco: number; precoDe?: number; imagem: string; serve?: string; href: string }>;
  produtos: ProdutoLoja[];
};
