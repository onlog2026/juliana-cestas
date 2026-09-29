// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { cleanup, render } from "@testing-library/react";
import { promoBannersSchema } from "@/modules/content/types";
import { fillRecommendation } from "@/components/admin/content-promo-banners-form";

vi.mock("@/modules/content/actions", () => ({ updateContent: vi.fn() }));
vi.mock("@/components/admin/image-upload-field", () => ({ ImageUploadField: () => null }));

import { SortableProductGrid, fillColumns, type GridEntry } from "@/components/loja/sortable-product-grid";

afterEach(() => cleanup());

const entries = (n: number): GridEntry[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    order: i,
    price: 10 + i,
    createdAt: "",
    sold: 0,
    node: createElement("span", null, `Produto ${i}`),
  }));

describe("banner que preenche o espaço vazio", () => {
  it("colunas vazias na última linha de 5", () => {
    expect([0, 1, 5, 10, 27, 28, 29, 30].map((n) => fillColumns(n))).toEqual([0, 4, 0, 0, 3, 2, 1, 0]);
  });

  it("27 produtos: o banner entra como último item, ocupa 3 colunas e só aparece no computador", () => {
    const { container } = render(
      createElement(SortableProductGrid, { title: "Nossas cestas", entries: entries(27), fill: createElement("i", null, "BANNER") })
    );
    const slot = container.querySelector("[data-fill-slot]") as HTMLElement;
    expect(slot.getAttribute("data-fill-slot")).toBe("3");
    expect(slot.style.gridColumn).toBe("span 3 / span 3");
    expect(slot.className).toContain("hidden");
    expect(slot.className).toContain("lg:block");
    // os blocos de banner são os DOIS últimos itens (5 colunas e 6 colunas), nessa ordem
    const wide = container.querySelector("[data-fill-slot-wide]");
    expect(slot.parentElement!.lastElementChild).toBe(wide);
    expect(slot.nextElementSibling).toBe(wide);
  });

  it("linha completa (30) ou sem banner cadastrado: nada de bloco vazio", () => {
    const full = render(createElement(SortableProductGrid, { title: "t", entries: entries(30), fill: createElement("i") }));
    expect(full.container.querySelector("[data-fill-slot]")).toBeNull();
    cleanup();
    const none = render(createElement(SortableProductGrid, { title: "t", entries: entries(27) }));
    expect(none.container.querySelector("[data-fill-slot]")).toBeNull();
  });

  it("tela muito larga (6 colunas) tem a sua própria conta e a sua cópia do bloco", () => {
    // 25 produtos: 5 colunas fecham a linha (nada a preencher); 6 colunas deixam 5 vazias.
    const { container } = render(
      createElement(SortableProductGrid, { title: "t", entries: entries(25), fill: createElement("i", null, "BANNER") })
    );
    expect(container.querySelector("[data-fill-slot]")).toBeNull();
    const wide = container.querySelector("[data-fill-slot-wide]") as HTMLElement;
    expect(wide.getAttribute("data-fill-slot-wide")).toBe("5");
    expect(wide.style.gridColumn).toBe("span 5 / span 5");
    expect(wide.className).toContain("2xl:block");
    // e a versão de 5 colunas some nessa largura
    cleanup();
    const c27 = render(
      createElement(SortableProductGrid, { title: "t", entries: entries(27), fill: createElement("i", null, "BANNER") })
    );
    expect((c27.container.querySelector("[data-fill-slot]") as HTMLElement).className).toContain("2xl:hidden");
    expect(fillColumns(27, 6)).toBe(3);
  });

  it("tamanho recomendado calculado pelo número de produtos", () => {
    expect(fillRecommendation(27)).toEqual({ columns: 3, size: "722×390" });
    expect(fillRecommendation(30)).toBeNull();
  });

  it("o que já está salvo no banco (sem o campo fill) continua válido", () => {
    const slot = { imageUrl: "", href: "", alt: "" };
    expect(promoBannersSchema.safeParse({ enabled: true, wide: slot, narrow: slot }).success).toBe(true);
    expect(
      promoBannersSchema.safeParse({
        enabled: true,
        wide: slot,
        narrow: slot,
        fill: { imageUrl: "https://evil.example.com/x.png", href: "", alt: "" },
      }).success
    ).toBe(false);
  });
});
