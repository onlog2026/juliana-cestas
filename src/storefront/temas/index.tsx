import type { ComponentType } from "react";
import { HomeClassica } from "./classica";
import { HomeBoutique } from "./boutique";
import { HomeMercado } from "./mercado";
import { HomeFesta } from "./festa";
import { HomeNoir } from "./noir";
import { HomeRustico } from "./rustico";
import type { DadosLoja, TemaKey } from "./types";

/** Modelo → página inicial. Um componente por modelo (esqueletos diferentes de verdade). */
export const HOMES: Record<TemaKey, ComponentType<{ d: DadosLoja }>> = {
  classica: HomeClassica,
  boutique: HomeBoutique,
  mercado: HomeMercado,
  festa: HomeFesta,
  noir: HomeNoir,
  rustico: HomeRustico,
};

export { TEMAS, getTema, getVariacao, TEMA_KEYS } from "./catalogo";
export { TemaRoot } from "./kit";
export type { DadosLoja, Tema, TemaKey, Variacao } from "./types";
