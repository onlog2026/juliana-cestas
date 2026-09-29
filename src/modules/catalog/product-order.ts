/**
 * Lógica PURA da ordenação manual dos produtos no painel (sem banco, sem
 * React): fácil de testar e reaproveitada pelo componente e pelo servidor.
 */

/** Minúsculas e sem acento: "Açaí" e "acai" se encontram. */
export function normalizeSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Filtra por nome, categoria ou SKU (sem acento). Termo vazio devolve tudo. */
export function filterProducts<T extends { name: string; categoryLabel?: string | null; sku?: string | null }>(
  list: T[],
  term: string
): T[] {
  const q = normalizeSearch(term);
  if (!q) return list;
  return list.filter((p) =>
    [p.name, p.categoryLabel ?? "", p.sku ?? ""].some((field) => normalizeSearch(field).includes(q))
  );
}

/** Move o item de `from` para a posição `to` (índices 0-based, sempre dentro da lista). */
export function moveTo<T>(list: T[], from: number, to: number): T[] {
  if (from < 0 || from >= list.length) return list;
  const target = Math.max(0, Math.min(list.length - 1, to));
  if (target === from) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(target, 0, item);
  return next;
}

/**
 * Quais linhas precisam ser gravadas: só as que mudaram de `sort_order`.
 * `current` = ordem atual no banco (id -> sort_order); `orderedIds` = a nova.
 */
export function changedOrders(
  current: Map<string, number>,
  orderedIds: string[]
): Array<{ id: string; sortOrder: number }> {
  const changes: Array<{ id: string; sortOrder: number }> = [];
  orderedIds.forEach((id, index) => {
    if (current.get(id) !== index) changes.push({ id, sortOrder: index });
  });
  return changes;
}

/** A nova lista tem exatamente os mesmos ids que o banco (ninguém criou/apagou no meio)? */
export function sameIdSet(current: Map<string, number>, orderedIds: string[]): boolean {
  if (orderedIds.length !== current.size) return false;
  const seen = new Set(orderedIds);
  if (seen.size !== orderedIds.length) return false;
  return orderedIds.every((id) => current.has(id));
}
