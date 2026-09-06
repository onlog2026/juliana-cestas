import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { limparCacheDeStatus, vitrineSuspensa } from "@/lib/tenant/storefront-status";

/**
 * Esta função decide se a vitrine de uma loja sai do ar. Ela roda no
 * middleware, ou seja, ANTES de qualquer página — inclusive a home da loja da
 * Juliana, que está em produção.
 *
 * O teste que mais importa aqui não é o que prova que a suspensão funciona: é
 * o que prova que ela NÃO acontece por engano. Banco fora, variável faltando,
 * resposta estranha, loja não encontrada — em todos esses casos a resposta tem
 * que ser "não suspensa", porque derrubar a vitrine de quem está em dia custa
 * o dia inteiro de vendas.
 */

const URL_SUPABASE = "https://projeto.supabase.co";
const LOJA = "a0000000-0000-4000-8000-000000000001";

function json(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), { status, headers: { "content-type": "application/json" } });
}

beforeEach(() => {
  limparCacheDeStatus();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", URL_SUPABASE);
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-de-mentira");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  limparCacheDeStatus();
});

describe("vitrineSuspensa", () => {
  it("loja ativa (a da Juliana) NÃO é suspensa", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json([{ status: "active" }])));
    await expect(vitrineSuspensa(LOJA)).resolves.toBe(false);
  });

  it("loja marcada como suspended é suspensa", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json([{ status: "suspended" }])));
    await expect(vitrineSuspensa(LOJA)).resolves.toBe(true);
  });

  it("banco fora NÃO derruba a vitrine", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("rede caiu");
    }));
    await expect(vitrineSuspensa(LOJA)).resolves.toBe(false);
  });

  it("resposta de erro do banco NÃO derruba a vitrine", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ message: "boom" }, 500)));
    await expect(vitrineSuspensa(LOJA)).resolves.toBe(false);
  });

  it("loja não encontrada NÃO derruba a vitrine", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json([])));
    await expect(vitrineSuspensa(LOJA)).resolves.toBe(false);
  });

  it("sem as variáveis do banco, responde na hora e nem tenta a rede", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const espiao = vi.fn(async () => json([{ status: "suspended" }]));
    vi.stubGlobal("fetch", espiao);

    await expect(vitrineSuspensa(LOJA)).resolves.toBe(false);
    expect(espiao).not.toHaveBeenCalled();
  });

  it("consulta o banco no máximo uma vez por minuto", async () => {
    const espiao = vi.fn(async () => json([{ status: "active" }]));
    vi.stubGlobal("fetch", espiao);

    const agora = Date.now();
    await vitrineSuspensa(LOJA, agora);
    await vitrineSuspensa(LOJA, agora + 30_000);
    expect(espiao).toHaveBeenCalledTimes(1);

    // Passado o minuto, pergunta de novo -- o cache é amortecedor, não verdade.
    await vitrineSuspensa(LOJA, agora + 61_000);
    expect(espiao).toHaveBeenCalledTimes(2);
  });

  it("resultado de erro NÃO entra no cache (a próxima visita pergunta de novo)", async () => {
    let falhar = true;
    const espiao = vi.fn(async () => {
      if (falhar) throw new Error("rede caiu");
      return json([{ status: "suspended" }]);
    });
    vi.stubGlobal("fetch", espiao);

    const agora = Date.now();
    await expect(vitrineSuspensa(LOJA, agora)).resolves.toBe(false);
    falhar = false;
    await expect(vitrineSuspensa(LOJA, agora + 1000)).resolves.toBe(true);
    expect(espiao).toHaveBeenCalledTimes(2);
  });
});
