import { TEMAS } from "@/storefront/temas/catalogo";
import type { TemaKey } from "@/storefront/temas/types";

/** O que a vitrine de modelos mostra de cada modelo: textos + capturas reais de cada variação. */
export type ModeloVitrine = {
  key: TemaKey;
  name: string;
  plano: string;
  resumo: string;
  paraQuem: string;
  destaques: string[];
  /** Cada variação tem a sua loja demo e as suas capturas (computador e celular). */
  telas: Array<{ key: string; rotulo: string; cor: string; desktop: string; celular: string; demo: string }>;
};

export const MODELOS: ModeloVitrine[] = TEMAS.map((t) => ({
  key: t.key,
  name: t.name,
  plano: t.plano === "start" ? "Incluso em todos os planos" : "Planos Pro e Premium",
  resumo: t.resumo,
  paraQuem: t.paraQuem,
  destaques: t.destaques,
  telas: t.variacoes.map((v) => ({
    key: v.key,
    rotulo: v.name,
    cor: v.paleta.primary,
    desktop: `/modelos/${t.key}-${v.key}-d.webp`,
    celular: `/modelos/${t.key}-${v.key}-m.webp`,
    demo: `/modelos/ver/${t.key}?variante=${v.key}`,
  })),
}));

export function getModelo(key: string): ModeloVitrine | undefined {
  return MODELOS.find((m) => m.key === key);
}
