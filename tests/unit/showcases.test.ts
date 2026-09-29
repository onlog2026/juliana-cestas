import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Product } from "@/modules/catalog/product";
import { buildShowcases, pickTop } from "@/modules/catalog/showcase-logic";

const P = (n: number) => ({ id: `id-${n}`, slug: `p${n}`, name: `P${n}` }) as unknown as Product;
const products = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(P);
const m = (o: Record<string, number>) => new Map(Object.entries(o));

describe("vitrines", () => {
  it("menos de 4 produtos com venda: vitrine oculta", () => {
    const s = buildShowcases(products, m({ "id-1": 3, "id-2": 2, "id-3": 1 }), m({}));
    expect(s.bought).toEqual([]);
  });
  it("ordena por contagem, empate pela ordem da loja, no máximo 10 (todos os com contagem)", () => {
    const top = pickTop(products, m({ "id-3": 5, "id-1": 5, "id-2": 9, "id-4": 1, "id-5": 1, "id-6": 1 }));
    expect(top.map((p) => p.id)).toEqual(["id-2", "id-1", "id-3", "id-4", "id-5", "id-6"]);
  });
  it("'Mais clicados' não repete os de 'Mais comprados'", () => {
    const sold = m({ "id-1": 4, "id-2": 3, "id-3": 2, "id-4": 1 });
    const clicks = m({ "id-1": 9, "id-2": 9, "id-5": 8, "id-6": 7, "id-7": 6, "id-8": 5 });
    const s = buildShowcases(products, sold, clicks);
    expect(s.bought.map((p) => p.id)).toEqual(["id-1", "id-2", "id-3", "id-4"]);
    expect(s.clicked.map((p) => p.id)).toEqual(["id-5", "id-6", "id-7", "id-8"]);
  });
  it("ignora contagem de produto que não está ativo/listado", () => {
    expect(pickTop(products, m({ "id-999": 50 }))).toEqual([]);
  });
});

const rpc = vi.fn();
const checkRateLimit = vi.fn(async () => true);
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ rpc }) }));
vi.mock("@/lib/security/rate-limit", () => ({ checkRateLimit: (...a: unknown[]) => checkRateLimit(...(a as [])), clientIp: () => "1.1.1.1" }));

describe("POST /api/track/product-click", () => {
  const ID = "384b79b7-73fd-431e-8661-37cf0cc9c42c";
  beforeEach(() => {
    rpc.mockReset();
    rpc.mockResolvedValue({ error: null });
    checkRateLimit.mockClear();
    checkRateLimit.mockResolvedValue(true);
    delete process.env.TRACK_DRY_RUN;
  });
  async function call(over: { origin?: string | null; ua?: string; cookie?: string; body?: unknown } = {}) {
    const { POST } = await import("@/app/api/track/product-click/route");
    const headers: Record<string, string> = { "user-agent": over.ua ?? "Mozilla/5.0 iPhone", host: "loja.test" };
    if (over.origin !== null) headers.origin = over.origin ?? "https://loja.test";
    if (over.cookie) headers.cookie = over.cookie;
    const res = await POST(
      new Request("https://loja.test/api/track/product-click", {
        method: "POST",
        headers,
        body: JSON.stringify(over.body ?? { productId: ID }),
      })
    );
    expect(res.status).toBe(204);
  }
  it("clique válido grava uma vez", async () => {
    await call();
    expect(rpc).toHaveBeenCalledWith("increment_product_click", { p_product: ID });
  });
  it("ignora: outra origem, sem origem, robô, equipe logada, id inválido", async () => {
    await call({ origin: "https://outro.com" });
    await call({ origin: null });
    await call({ ua: "Googlebot/2.1" });
    await call({ cookie: "sb-abc-auth-token=x" });
    await call({ body: { productId: "nao-e-uuid" } });
    expect(rpc).not.toHaveBeenCalled();
  });
  it("excesso por IP e modo de teste não gravam; erro do banco continua 204", async () => {
    checkRateLimit.mockResolvedValue(false);
    await call();
    checkRateLimit.mockResolvedValue(true);
    process.env.TRACK_DRY_RUN = "1";
    await call();
    expect(rpc).not.toHaveBeenCalled();
    delete process.env.TRACK_DRY_RUN;
    rpc.mockRejectedValue(new Error("banco caiu"));
    await call();
  });
});
