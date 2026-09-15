import { describe, expect, it } from "vitest";
import { buildStoreNewOrderText, type StoreNewOrderInput } from "@/modules/notifications/templates/store-new-order";
import { formatCents } from "@/lib/money";

function baseInput(overrides: Partial<StoreNewOrderInput> = {}): StoreNewOrderInput {
  return {
    orderNumber: 42,
    buyerName: "Marina Souza",
    buyerPhone: "61999999999",
    recipientName: "João Souza",
    items: [
      { name: "Cesta Encanto", unit_price_cents: 17990, qty: 1 },
      { name: "Vinho tinto", unit_price_cents: 4990, qty: 1 },
    ],
    deliveryType: "delivery",
    addressLine: "Quadra QSB AE, 12 — Taguatinga Sul",
    zoneName: "Taguatinga Norte/Sul",
    deliveryDateLabel: "sexta-feira, 20/09",
    slotLabel: "14:00 e 14:30",
    cardRecipient: "João",
    cardMessage: "Feliz aniversário!",
    totalCents: 22980,
    orderUrl: "https://julianacesta.com.br/pedido/abc?t=xyz",
    ...overrides,
  };
}

describe("buildStoreNewOrderText", () => {
  it("inclui número do pedido, cliente, itens, entrega, data, total e link", () => {
    const texto = buildStoreNewOrderText(baseInput());

    expect(texto).toContain("Novo pedido #42");
    expect(texto).toContain("Marina Souza");
    expect(texto).toContain("(61) 99999-9999");
    expect(texto).toContain("João Souza");
    expect(texto).toContain(`• 1x Cesta Encanto — ${formatCents(17990)}`);
    expect(texto).toContain(`• 1x Vinho tinto — ${formatCents(4990)}`);
    expect(texto).toContain("Quadra QSB AE, 12 — Taguatinga Sul");
    expect(texto).toContain("(Taguatinga Norte/Sul)");
    expect(texto).toContain("sexta-feira, 20/09");
    expect(texto).toContain("14:00 e 14:30");
    expect(texto).toContain("Feliz aniversário!");
    expect(texto).toContain(formatCents(22980));
    expect(texto).toContain("https://julianacesta.com.br/pedido/abc?t=xyz");
  });

  it("retirada na loja não mostra endereço nem zona", () => {
    const texto = buildStoreNewOrderText(
      baseInput({ deliveryType: "pickup", addressLine: null, zoneName: null })
    );
    expect(texto).toContain("Retirada na loja");
    expect(texto).not.toContain("Taguatinga");
  });

  it("soma quantidade x preço unitário por item", () => {
    const texto = buildStoreNewOrderText(
      baseInput({ items: [{ name: "Cesta Afeto", unit_price_cents: 18990, qty: 2 }] })
    );
    expect(texto).toContain(`• 2x Cesta Afeto — ${formatCents(37980)}`);
  });
});
