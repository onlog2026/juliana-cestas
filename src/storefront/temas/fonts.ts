import {
  Archivo,
  Baloo_2,
  Bodoni_Moda,
  Caveat,
  Cormorant_Garamond,
  Figtree,
  Inter_Tight,
  Jost,
  Lora,
  Manrope,
  Nunito,
  Playfair_Display,
  Work_Sans,
} from "next/font/google";

/**
 * Fontes dos modelos de loja. `preload: false` em todas: nenhuma é baixada até
 * uma página usá-la (o @font-face fica declarado; o navegador só busca a fonte
 * quando um texto do modelo instalado precisa dela). A loja da Juliana não usa
 * nenhuma destas — continua com as fontes do layout raiz.
 */
const playfair = Playfair_Display({ subsets: ["latin"], preload: false, display: "swap", variable: "--tf-playfair" });
const figtree = Figtree({ subsets: ["latin"], preload: false, display: "swap", variable: "--tf-figtree" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], preload: false, display: "swap", weight: ["400", "500", "600"], variable: "--tf-cormorant" });
const jost = Jost({ subsets: ["latin"], preload: false, display: "swap", variable: "--tf-jost" });
const archivo = Archivo({ subsets: ["latin"], preload: false, display: "swap", variable: "--tf-archivo" });
const interTight = Inter_Tight({ subsets: ["latin"], preload: false, display: "swap", variable: "--tf-inter-tight" });
const baloo = Baloo_2({ subsets: ["latin"], preload: false, display: "swap", variable: "--tf-baloo" });
const nunito = Nunito({ subsets: ["latin"], preload: false, display: "swap", variable: "--tf-nunito" });
const bodoni = Bodoni_Moda({ subsets: ["latin"], preload: false, display: "swap", variable: "--tf-bodoni" });
const manrope = Manrope({ subsets: ["latin"], preload: false, display: "swap", variable: "--tf-manrope" });
const lora = Lora({ subsets: ["latin"], preload: false, display: "swap", variable: "--tf-lora" });
const workSans = Work_Sans({ subsets: ["latin"], preload: false, display: "swap", variable: "--tf-work-sans" });
const caveat = Caveat({ subsets: ["latin"], preload: false, display: "swap", variable: "--tf-caveat" });

/** Classes que declaram TODAS as variáveis de fonte no invólucro do modelo. */
export const TEMA_FONT_CLASSES = [
  playfair, figtree, cormorant, jost, archivo, interTight, baloo, nunito, bodoni, manrope, lora, workSans, caveat,
]
  .map((f) => f.variable)
  .join(" ");

export type TemaFonte =
  | "playfair" | "figtree" | "cormorant" | "jost" | "archivo" | "inter-tight"
  | "baloo" | "nunito" | "bodoni" | "manrope" | "lora" | "work-sans" | "caveat";

export function fonteVar(f: TemaFonte): string {
  return `var(--tf-${f})`;
}
