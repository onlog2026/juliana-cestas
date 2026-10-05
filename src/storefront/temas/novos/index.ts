import type { ComponentType } from "react";
import type { DadosLoja, Tema, TemaKey } from "../types";
import { TEMA as tema_galeria } from "./galeria/tema";
import { Home as Home_galeria } from "./galeria/home";
import { Cabecalho as Cab_galeria, Rodape as Rod_galeria } from "./galeria/casca";
import { Categoria as Cat_galeria, Produto as Prod_galeria, Carrinho as Carr_galeria } from "./galeria/internas";
import { TEMA as tema_promo } from "./promo/tema";
import { Home as Home_promo } from "./promo/home";
import { Cabecalho as Cab_promo, Rodape as Rod_promo } from "./promo/casca";
import { Categoria as Cat_promo, Produto as Prod_promo, Carrinho as Carr_promo } from "./promo/internas";
import { TEMA as tema_mono } from "./mono/tema";
import { Home as Home_mono } from "./mono/home";
import { Cabecalho as Cab_mono, Rodape as Rod_mono } from "./mono/casca";
import { Categoria as Cat_mono, Produto as Prod_mono, Carrinho as Carr_mono } from "./mono/internas";
import { TEMA as tema_stories } from "./stories/tema";
import { Home as Home_stories } from "./stories/home";
import { Cabecalho as Cab_stories, Rodape as Rod_stories } from "./stories/casca";
import { Categoria as Cat_stories, Produto as Prod_stories, Carrinho as Carr_stories } from "./stories/internas";
import { TEMA as tema_panorama } from "./panorama/tema";
import { Home as Home_panorama } from "./panorama/home";
import { Cabecalho as Cab_panorama, Rodape as Rod_panorama } from "./panorama/casca";
import { Categoria as Cat_panorama, Produto as Prod_panorama, Carrinho as Carr_panorama } from "./panorama/internas";
import { TEMA as tema_simetria } from "./simetria/tema";
import { Home as Home_simetria } from "./simetria/home";
import { Cabecalho as Cab_simetria, Rodape as Rod_simetria } from "./simetria/casca";
import { Categoria as Cat_simetria, Produto as Prod_simetria, Carrinho as Carr_simetria } from "./simetria/internas";
import { TEMA as tema_bairro } from "./bairro/tema";
import { Home as Home_bairro } from "./bairro/home";
import { Cabecalho as Cab_bairro, Rodape as Rod_bairro } from "./bairro/casca";
import { Categoria as Cat_bairro, Produto as Prod_bairro, Carrinho as Carr_bairro } from "./bairro/internas";
import { TEMA as tema_revista } from "./revista/tema";
import { Home as Home_revista } from "./revista/home";
import { Cabecalho as Cab_revista, Rodape as Rod_revista } from "./revista/casca";
import { Categoria as Cat_revista, Produto as Prod_revista, Carrinho as Carr_revista } from "./revista/internas";
import { TEMA as tema_vibrante } from "./vibrante/tema";
import { Home as Home_vibrante } from "./vibrante/home";
import { Cabecalho as Cab_vibrante, Rodape as Rod_vibrante } from "./vibrante/casca";
import { Categoria as Cat_vibrante, Produto as Prod_vibrante, Carrinho as Carr_vibrante } from "./vibrante/internas";
import { TEMA as tema_aconchego } from "./aconchego/tema";
import { Home as Home_aconchego } from "./aconchego/home";
import { Cabecalho as Cab_aconchego, Rodape as Rod_aconchego } from "./aconchego/casca";
import { Categoria as Cat_aconchego, Produto as Prod_aconchego, Carrinho as Carr_aconchego } from "./aconchego/internas";
import { TEMA as tema_empresas } from "./empresas/tema";
import { Home as Home_empresas } from "./empresas/home";
import { Cabecalho as Cab_empresas, Rodape as Rod_empresas } from "./empresas/casca";
import { Categoria as Cat_empresas, Produto as Prod_empresas, Carrinho as Carr_empresas } from "./empresas/internas";

type C = ComponentType<{ d: DadosLoja }>;
export type NovoKey = "galeria" | "promo" | "mono" | "stories" | "panorama" | "simetria" | "bairro" | "revista" | "vibrante" | "aconchego" | "empresas";

/** Modelos das ondas B e C — um registro só, cada esqueleto na sua pasta (`novos/<modelo>/`). */
export const NOVOS_TEMAS: Tema[] = [tema_galeria, tema_promo, tema_mono, tema_stories, tema_panorama, tema_simetria, tema_bairro, tema_revista, tema_vibrante, tema_aconchego, tema_empresas];
export const NOVOS_HOMES = { galeria: Home_galeria, promo: Home_promo, mono: Home_mono, stories: Home_stories, panorama: Home_panorama, simetria: Home_simetria, bairro: Home_bairro, revista: Home_revista, vibrante: Home_vibrante, aconchego: Home_aconchego, empresas: Home_empresas } as Record<NovoKey, C>;
export const NOVOS_CABECALHOS = { galeria: Cab_galeria, promo: Cab_promo, mono: Cab_mono, stories: Cab_stories, panorama: Cab_panorama, simetria: Cab_simetria, bairro: Cab_bairro, revista: Cab_revista, vibrante: Cab_vibrante, aconchego: Cab_aconchego, empresas: Cab_empresas } as Record<NovoKey, C>;
export const NOVOS_RODAPES = { galeria: Rod_galeria, promo: Rod_promo, mono: Rod_mono, stories: Rod_stories, panorama: Rod_panorama, simetria: Rod_simetria, bairro: Rod_bairro, revista: Rod_revista, vibrante: Rod_vibrante, aconchego: Rod_aconchego, empresas: Rod_empresas } as Record<NovoKey, C>;
export const NOVOS_INTERNAS = {
  galeria: { Categoria: Cat_galeria, Produto: Prod_galeria, Carrinho: Carr_galeria },
  promo: { Categoria: Cat_promo, Produto: Prod_promo, Carrinho: Carr_promo },
  mono: { Categoria: Cat_mono, Produto: Prod_mono, Carrinho: Carr_mono },
  stories: { Categoria: Cat_stories, Produto: Prod_stories, Carrinho: Carr_stories },
  panorama: { Categoria: Cat_panorama, Produto: Prod_panorama, Carrinho: Carr_panorama },
  simetria: { Categoria: Cat_simetria, Produto: Prod_simetria, Carrinho: Carr_simetria },
  bairro: { Categoria: Cat_bairro, Produto: Prod_bairro, Carrinho: Carr_bairro },
  revista: { Categoria: Cat_revista, Produto: Prod_revista, Carrinho: Carr_revista },
  vibrante: { Categoria: Cat_vibrante, Produto: Prod_vibrante, Carrinho: Carr_vibrante },
  aconchego: { Categoria: Cat_aconchego, Produto: Prod_aconchego, Carrinho: Carr_aconchego },
  empresas: { Categoria: Cat_empresas, Produto: Prod_empresas, Carrinho: Carr_empresas },
} as Record<NovoKey, { Categoria: ComponentType<{ d: DadosLoja; slug?: string }>; Produto: ComponentType<{ d: DadosLoja; slug: string }>; Carrinho: C }>;
export type { TemaKey };
