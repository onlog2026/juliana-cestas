import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "../../src/app/api/asaas/platform-webhook/route";

/**
 * Webhook da MENSALIDADE da plataforma. Provas que evitam cobrança dupla e loja
 * bloqueada por engano:
 *  - checkout abandonado (assinatura que nunca foi paga) NÃO atrasa a loja;
 *  - troca de plano: pagou a nova → cancela a antiga no Asaas;
 *  - SUBSCRIPTION_DELETED da antiga (que nós mesmos cancelamos) NÃO cancela a loja;
 *  - evento de assinatura (SUBSCRIPTION_*) vem no topo, não em `payment`.
 */
const TOKEN = "token-da-plataforma-com-32-caracteres!!";
type Chamada = { url: string; method: string; body?: unknown };
let chamadas: Chamada[] = [];
let loja: Record<string, unknown>;

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json" } });

beforeEach(() => {
  chamadas = [];
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://projeto.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-teste";
  process.env.PLATFORM_ASAAS_WEBHOOK_TOKEN = TOKEN;
  process.env.PLATFORM_ASAAS_API_KEY = "chave-asaas-teste-123";
  process.env.PLATFORM_ASAAS_ENV = "sandbox";
  loja = {
    id: "t-1", slug: "loja-x", subscription_status: "active", subscription_plan: "start",
    paid_until: new Date(Date.now() - 86400000).toISOString(), asaas_subscription_id: "sub_atual",
    pending_plan_id: null, pending_expected_cents: null, pending_cycle: null,
  };
  vi.stubGlobal("fetch", vi.fn(async (input: string, init?: RequestInit) => {
    const url = String(input); const method = init?.method ?? "GET";
    chamadas.push({ url, method, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    if (url.includes("/rest/v1/tenants") && method === "GET") return json([loja]);
    if (url.includes("/rest/v1/tenants") && method === "PATCH") return json([{ id: "t-1" }]);
    if (url.includes("asaas.com") && method === "DELETE") return json({ deleted: true });
    return new Response("", { status: 201 });
  }));
});
afterEach(() => vi.unstubAllGlobals());

function evento(corpo: Record<string, unknown>) {
  return new Request("https://x/api/asaas/platform-webhook", { method: "POST", headers: { "asaas-access-token": TOKEN }, body: JSON.stringify(corpo) });
}
const ref = JSON.stringify({ type: "plan", tenant: "loja-x", plan: "pro", cycle: "MONTHLY" });
const patches = () => chamadas.filter((c) => c.method === "PATCH" && c.url.includes("/tenants"));
const cancelamentos = () => chamadas.filter((c) => c.method === "DELETE" && c.url.includes("asaas.com"));

describe("webhook da assinatura da plataforma", () => {
  it("checkout abandonado: vencimento de assinatura que NÃO é a atual é ignorado", async () => {
    const r = await POST(evento({ id: "e1", event: "PAYMENT_OVERDUE", payment: { id: "p1", subscription: "sub_nunca_paga", externalReference: ref, value: 149 } }));
    expect(((await r.json()) as { motivo: string }).motivo).toBe("ignorado_assinatura_nao_atual");
    expect(patches()).toHaveLength(0);
  });

  it("troca de plano: pagou a nova → salva a nova e cancela a antiga no Asaas", async () => {
    loja.pending_plan_id = "pro"; loja.pending_expected_cents = 14900;
    const r = await POST(evento({ id: "e2", event: "PAYMENT_CONFIRMED", payment: { id: "p2", subscription: "sub_nova", externalReference: ref, value: 149 } }));
    expect(((await r.json()) as { motivo: string }).motivo).toBe("assinatura_ativa");
    const p = patches()[0].body as Record<string, unknown>;
    expect(p.asaas_subscription_id).toBe("sub_nova");
    expect(p.subscription_plan).toBe("pro");
    expect(cancelamentos()).toHaveLength(1);
    expect(cancelamentos()[0].url).toContain("sub_atual");
  });

  it("1º pagamento (sem assinatura anterior): ativa e não cancela nada", async () => {
    loja.asaas_subscription_id = null;
    await POST(evento({ id: "e3", event: "PAYMENT_RECEIVED", payment: { id: "p3", subscription: "sub_primeira", externalReference: ref, value: 149 } }));
    expect(cancelamentos()).toHaveLength(0);
    expect((patches()[0].body as Record<string, unknown>).asaas_subscription_id).toBe("sub_primeira");
  });

  it("renovação da MESMA assinatura: ativa e não cancela nada", async () => {
    await POST(evento({ id: "e4", event: "PAYMENT_RECEIVED", payment: { id: "p4", subscription: "sub_atual", externalReference: ref, value: 149 } }));
    expect(cancelamentos()).toHaveLength(0);
  });

  it("SUBSCRIPTION_DELETED da assinatura ANTIGA (cancelada por nós) não cancela a loja", async () => {
    const r = await POST(evento({ id: "e5", event: "SUBSCRIPTION_DELETED", subscription: { id: "sub_antiga_velha", externalReference: ref } }));
    expect(((await r.json()) as { motivo: string }).motivo).toBe("ignorado_assinatura_nao_atual");
    expect(patches()).toHaveLength(0);
  });

  it("SUBSCRIPTION_DELETED da assinatura ATUAL (evento no topo, não em payment) cancela e libera o id", async () => {
    const r = await POST(evento({ id: "e6", event: "SUBSCRIPTION_DELETED", subscription: { id: "sub_atual", externalReference: ref } }));
    expect(((await r.json()) as { motivo: string }).motivo).toBe("assinatura_canceled");
    expect(patches()[0].body).toMatchObject({ subscription_status: "canceled", asaas_subscription_id: null });
  });

  it("cobrança vencida da assinatura ATUAL e fora da validade: loja vira atrasada", async () => {
    const r = await POST(evento({ id: "e7", event: "PAYMENT_OVERDUE", payment: { id: "p7", subscription: "sub_atual", externalReference: ref, value: 149 } }));
    expect(((await r.json()) as { motivo: string }).motivo).toBe("assinatura_atrasada");
  });

  it("token errado: 200 sem tocar no banco", async () => {
    const r = await POST(new Request("https://x", { method: "POST", headers: { "asaas-access-token": "errado" }, body: JSON.stringify({ id: "e8", event: "PAYMENT_RECEIVED" }) }));
    expect(r.status).toBe(200);
    expect(chamadas).toHaveLength(0);
  });
});
