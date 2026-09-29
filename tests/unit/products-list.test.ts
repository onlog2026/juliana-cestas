// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: unknown; className?: string }) =>
    createElement("a", { href, ...rest }, children as never),
}));
vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => createElement("span", { "data-img": alt }),
}));
const saveProductOrder = vi.fn();
vi.mock("@/modules/catalog/actions", () => ({ saveProductOrder: (ids: string[]) => saveProductOrder(ids) }));

import { ProductsList, type ProductRow } from "@/components/admin/products-list";

const row = (id: string, name: string, over: Partial<ProductRow> = {}): ProductRow => ({
  id,
  name,
  active: true,
  imageUrl: null,
  categoryLabel: null,
  sku: null,
  priceLabel: "R$ 100,00",
  deliveryLabel: "grátis",
  stock: null,
  stockLow: false,
  ...over,
});

const LIST = [row("a", "Cesta Premium", { sku: "PR-1" }), row("b", "Cesta Pink"), row("c", "Caneca", { categoryLabel: "Opcionais" })];

beforeEach(() => {
  vi.useFakeTimers();
  saveProductOrder.mockReset();
  saveProductOrder.mockResolvedValue({ ok: true, changed: 2 });
  refresh.mockReset();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const names = () => screen.getAllByRole("listitem").map((li) => li.querySelector("a")?.textContent ?? "");

describe("ProductsList", () => {
  it("mostra os produtos em grade e a ordem recebida", () => {
    render(createElement(ProductsList, { products: LIST }));
    expect(screen.getByRole("list").className).toContain("lg:grid-cols-3");
    expect(names()[0]).toContain("Cesta Premium");
    expect(names()).toHaveLength(3);
  });

  it("busca sem acento por nome, categoria e código; com busca as setas e a posição travam", () => {
    render(createElement(ProductsList, { products: LIST }));
    fireEvent.change(screen.getByPlaceholderText(/Buscar/), { target: { value: "OPCIONAIS" } });
    expect(names()).toHaveLength(1);
    expect((screen.getByLabelText("Mover Caneca para baixo") as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText("Posição na loja") as HTMLInputElement).disabled).toBe(true);
    fireEvent.change(screen.getByPlaceholderText(/Buscar/), { target: { value: "pr-1" } });
    expect(names()[0]).toContain("Cesta Premium");
  });

  it("vários movimentos seguidos viram UMA gravação, com a ordem final", async () => {
    render(createElement(ProductsList, { products: LIST }));
    fireEvent.click(screen.getByLabelText("Mover Cesta Premium para baixo"));
    fireEvent.click(screen.getByLabelText("Mover Cesta Premium para baixo"));
    const now = names();
    expect([now[0].startsWith("Cesta Pink"), now[1].startsWith("Caneca"), now[2].startsWith("Cesta Premium")]).toEqual([
      true,
      true,
      true,
    ]);
    expect(saveProductOrder).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });
    expect(saveProductOrder).toHaveBeenCalledTimes(1);
    expect(saveProductOrder).toHaveBeenCalledWith(["b", "c", "a"]);
  });

  it("digitar a posição move para lá; os botões nunca ficam travados enquanto salva", async () => {
    render(createElement(ProductsList, { products: LIST }));
    const first = screen.getAllByLabelText("Posição na loja")[0] as HTMLInputElement;
    fireEvent.change(first, { target: { value: "3" } });
    fireEvent.blur(first);
    expect(names()[2]).toContain("Cesta Premium");
    expect((screen.getByLabelText("Mover Caneca para cima") as HTMLButtonElement).disabled).toBe(false);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });
    expect(saveProductOrder).toHaveBeenCalledWith(["b", "c", "a"]);
  });

  it("lista desatualizada (stale) recarrega a página; erro mostra 'tentar de novo' sem desfazer", async () => {
    saveProductOrder.mockResolvedValueOnce({ ok: false, stale: true, error: "x" });
    render(createElement(ProductsList, { products: LIST }));
    fireEvent.click(screen.getByLabelText("Mover Cesta Premium para baixo"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });
    expect(refresh).toHaveBeenCalled();

    saveProductOrder.mockResolvedValueOnce({ ok: false, error: "falhou" });
    fireEvent.click(screen.getByLabelText("Mover Caneca para cima"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });
    expect(screen.getByText(/tentar de novo/i)).toBeTruthy();
    // a ordem que a pessoa montou continua na tela
    expect(names().length).toBe(3);
  });
});
