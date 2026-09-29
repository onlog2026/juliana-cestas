// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { cleanup, render } from "@testing-library/react";
import { ProductRibbon, RIBBON_OVERHANG, ribbonFontSize, ribbonLines, shade } from "@/components/loja/product-ribbon";

afterEach(() => cleanup());

describe("ProductRibbon", () => {
  it("nomes curtos ficam em 1 linha; longos com espaço quebram em 2 equilibradas", () => {
    expect(ribbonLines("Novo")).toEqual(["Novo"]);
    expect(ribbonLines("-14%")).toEqual(["-14%"]);
    expect(ribbonLines("Promoção")).toEqual(["Promoção"]);
    expect(ribbonLines("Últimas unidades")).toEqual(["Últimas", "unidades"]);
    expect(ribbonLines("Black Friday")).toEqual(["Black", "Friday"]);
    expect(ribbonLines("Dia das Mães")).toEqual(["Dia das", "Mães"]);
  });

  it("a letra nunca fica maior que 11px nem menor que 7px", () => {
    expect(ribbonFontSize(["-14%"], 88)).toBeLessThanOrEqual(11);
    expect(ribbonFontSize(["a".repeat(30)], 88)).toBe(7);
    expect(ribbonFontSize(["Novo"], 88)).toBe(11);
  });

  it("a dobra usa uma versão mais escura da cor da tarja", () => {
    expect(shade("#ffffff", 0.5)).toBe("#808080");
    expect(shade("#000000")).toBe("#000000");
    expect(shade("#b3261e")).not.toBe("#b3261e");
  });

  it("renderiza texto para leitor de tela, a fita (passando da borda) e as 2 dobras", () => {
    const { container } = render(createElement(ProductRibbon, { label: "Black Friday", bg: "#111111", text: "#f5c518", size: 88 }));
    expect(container.querySelector(".sr-only")!.textContent).toBe("Black Friday");
    const deco = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    // caixa = foto (88) + o que a fita passa da borda; começa fora do canto
    expect(deco.style.width).toBe(`${88 + RIBBON_OVERHANG}px`);
    expect(deco.style.left).toBe(`-${RIBBON_OVERHANG}px`);
    expect(deco.style.top).toBe(`-${RIBBON_OVERHANG}px`);
    const band = deco.querySelector(".-rotate-45") as HTMLElement;
    expect(band.style.background).toContain("rgb(17, 17, 17)");
    expect(deco.querySelectorAll("polygon")).toHaveLength(2);
  });
});
