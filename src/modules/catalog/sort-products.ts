/**
 * Ordenação da grade de produtos da home (feita no navegador, para a home
 * continuar estática). Sem `server-only` e sem React de propósito: é lógica
 * pura, testável por unidade.
 */

export type SortKey = "destaques" | "menor-preco" | "maior-preco" | "novidades" | "mais-pedidos";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "destaques", label: "Destaques" },
  { key: "menor-preco", label: "Menor preço" },
  { key: "maior-preco", label: "Maior preço" },
  { key: "novidades", label: "Mais novos" },
  { key: "mais-pedidos", label: "Mais pedidos" },
];

export function isSortKey(value: string): value is SortKey {
  return SORT_OPTIONS.some((o) => o.key === value);
}

/** O mínimo que a ordenação precisa saber de um produto. */
export type SortableMeta = {
  /** Posição na ordem manual da loja (sort_order já aplicado pelo servidor). */
  order: number;
  price: number;
  /** ISO 8601; vazio = desconhecido (vai para o fim em "Mais novos"). */
  createdAt: string;
  /** Unidades vendidas (0 se ainda não há dado). */
  sold: number;
};

/**
 * Devolve uma cópia ordenada. Desempate SEMPRE pela ordem manual da loja, então
 * o resultado é estável e previsível (dois produtos com o mesmo preço não
 * "pulam" de lugar a cada clique).
 */
export function sortEntries<T extends SortableMeta>(entries: readonly T[], key: SortKey): T[] {
  const byOrder = (a: T, b: T) => a.order - b.order;
  const copy = [...entries];

  switch (key) {
    case "menor-preco":
      return copy.sort((a, b) => a.price - b.price || byOrder(a, b));
    case "maior-preco":
      return copy.sort((a, b) => b.price - a.price || byOrder(a, b));
    case "novidades":
      return copy.sort((a, b) => {
        // ISO compara certo como texto; sem data vai para o fim.
        if (a.createdAt !== b.createdAt) {
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return a.createdAt < b.createdAt ? 1 : -1;
        }
        return byOrder(a, b);
      });
    case "mais-pedidos":
      return copy.sort((a, b) => b.sold - a.sold || byOrder(a, b));
    case "destaques":
    default:
      return copy.sort(byOrder);
  }
}

/** "Mais pedidos" só faz sentido se algum produto já vendeu. */
export function availableSortOptions(entries: readonly SortableMeta[]) {
  const hasSales = entries.some((e) => e.sold > 0);
  return SORT_OPTIONS.filter((o) => o.key !== "mais-pedidos" || hasSales);
}

/** Onde entram os banners promocionais: depois da 3ª linha, em cada largura. */
export const PROMO_AFTER_ITEMS = {
  /** 2 colunas (celular) × 3 linhas */
  mobile: 6,
  /** 3 colunas (tablet) × 3 linhas */
  tablet: 9,
  /** 5 colunas (computador) × 3 linhas */
  desktop: 15,
  /** 6 colunas (tela muito larga, >= 1536px) × 3 linhas */
  wide: 18,
} as const;

/** Posição real de inserção: se a lista é menor que a 3ª linha, vai para o fim. */
export function promoInsertIndex(itemCount: number, afterItems: number): number {
  return Math.min(afterItems, itemCount);
}

/* ───────────── Filtros (categoria + faixa de preço), feitos no navegador ───────────── */

export type PriceBandKey = "ate-150" | "150-300" | "acima-300";

/** Faixas em reais; `max` exclusivo, exceto a última (sem teto). */
export const PRICE_BANDS: { key: PriceBandKey; label: string; min: number; max: number }[] = [
  { key: "ate-150", label: "Até R$ 150", min: 0, max: 150.01 },
  { key: "150-300", label: "R$ 150 a R$ 300", min: 150.01, max: 300.01 },
  { key: "acima-300", label: "Acima de R$ 300", min: 300.01, max: Infinity },
];

export function isPriceBandKey(value: string): value is PriceBandKey {
  return PRICE_BANDS.some((b) => b.key === value);
}

export type GridFilter = { category: string | null; band: PriceBandKey | null };
export const NO_FILTER: GridFilter = { category: null, band: null };

/** O que o filtro precisa saber de um produto. */
export type FilterableMeta = { price: number; categoryId?: string };

/**
 * `categoryIds` = ids da categoria escolhida + das subcategorias (o servidor
 * resolve e manda pronto). Sem categoria/faixa = devolve tudo.
 */
export function filterEntries<T extends FilterableMeta>(
  entries: readonly T[],
  filter: GridFilter,
  categoryIds: ReadonlyMap<string, readonly string[]>
): T[] {
  const ids = filter.category ? new Set(categoryIds.get(filter.category) ?? []) : null;
  const band = filter.band ? PRICE_BANDS.find((b) => b.key === filter.band) : null;
  return entries.filter((e) => {
    if (ids && (!e.categoryId || !ids.has(e.categoryId))) return false;
    if (band && !(e.price >= band.min && e.price < band.max)) return false;
    return true;
  });
}

/** Lê `#filtro=cat:frios,preco:ate-150` (ignora lixo). `validCategories` = slugs aceitos. */
export function parseFilterHash(hash: string, validCategories: ReadonlySet<string>): GridFilter {
  const match = /(?:^#|&)filtro=([^&]*)/.exec(hash);
  const out: GridFilter = { category: null, band: null };
  if (!match) return out;
  for (const part of decodeURIComponent(match[1]).split(",")) {
    const [k, v] = part.split(":");
    if (k === "cat" && v && validCategories.has(v)) out.category = v;
    if (k === "preco" && v && isPriceBandKey(v)) out.band = v;
  }
  return out;
}

export function serializeFilter(filter: GridFilter): string {
  const parts: string[] = [];
  if (filter.category) parts.push(`cat:${filter.category}`);
  if (filter.band) parts.push(`preco:${filter.band}`);
  return parts.join(",");
}
