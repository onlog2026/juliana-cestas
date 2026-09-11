import { describe, expect, it } from "vitest";
import { buildCategoryTree, type Category } from "@/modules/catalog/category-tree";

function cat(id: string, parentId: string | null, sortOrder = 0): Category {
  return {
    id,
    slug: id,
    name: id.toUpperCase(),
    description: null,
    imageUrl: null,
    active: true,
    sortOrder,
    parentId,
  };
}

describe("buildCategoryTree — árvore de categorias", () => {
  it("agrupa subcategorias sob a categoria pai, na ordem recebida", () => {
    const tree = buildCategoryTree([
      cat("presentes", null),
      cat("aniversario", "presentes"),
      cat("romantico", "presentes"),
      cat("cafe", null),
    ]);
    expect(tree.map((t) => t.slug)).toEqual(["presentes", "cafe"]);
    expect(tree[0].children.map((c) => c.slug)).toEqual(["aniversario", "romantico"]);
    expect(tree[1].children).toHaveLength(0);
  });

  it("uma subcategoria cujo pai não está na lista não vira categoria principal", () => {
    // Segurança: se o pai não veio (ex.: inativo/filtrado), a filha NÃO deve
    // aparecer como principal no topo do menu.
    const tree = buildCategoryTree([cat("orfa", "pai-sumido")]);
    expect(tree).toHaveLength(0);
  });

  it("não inventa nível 3: subcategoria de subcategoria fica fora", () => {
    const tree = buildCategoryTree([
      cat("a", null),
      cat("b", "a"),
      cat("c", "b"), // filha de b (que é subcategoria) — não deve aninhar em nível 3
    ]);
    expect(tree.map((t) => t.slug)).toEqual(["a"]);
    expect(tree[0].children.map((c) => c.slug)).toEqual(["b"]);
    // "c" some do topo (seu pai "b" não é principal) e não vira filha de "a".
    expect(tree[0].children.flatMap((c) => (c as unknown as { children?: unknown[] }).children ?? [])).toHaveLength(0);
  });

  it("lista vazia devolve árvore vazia", () => {
    expect(buildCategoryTree([])).toEqual([]);
  });
});
