// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SortableProductGrid, type GridEntry } from "@/components/loja/sortable-product-grid";

function makeEntries(n: number, sold = 0): GridEntry[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    order: i,
    // preços decrescentes com a ordem manual: o último é o mais barato
    price: 1000 - i * 10,
    createdAt: `2026-09-${String(1 + (i % 28)).padStart(2, "0")}T00:00:00Z`,
    sold: sold ? n - i : 0,
    node: createElement("span", { "data-card": `p${i}` }, `Produto ${i}`),
  }));
}

const cardIds = (container: HTMLElement) =>
  [...container.querySelectorAll("[data-card]")].map((el) => el.getAttribute("data-card"));

const PROMO = createElement("div", { "data-testid": "promo" }, "BANNERS");

beforeEach(() => {
  window.history.replaceState(null, "", "/");
});
afterEach(() => cleanup());

describe("SortableProductGrid", () => {
  it("começa na ordem manual da loja (Destaques), igual ao HTML do servidor", () => {
    const { container } = render(createElement(SortableProductGrid, { title: "Nossas cestas", entries: makeEntries(5) }));
    expect(cardIds(container)).toEqual(["p0", "p1", "p2", "p3", "p4"]);
    expect(screen.getByRole("heading", { name: "Nossas cestas" })).toBeTruthy();
    expect((screen.getByLabelText("Ordenar produtos") as HTMLSelectElement).value).toBe("destaques");
  });

  it("Menor preço reordena os cartões sem recarregar e grava #ordem= na URL", () => {
    const { container } = render(createElement(SortableProductGrid, { title: "T", entries: makeEntries(4) }));
    fireEvent.change(screen.getByLabelText("Ordenar produtos"), { target: { value: "menor-preco" } });
    expect(cardIds(container)).toEqual(["p3", "p2", "p1", "p0"]);
    expect(window.location.hash).toBe("#ordem=menor-preco");
  });

  it("voltar para Destaques limpa o #ordem= da URL", () => {
    const { container } = render(createElement(SortableProductGrid, { title: "T", entries: makeEntries(3) }));
    const select = screen.getByLabelText("Ordenar produtos");
    fireEvent.change(select, { target: { value: "maior-preco" } });
    fireEvent.change(select, { target: { value: "destaques" } });
    expect(window.location.hash).toBe("");
    expect(cardIds(container)).toEqual(["p0", "p1", "p2"]);
  });

  it("abre já ordenado quando o link traz #ordem= válido; ignora valor inválido", () => {
    window.history.replaceState(null, "", "/#ordem=menor-preco");
    const a = render(createElement(SortableProductGrid, { title: "T", entries: makeEntries(3) }));
    expect(cardIds(a.container)).toEqual(["p2", "p1", "p0"]);
    a.unmount();

    window.history.replaceState(null, "", "/#ordem=<script>");
    const b = render(createElement(SortableProductGrid, { title: "T", entries: makeEntries(3) }));
    expect(cardIds(b.container)).toEqual(["p0", "p1", "p2"]);
  });

  it('"Mais pedidos" só existe quando há vendas', () => {
    const sem = render(createElement(SortableProductGrid, { title: "T", entries: makeEntries(3, 0) }));
    expect([...(screen.getByLabelText("Ordenar produtos") as HTMLSelectElement).options].map((o) => o.value)).not.toContain(
      "mais-pedidos"
    );
    sem.unmount();

    render(createElement(SortableProductGrid, { title: "T", entries: makeEntries(3, 1) }));
    expect([...(screen.getByLabelText("Ordenar produtos") as HTMLSelectElement).options].map((o) => o.value)).toContain(
      "mais-pedidos"
    );
  });

  it("mostra no máximo 30 e o botão revela o resto", () => {
    const { container } = render(createElement(SortableProductGrid, { title: "T", entries: makeEntries(34) }));
    expect(cardIds(container)).toHaveLength(30);
    fireEvent.click(screen.getByRole("button", { name: /ver todas as 34 cestas/i }));
    expect(cardIds(container)).toHaveLength(34);
    expect(screen.queryByRole("button", { name: /ver todas/i })).toBeNull();
  });

  it("até 30 produtos não mostra o botão", () => {
    render(createElement(SortableProductGrid, { title: "T", entries: makeEntries(27) }));
    expect(screen.queryByRole("button", { name: /ver todas/i })).toBeNull();
  });

  it("com 1 produto não mostra o seletor de ordem", () => {
    render(createElement(SortableProductGrid, { title: "T", entries: makeEntries(1) }));
    expect(screen.queryByLabelText("Ordenar produtos")).toBeNull();
  });

  describe("banners promocionais", () => {
    const slotAt = (container: HTMLElement, key: string) => {
      const children = [...container.querySelector(".grid")!.children];
      const el = container.querySelector(`[data-promo-slot="${key}"]`)!;
      return { index: children.indexOf(el), el, count: children.length };
    };

    it("entram depois da 3ª linha de cada largura: 6 (celular), 9 (tablet), 15 (computador)", () => {
      const { container } = render(
        createElement(SortableProductGrid, { title: "T", entries: makeEntries(27), promo: PROMO })
      );
      // índice na lista de filhos = nº de produtos antes + banners de antes
      expect(slotAt(container, "promo-m").index).toBe(6);
      expect(slotAt(container, "promo-t").index).toBe(9 + 1);
      expect(slotAt(container, "promo-d").index).toBe(15 + 2);
    });

    it("cada cópia só aparece na sua largura (as outras ficam escondidas por classe)", () => {
      const { container } = render(
        createElement(SortableProductGrid, { title: "T", entries: makeEntries(27), promo: PROMO })
      );
      expect(slotAt(container, "promo-m").el.className).toContain("sm:hidden");
      expect(slotAt(container, "promo-t").el.className).toContain("hidden sm:block lg:hidden");
      expect(slotAt(container, "promo-d").el.className).toContain("hidden lg:block");
      for (const key of ["promo-m", "promo-t", "promo-d"]) {
        expect(slotAt(container, key).el.className).toContain("col-span-full");
      }
    });

    it("lista curta: os banners vão para o fim em vez de sumir", () => {
      const { container } = render(
        createElement(SortableProductGrid, { title: "T", entries: makeEntries(4), promo: PROMO })
      );
      // 4 produtos + 3 cópias, todas depois do último produto
      expect(slotAt(container, "promo-m").index).toBeGreaterThanOrEqual(4);
      expect(slotAt(container, "promo-t").index).toBeGreaterThanOrEqual(4);
      expect(slotAt(container, "promo-d").index).toBeGreaterThanOrEqual(4);
    });

    it("sem banners configurados, nenhum espaço vazio é inserido na grade", () => {
      const { container } = render(createElement(SortableProductGrid, { title: "T", entries: makeEntries(27) }));
      expect(container.querySelectorAll("[data-promo-slot]")).toHaveLength(0);
      expect(container.querySelector(".grid")!.children).toHaveLength(27);
    });

    it("reordenar não muda a posição dos banners", () => {
      const { container } = render(
        createElement(SortableProductGrid, { title: "T", entries: makeEntries(27), promo: PROMO })
      );
      fireEvent.change(screen.getByLabelText("Ordenar produtos"), { target: { value: "maior-preco" } });
      expect(slotAt(container, "promo-m").index).toBe(6);
      expect(slotAt(container, "promo-d").index).toBe(15 + 2);
    });
  });
});
