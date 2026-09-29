import type { Product } from "@/modules/catalog/product";

/** Uma vitrine só aparece com pelo menos isto de produtos (senão fica estranha). */
export const MIN_SHOWCASE = 4;
export const SHOWCASE_SIZE = 10;

/** Produtos ordenados por contagem (desc; empate = ordem manual da loja), só com contagem > 0. */
export function pickTop(products: Product[], counts: Map<string, number>, exclude: Set<string> = new Set()): Product[] {
  return products
    .map((p, i) => ({ p, i, n: counts.get(p.id) ?? 0 }))
    .filter((x) => x.n > 0 && !exclude.has(x.p.id))
    .sort((a, b) => b.n - a.n || a.i - b.i)
    .slice(0, SHOWCASE_SIZE)
    .map((x) => x.p);
}

export type Showcases = { bought: Product[]; clicked: Product[] };

/** "Mais comprados" e "Mais clicados" (sem repetir produto). Lista vazia = vitrine oculta. */
export function buildShowcases(products: Product[], sold: Map<string, number>, clicks: Map<string, number>): Showcases {
  const bought = pickTop(products, sold);
  const shownBought = bought.length >= MIN_SHOWCASE ? bought : [];
  const clicked = pickTop(products, clicks, new Set(shownBought.map((p) => p.id)));
  return {
    bought: shownBought,
    clicked: clicked.length >= MIN_SHOWCASE ? clicked : [],
  };
}
