// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { cleanup, render } from "@testing-library/react";
import { ProductRibbon, ribbonFontSize, ribbonLines } from "@/components/loja/product-ribbon";

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

  it("renderiza o texto para leitor de tela e a faixa decorativa com as cores", () => {
    const { container } = render(createElement(ProductRibbon, { label: "Black Friday", bg: "#111111", text: "#f5c518", size: 88 }));
    expect(container.querySelector(".sr-only")!.textContent).toBe("Black Friday");
    const deco = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(deco.style.width).toBe("88px");
    const band = deco.firstElementChild as HTMLElement;
    expect(band.style.background).toContain("rgb(17, 17, 17)");
    expect(band.className).toContain("-rotate-45");
    expect(band.textContent).toBe("BlackFriday".replace("BlackFriday", "BlackFriday"));
  });
});
