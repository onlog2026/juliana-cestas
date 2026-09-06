import { describe, expect, it } from "vitest";
import { avaliarCota, contarUsoDoTenantNoMes, inicioDoMesIso, mensagemCotaEstourada } from "@/modules/ai/usage";

/**
 * A cota do assistente de IA é a única coisa entre "a lojista usa o plano
 * dela" e "duas lojas dividem cota sem saber" ou "a cota nunca zera". As três
 * garantias abaixo são testadas direto na função pura, sem precisar de um
 * Supabase de mentira -- é o mesmo espírito de `tests/unit/plans.test.ts`.
 */

describe("inicioDoMesIso", () => {
  it("volta para o dia 1º às 00:00 UTC do mês de `agora`", () => {
    expect(inicioDoMesIso(new Date("2026-09-06T18:30:00Z"))).toBe("2026-09-01T00:00:00.000Z");
    expect(inicioDoMesIso(new Date("2026-09-01T00:00:00.000Z"))).toBe("2026-09-01T00:00:00.000Z");
  });

  it("vira o mês corretamente, inclusive na virada do ano", () => {
    expect(inicioDoMesIso(new Date("2026-01-01T00:00:01Z"))).toBe("2026-01-01T00:00:00.000Z");
    expect(inicioDoMesIso(new Date("2025-12-31T23:59:59Z"))).toBe("2025-12-01T00:00:00.000Z");
    expect(inicioDoMesIso(new Date("2026-01-01T00:00:01Z"))).not.toBe(inicioDoMesIso(new Date("2025-12-31T23:59:59Z")));
  });
});

describe("contarUsoDoTenantNoMes", () => {
  const agora = new Date("2026-09-15T12:00:00Z");

  it("conta só as linhas da loja pedida", () => {
    const rows = [
      { tenant_id: "loja-a", created_at: "2026-09-02T00:00:00.000Z" },
      { tenant_id: "loja-b", created_at: "2026-09-03T00:00:00.000Z" },
      { tenant_id: "loja-a", created_at: "2026-09-10T00:00:00.000Z" },
    ];
    expect(contarUsoDoTenantNoMes(rows, "loja-a", agora)).toBe(2);
    expect(contarUsoDoTenantNoMes(rows, "loja-b", agora)).toBe(1);
    expect(contarUsoDoTenantNoMes(rows, "loja-c-que-nao-existe", agora)).toBe(0);
  });

  it("uso de outra loja nunca soma na loja pedida, mesmo em grande volume", () => {
    const rows = Array.from({ length: 50 }, (_, i) => ({
      tenant_id: "loja-concorrente",
      created_at: `2026-09-${String((i % 27) + 1).padStart(2, "0")}T00:00:00.000Z`,
    }));
    rows.push({ tenant_id: "minha-loja", created_at: "2026-09-05T00:00:00.000Z" });
    expect(contarUsoDoTenantNoMes(rows, "minha-loja", agora)).toBe(1);
  });

  it("só conta o que está DENTRO do mês de `agora` -- o mês anterior não soma", () => {
    const rows = [
      { tenant_id: "loja-a", created_at: "2026-08-31T23:59:59.999Z" }, // mês passado
      { tenant_id: "loja-a", created_at: "2026-09-01T00:00:00.000Z" }, // já é este mês
      { tenant_id: "loja-a", created_at: "2026-09-30T23:59:59.999Z" },
    ];
    expect(contarUsoDoTenantNoMes(rows, "loja-a", agora)).toBe(2);
  });

  it("o mês virar faz a conta recomeçar do zero", () => {
    const rows = [
      { tenant_id: "loja-a", created_at: "2026-09-20T00:00:00.000Z" },
      { tenant_id: "loja-a", created_at: "2026-09-25T00:00:00.000Z" },
    ];
    // Em setembro, as duas contam.
    expect(contarUsoDoTenantNoMes(rows, "loja-a", new Date("2026-09-28T00:00:00Z"))).toBe(2);
    // Em outubro (mês virou), as mesmas linhas de setembro não contam mais.
    expect(contarUsoDoTenantNoMes(rows, "loja-a", new Date("2026-10-01T00:00:01Z"))).toBe(0);
  });
});

describe("avaliarCota", () => {
  it("limite nulo nunca bloqueia, não importa o quanto já foi usado", () => {
    expect(avaliarCota(0, null)).toEqual({ permitido: true, usado: 0, limite: null, restante: null });
    expect(avaliarCota(1_000_000, null)).toEqual({ permitido: true, usado: 1_000_000, limite: null, restante: null });
  });

  it("permite enquanto o uso for menor que o limite", () => {
    expect(avaliarCota(0, 10)).toEqual({ permitido: true, usado: 0, limite: 10, restante: 10 });
    expect(avaliarCota(9, 10)).toEqual({ permitido: true, usado: 9, limite: 10, restante: 1 });
  });

  it("bloqueia assim que o uso alcança o limite (não deixa passar do combinado)", () => {
    expect(avaliarCota(10, 10)).toEqual({ permitido: false, usado: 10, limite: 10, restante: 0 });
    expect(avaliarCota(11, 10)).toEqual({ permitido: false, usado: 11, limite: 10, restante: 0 });
  });

  it("limite zero (plano sem direito a IA) bloqueia desde a primeira chamada", () => {
    expect(avaliarCota(0, 0)).toEqual({ permitido: false, usado: 0, limite: 0, restante: 0 });
  });
});

describe("mensagemCotaEstourada", () => {
  it("devolve uma frase em português com o número do limite", () => {
    const msg = mensagemCotaEstourada(20);
    expect(msg).toContain("20");
    expect(msg.toLowerCase()).toContain("mês");
  });
});
