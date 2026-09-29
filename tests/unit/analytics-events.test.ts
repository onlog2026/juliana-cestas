// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { events, sumValue, toGaItems, track, trackOnce } from "@/modules/analytics/events";

const gtag = vi.fn();
beforeEach(() => {
  gtag.mockReset();
  sessionStorage.clear();
  (window as unknown as { gtag?: unknown }).gtag = gtag;
  Object.defineProperty(navigator, "doNotTrack", { value: null, configurable: true });
});
afterEach(() => {
  delete (window as unknown as { gtag?: unknown }).gtag;
});

describe("analytics events", () => {
  it("sem Google Analytics carregado não faz nada e não lança", () => {
    delete (window as unknown as { gtag?: unknown }).gtag;
    expect(track("view_item")).toBe(false);
    expect(() => events.addToCart({ id: "1", name: "Cesta", price: 10 })).not.toThrow();
  });

  it("respeita 'Não rastrear' do navegador", () => {
    Object.defineProperty(navigator, "doNotTrack", { value: "1", configurable: true });
    expect(track("view_item")).toBe(false);
    expect(gtag).not.toHaveBeenCalled();
  });

  it("view_item e add_to_cart mandam só dados da cesta (preço em reais)", () => {
    events.viewItem({ id: "p1", name: "Cesta Lady", price: 429 });
    expect(gtag).toHaveBeenCalledWith("event", "view_item", {
      currency: "BRL",
      value: 429,
      items: [{ item_id: "p1", item_name: "Cesta Lady", price: 429, quantity: 1 }],
    });
    events.addToCart({ id: "p2", name: "Cesta Pink", price: 229.9 });
    expect(gtag.mock.calls[1][1]).toBe("add_to_cart");
  });

  it("purchase conta UMA vez por pedido, mesmo chamado de novo", () => {
    expect(events.purchase(1012, 244, [{ id: "p", name: "Cesta", price: 244 }])).toBe(true);
    expect(events.purchase(1012, 244, [{ id: "p", name: "Cesta", price: 244 }])).toBe(false);
    expect(events.purchase(1013, 100, [{ id: "p", name: "Cesta", price: 100 }])).toBe(true);
    expect(gtag).toHaveBeenCalledTimes(2);
    expect(gtag.mock.calls[0][2].transaction_id).toBe("1012");
  });

  it("nenhum evento carrega campo pessoal", () => {
    events.purchase(9, 50, [{ id: "p", name: "Cesta", price: 50 }]);
    const params = JSON.stringify(gtag.mock.calls[0][2]).toLowerCase();
    for (const forbidden of ["email", "phone", "telefone", "cpf", "address", "endereco", "buyer", "name\":\"adriano"]) {
      expect(params).not.toContain(forbidden);
    }
  });

  it("soma e itens", () => {
    expect(sumValue([{ id: "a", name: "A", price: 10.5, quantity: 2 }, { id: "b", name: "B", price: 5 }])).toBe(26);
    expect(toGaItems([{ id: "a", name: "A", price: 10.555 }])[0].price).toBe(10.56);
  });

  it("trackOnce sem envio possível não marca como enviado (tenta de novo depois)", () => {
    delete (window as unknown as { gtag?: unknown }).gtag;
    expect(trackOnce("k", "x")).toBe(false);
    (window as unknown as { gtag?: unknown }).gtag = gtag;
    expect(trackOnce("k", "x")).toBe(true);
  });
});
