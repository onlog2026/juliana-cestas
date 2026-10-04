import type { ComponentType } from "react";
import { HomeClassica } from "./classica";
import { HomeBoutique } from "./boutique";
import { HomeMercado } from "./mercado";
import { HomeFesta } from "./festa";
import { HomeNoir } from "./noir";
import { HomeRustico } from "./rustico";
import {
  CabecalhoBoutique, CabecalhoClassica, CabecalhoFesta, CabecalhoMercado, CabecalhoNoir, CabecalhoRustico,
  RodapeBoutique, RodapeClassica, RodapeFesta, RodapeMercado, RodapeNoir, RodapeRustico,
} from "./casca";
import type { DadosLoja, TemaKey } from "./types";

type C = ComponentType<{ d: DadosLoja }>;

/** Modelo → página inicial. Um componente por modelo (esqueletos diferentes de verdade). */
export const HOMES: Record<TemaKey, C> = {
  classica: HomeClassica,
  boutique: HomeBoutique,
  mercado: HomeMercado,
  festa: HomeFesta,
  noir: HomeNoir,
  rustico: HomeRustico,
};

export const CABECALHOS: Record<TemaKey, C> = {
  classica: CabecalhoClassica,
  boutique: CabecalhoBoutique,
  mercado: CabecalhoMercado,
  festa: CabecalhoFesta,
  noir: CabecalhoNoir,
  rustico: CabecalhoRustico,
};

export const RODAPES: Record<TemaKey, C> = {
  classica: RodapeClassica,
  boutique: RodapeBoutique,
  mercado: RodapeMercado,
  festa: RodapeFesta,
  noir: RodapeNoir,
  rustico: RodapeRustico,
};

export { TEMAS, getTema, getVariacao, TEMA_KEYS } from "./catalogo";
export { TemaRoot } from "./kit";
export type { DadosLoja, Tema, TemaKey, Variacao } from "./types";
