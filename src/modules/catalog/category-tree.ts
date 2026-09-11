/**
 * Tipos e a montagem da árvore de categorias — em arquivo SEM `server-only`
 * de propósito, para poder ser testado por unidade e importado por qualquer
 * lado. A leitura do banco (com service role) fica em `categories.ts`.
 */

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  active: boolean;
  sortOrder: number;
  /** Categoria pai. null = categoria principal; preenchido = subcategoria. */
  parentId: string | null;
};

/** Categoria principal já com suas subcategorias aninhadas (para o menu). */
export type CategoryNode = Category & { children: Category[] };

/**
 * Monta a árvore (categoria principal -> subcategorias) a partir da lista
 * plana. Só um nível: uma "subcategoria de subcategoria" é ignorada porque o
 * pai dela não é principal. Cada nível respeita a ordem em que veio
 * (a lista já chega ordenada por sort_order).
 */
export function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const tops = categories.filter((c) => !c.parentId);
  const childrenOf = new Map<string, Category[]>();
  for (const c of categories) {
    if (c.parentId) {
      const list = childrenOf.get(c.parentId) ?? [];
      list.push(c);
      childrenOf.set(c.parentId, list);
    }
  }
  return tops.map((top) => ({ ...top, children: childrenOf.get(top.id) ?? [] }));
}
