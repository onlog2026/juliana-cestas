/**
 * Quantidade de adicionais. O carrinho guarda `addonSlugs` como lista onde o
 * MESMO slug repetido = quantidade (2 fotos = ["foto","foto"]). Assim o servidor
 * (quote/create-order) não muda: cada repetição soma o preço, e o pedido junta
 * as repetições numa linha "Nx nome". Funções puras, sem estado.
 */

/** Limite de unidades de UM mesmo adicional (evita pedido absurdo por engano). */
export const MAX_ADDON_QTY = 10;

export function countBySlug(slugs: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of slugs) map.set(s, (map.get(s) ?? 0) + 1);
  return map;
}

export function addOne(slugs: string[], slug: string, max = MAX_ADDON_QTY): string[] {
  if ((countBySlug(slugs).get(slug) ?? 0) >= max) return slugs;
  return [...slugs, slug];
}

/** Tira UMA unidade (a última ocorrência), mantendo a ordem do resto. */
export function removeOne(slugs: string[], slug: string): string[] {
  const i = slugs.lastIndexOf(slug);
  if (i < 0) return slugs;
  return [...slugs.slice(0, i), ...slugs.slice(i + 1)];
}

/** Agrupa por seção, na ordem em que a primeira aparece. Sem seção -> "Outros". */
export function groupByName<T extends { group_name: string | null }>(items: T[]): { name: string; items: T[] }[] {
  const order: string[] = [];
  const map = new Map<string, T[]>();
  for (const item of items) {
    const name = item.group_name?.trim() || "Outros";
    if (!map.has(name)) {
      map.set(name, []);
      order.push(name);
    }
    map.get(name)!.push(item);
  }
  return order.map((name) => ({ name, items: map.get(name)! }));
}
