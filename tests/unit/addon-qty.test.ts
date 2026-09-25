import { describe, expect, it } from "vitest";
import { MAX_ADDON_QTY, addOne, countBySlug, groupByName, removeOne } from "@/modules/checkout/addon-qty";

describe("quantidade de adicionais", () => {
  it("conta repetições por slug", () => {
    const c = countBySlug(["a", "b", "a", "a"]);
    expect(c.get("a")).toBe(3);
    expect(c.get("b")).toBe(1);
  });

  it("addOne soma uma unidade e respeita o limite", () => {
    expect(addOne([], "a")).toEqual(["a"]);
    const cheio = Array(MAX_ADDON_QTY).fill("a");
    expect(addOne(cheio, "a")).toHaveLength(MAX_ADDON_QTY);
    expect(addOne(cheio, "b")).toHaveLength(MAX_ADDON_QTY + 1);
  });

  it("removeOne tira só uma unidade e ignora slug ausente", () => {
    expect(removeOne(["a", "b", "a"], "a")).toEqual(["a", "b"]);
    expect(removeOne(["a"], "x")).toEqual(["a"]);
    expect(removeOne([], "a")).toEqual([]);
  });

  it("groupByName agrupa mantendo a ordem e manda sem seção pra Outros", () => {
    const g = groupByName([
      { id: 1, group_name: "Fotos" },
      { id: 2, group_name: "Bolos" },
      { id: 3, group_name: "Fotos" },
      { id: 4, group_name: null },
    ]);
    expect(g.map((x) => x.name)).toEqual(["Fotos", "Bolos", "Outros"]);
    expect(g[0].items.map((i) => i.id)).toEqual([1, 3]);
  });
});
