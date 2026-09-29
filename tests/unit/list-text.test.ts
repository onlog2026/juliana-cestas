import { describe, expect, it } from "vitest";
import { moveExtra, promoteToCover, splitListText } from "@/modules/catalog/list-text";
import { iconForItem } from "@/components/loja/item-icon";
import { Gift, Wine, Milk, Croissant } from "lucide-react";

describe("splitListText", () => {
  it("vírgula, ponto e vírgula e linha viram itens", () => {
    expect(splitListText("queijos nobres, frios artesanais; pães frescos\nazeitonas")).toEqual([
      "queijos nobres",
      "frios artesanais",
      "pães frescos",
      "azeitonas",
    ]);
  });
  it("tira espaços, vazios e repetidos (sem diferenciar maiúsculas)", () => {
    expect(splitListText("  Vinho ,, vinho ;  ; Queijo  \n\n")).toEqual(["Vinho", "Queijo"]);
    expect(splitListText("")).toEqual([]);
    expect(splitListText(null)).toEqual([]);
  });
  it("limita quantidade e tamanho de cada item", () => {
    const many = Array.from({ length: 60 }, (_, i) => `item ${i}`).join(",");
    expect(splitListText(many)).toHaveLength(40);
    expect(splitListText("a".repeat(200))[0]).toHaveLength(80);
  });
});

describe("foto principal", () => {
  it("promove a extra e a capa antiga ocupa o lugar dela", () => {
    expect(promoteToCover("capa", ["a", "b", "c"], 1)).toEqual({ cover: "b", extras: ["a", "capa", "c"] });
  });
  it("índice inválido não muda nada; nunca muta os originais", () => {
    const extras = ["a", "b"];
    expect(promoteToCover("capa", extras, 5)).toEqual({ cover: "capa", extras: ["a", "b"] });
    promoteToCover("capa", extras, 0);
    expect(extras).toEqual(["a", "b"]);
  });
  it("mover extra para os lados respeita as pontas", () => {
    expect(moveExtra(["a", "b", "c"], 2, -1)).toEqual(["a", "c", "b"]);
    expect(moveExtra(["a", "b", "c"], 0, -1)).toEqual(["a", "b", "c"]);
    expect(moveExtra(["a", "b", "c"], 2, 1)).toEqual(["a", "b", "c"]);
  });
});

describe("iconForItem", () => {
  it("escolhe o ícone pela palavra e cai no presente quando não conhece", () => {
    expect(iconForItem("Vinho tinto Chilano")).toBe(Wine);
    expect(iconForItem("queijos nobres")).toBe(Milk);
    expect(iconForItem("pães frescos")).toBe(Croissant);
    expect(iconForItem("algo sem palavra conhecida")).toBe(Gift);
  });
});
