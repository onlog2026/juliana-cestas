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
  Space_Grotesk,
  DM_Serif_Display,
  Fraunces,
  Syne,
  Unbounded,
  DM_Sans,
  Oswald,
  Italiana,
  Instrument_Serif,
  Outfit,
  Abril_Fatface,
  Bricolage_Grotesque,
  Quicksand,
  Rubik,
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
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], preload: false, display: "swap", variable: "--tf-space-grotesk" });
const dmSerif = DM_Serif_Display({ subsets: ["latin"], preload: false, display: "swap", weight: ["400"], variable: "--tf-dm-serif" });
const fraunces = Fraunces({ subsets: ["latin"], preload: false, display: "swap", variable: "--tf-fraunces" });
const syne = Syne({ subsets: ["latin"], preload: false, display: "swap", variable: "--tf-syne" });
const unbounded = Unbounded({ subsets: ["latin"], preload: false, display: "swap", variable: "--tf-unbounded" });
const dmSans = DM_Sans({ subsets: ["latin"], preload: false, display: "swap", variable: "--tf-dm-sans" });
const oswald = Oswald({ subsets: ["latin"], preload: false, display: "swap", variable: "--tf-oswald" });
const italiana = Italiana({ subsets: ["latin"], preload: false, display: "swap", weight: ["400"], variable: "--tf-italiana" });
const instrumentSerif = Instrument_Serif({ subsets: ["latin"], preload: false, display: "swap", weight: ["400"], variable: "--tf-instrument-serif" });
const outfit = Outfit({ subsets: ["latin"], preload: false, display: "swap", variable: "--tf-outfit" });
const abril = Abril_Fatface({ subsets: ["latin"], preload: false, display: "swap", weight: ["400"], variable: "--tf-abril" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], preload: false, display: "swap", variable: "--tf-bricolage" });
const quicksand = Quicksand({ subsets: ["latin"], preload: false, display: "swap", variable: "--tf-quicksand" });
const rubik = Rubik({ subsets: ["latin"], preload: false, display: "swap", variable: "--tf-rubik" });
const caveat = Caveat({ subsets: ["latin"], preload: false, display: "swap", variable: "--tf-caveat" });

/** Classes que declaram TODAS as variáveis de fonte no invólucro do modelo. */
export const TEMA_FONT_CLASSES = [
  playfair, figtree, cormorant, jost, archivo, interTight, baloo, nunito, bodoni, manrope, lora, workSans, caveat,
  spaceGrotesk, dmSerif, fraunces, syne, unbounded, dmSans, oswald, italiana, instrumentSerif, outfit, abril, bricolage, quicksand, rubik,
]
  .map((f) => f.variable)
  .join(" ");

export type TemaFonte =
  | "playfair" | "figtree" | "cormorant" | "jost" | "archivo" | "inter-tight"
  | "baloo" | "nunito" | "bodoni" | "manrope" | "lora" | "work-sans" | "caveat"
  | "space-grotesk" | "dm-serif" | "fraunces" | "syne" | "unbounded" | "dm-sans" | "oswald" | "italiana" | "instrument-serif" | "outfit" | "abril" | "bricolage" | "quicksand" | "rubik";

export function fonteVar(f: TemaFonte): string {
  return `var(--tf-${f})`;
}
