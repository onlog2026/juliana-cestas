import { describe, expect, it } from "vitest";
import { changedOrders, filterProducts, moveTo, normalizeSearch, sameIdSet } from "@/modules/catalog/product-order";

describe("normalizeSearch / filterProducts", () => {
  it("ignora acento e maiúsculas", () => {
    expect(normalizeSearch("  Café da Manhã ")).toBe("cafe da manha");
  });
  it("busca por nome, categoria e SKU", () => {
    const list = [
      { name: "Cesta Pink", categoryLabel: "Dica Infantil", sku: "CP-01" },
      { name: "Cesta Lady", categoryLabel: "Dica para Ela", sku: "LD-02" },
      { name: "Mesa de Frios", categoryLabel: "Frios", sku: null },
    ];
    expect(filterProducts(list, "cafe")).toEqual([]);
    expect(filterProducts(list, "INFANTIL").map((p) => p.name)).toEqual(["Cesta Pink"]);
    expect(filterProducts(list, "ld-0").map((p) => p.name)).toEqual(["Cesta Lady"]);
    expect(filterProducts(list, "cesta")).toHaveLength(2);
    expect(filterProducts(list, "  ")).toHaveLength(3);
  });
});

describe("moveTo", () => {
  it("move para a posição pedida", () => {
    expect(moveTo(["a", "b", "c", "d"], 3, 0)).toEqual(["d", "a", "b", "c"]);
    expect(moveTo(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
  });
  it("limita ao começo/fim e ignora índice inválido", () => {
    expect(moveTo(["a", "b", "c"], 2, 99)).toEqual(["a", "b", "c"]);
    expect(moveTo(["a", "b", "c"], 1, -5)).toEqual(["b", "a", "c"]);
    expect(moveTo(["a", "b"], 5, 0)).toEqual(["a", "b"]);
  });
  it("não muta a lista original", () => {
    const list = ["a", "b", "c"];
    moveTo(list, 0, 2);
    expect(list).toEqual(["a", "b", "c"]);
  });
});

describe("changedOrders / sameIdSet", () => {
  const current = new Map([
    ["a", 0],
    ["b", 1],
    ["c", 2],
    ["d", 3],
  ]);
  it("trocar dois vizinhos grava só 2 linhas", () => {
    expect(changedOrders(current, ["b", "a", "c", "d"])).toEqual([
      { id: "b", sortOrder: 0 },
      { id: "a", sortOrder: 1 },
    ]);
  });
  it("mesma ordem = nada a gravar", () => {
    expect(changedOrders(current, ["a", "b", "c", "d"])).toEqual([]);
  });
  it("detecta lista desatualizada (item novo, faltando ou repetido)", () => {
    expect(sameIdSet(current, ["a", "b", "c", "d"])).toBe(true);
    expect(sameIdSet(current, ["a", "b", "c"])).toBe(false);
    expect(sameIdSet(current, ["a", "b", "c", "x"])).toBe(false);
    expect(sameIdSet(current, ["a", "a", "c", "d"])).toBe(false);
  });
});
