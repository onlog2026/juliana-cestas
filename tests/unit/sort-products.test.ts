import { describe, expect, it } from "vitest";
import {
  PROMO_AFTER_ITEMS,
  SORT_OPTIONS,
  availableSortOptions,
  isSortKey,
  promoInsertIndex,
  sortEntries,
  type SortableMeta,
} from "@/modules/catalog/sort-products";

type P = SortableMeta & { name: string };

const items: P[] = [
  { name: "A", order: 0, price: 100, createdAt: "2026-09-10T00:00:00Z", sold: 2 },
  { name: "B", order: 1, price: 50, createdAt: "2026-09-25T00:00:00Z", sold: 9 },
  { name: "C", order: 2, price: 100, createdAt: "2026-09-01T00:00:00Z", sold: 2 },
  { name: "D", order: 3, price: 300, createdAt: "", sold: 0 },
  { name: "E", order: 4, price: 50, createdAt: "2026-09-25T00:00:00Z", sold: 0 },
];

const names = (list: P[]) => list.map((p) => p.name).join("");

describe("sortEntries", () => {
  it("destaques = ordem manual da loja, mesmo se a lista vier embaralhada", () => {
    expect(names(sortEntries([items[3], items[0], items[4], items[1], items[2]], "destaques"))).toBe("ABCDE");
  });

  it("menor preço: crescente, empate pela ordem manual", () => {
    expect(names(sortEntries(items, "menor-preco"))).toBe("BEACD");
  });

  it("maior preço: decrescente, empate pela ordem manual", () => {
    expect(names(sortEntries(items, "maior-preco"))).toBe("DACBE");
  });

  it("mais novos: data mais recente primeiro; sem data vai para o fim; empate pela ordem", () => {
    expect(names(sortEntries(items, "novidades"))).toBe("BEACD");
  });

  it("mais pedidos: mais vendidos primeiro, empate pela ordem manual", () => {
    expect(names(sortEntries(items, "mais-pedidos"))).toBe("BACDE");
  });

  it("não altera a lista original (devolve cópia)", () => {
    const before = names(items);
    sortEntries(items, "maior-preco");
    expect(names(items)).toBe(before);
  });

  it("é estável: repetir a mesma ordenação dá o mesmo resultado", () => {
    const a = names(sortEntries(items, "menor-preco"));
    const b = names(sortEntries(sortEntries(items, "menor-preco"), "menor-preco"));
    expect(a).toBe(b);
  });

  it("lista vazia e de 1 item não quebram", () => {
    expect(sortEntries([], "menor-preco")).toEqual([]);
    expect(sortEntries([items[0]], "novidades")).toHaveLength(1);
  });
});

describe("opções de ordenação", () => {
  it('"Mais pedidos" só aparece se algum produto já vendeu', () => {
    const semVenda = items.map((i) => ({ ...i, sold: 0 }));
    expect(availableSortOptions(semVenda).map((o) => o.key)).not.toContain("mais-pedidos");
    expect(availableSortOptions(items).map((o) => o.key)).toContain("mais-pedidos");
  });

  it("isSortKey aceita só chaves conhecidas (protege o #ordem= da URL)", () => {
    for (const o of SORT_OPTIONS) expect(isSortKey(o.key)).toBe(true);
    for (const ruim of ["", "preco", "__proto__", "menor-preco ", "<script>"]) expect(isSortKey(ruim)).toBe(false);
  });
});

describe("posição dos banners promocionais", () => {
  it("depois da 3ª linha de cada largura (2, 3 e 5 colunas)", () => {
    expect(PROMO_AFTER_ITEMS).toEqual({ mobile: 6, tablet: 9, desktop: 15 });
  });

  it("lista menor que a 3ª linha: o banner vai para o fim, nunca some", () => {
    expect(promoInsertIndex(27, PROMO_AFTER_ITEMS.desktop)).toBe(15);
    expect(promoInsertIndex(12, PROMO_AFTER_ITEMS.desktop)).toBe(12);
    expect(promoInsertIndex(4, PROMO_AFTER_ITEMS.mobile)).toBe(4);
    expect(promoInsertIndex(0, PROMO_AFTER_ITEMS.mobile)).toBe(0);
  });
});
