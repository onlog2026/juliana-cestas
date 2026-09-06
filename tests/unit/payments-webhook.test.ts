import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { POST } from "../../src/app/api/asaas/webhook/[tenantId]/route";

/**
 * O webhook do Asaas é a porta por onde o dinheiro entra. Estes testes provam
 * os quatro comportamentos que, se estiverem errados, custam dinheiro de
 * verdade:
 *
 *   token errado          → 200 (nunca 4xx: o Asaas desabilitaria o webhook)
 *   evento repetido       → 200 SEM reprocessar (senão libera o pedido 2 vezes)
 *   pagamento de outra loja → não encontra (a busca é por id E tenant juntos)
 *   falha ao gravar       → 500 E a linha do ledger apagada (para reenviar)
 */

const SUPABASE_URL = "https://projeto.supabase.co";
const TENANT = "11111111-1111-4111-8111-111111111111";
const OUTRO_TENANT = "22222222-2222-4222-8222-222222222222";
const PEDIDO = "33333333-3333-4333-8333-333333333333";
const TOKEN = "token-secreto-do-webhook-com-32-chars";
const TOKEN_HASH = createHash("sha256").update(TOKEN).digest("hex");

type Chamada = { url: string; method: string; body: unknown };

let chamadas: Chamada[] = [];
/** Respostas programadas por "MÉTODO tabela" (a primeira que casar vence). */
let rotas: Array<{ match: (url: string, method: string) => boolean; responde: () => Response }> = [];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function vazio(status = 201): Response {
  return new Response("", { status });
}

function instalarFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      chamadas.push({
        url,
        method,
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
      });
      const rota = rotas.find((r) => r.match(url, method));
      if (rota) return rota.responde();
      return vazio(201);
    })
  );
}

function rota(method: string, trecho: string, responde: () => Response) {
  rotas.push({ match: (url, m) => m === method && url.includes(trecho), responde });
}

/** Cenário completo em que tudo dá certo. Cada teste sobrescreve o que quer. */
function cenarioFeliz() {
  rota("GET", "tenant_payment_accounts", () => json([{ webhook_token_hash: TOKEN_HASH }]));
  rota("POST", "webhook_events", () => vazio(201));
  rota("GET", "payments?asaas_payment_id", () =>
    json([{ id: "pag-1", order_id: PEDIDO, status: "pending", amount_cents: 18990 }])
  );
  rota("PATCH", "payments?id=", () => json([{ id: "pag-1" }]));
  rota("PATCH", "orders?id=", () => json([{ id: PEDIDO }]));
  rota("POST", "order_events", () => vazio(201));
  // Sem e-mail do comprador: o aviso por e-mail sai do caminho sem tocar na Resend.
  rota("GET", "orders?id=", () => json([{ number: 1001, buyer_name: "Ana", buyer_email: null, total_cents: 18990 }]));
  rota("PATCH", "webhook_events", () => vazio(200));
}

function requisicao(opcoes?: { token?: string | null; evento?: string; paymentId?: string; eventId?: string }) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  const token = opcoes?.token === undefined ? TOKEN : opcoes.token;
  if (token) headers["asaas-access-token"] = token;

  return new Request(`https://loja.com.br/api/asaas/webhook/${TENANT}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      id: opcoes?.eventId ?? "evt_abc123",
      event: opcoes?.evento ?? "PAYMENT_RECEIVED",
      dateCreated: "2026-09-06 10:00:00",
      payment: {
        object: "payment",
        id: opcoes?.paymentId ?? "pay_999",
        status: "RECEIVED",
        value: 189.9,
        billingType: "PIX",
        externalReference: PEDIDO,
      },
    }),
  });
}

const ctx = (tenantId = TENANT) => ({ params: Promise.resolve({ tenantId }) });

beforeEach(() => {
  chamadas = [];
  rotas = [];
  process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-de-teste";
  delete process.env.RESEND_API_KEY;
  delete process.env.EMAIL_FROM;
  instalarFetch();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("webhook — caminho feliz", () => {
  it("PAYMENT_RECEIVED marca o pagamento e o pedido como pagos", async () => {
    cenarioFeliz();
    const res = await POST(requisicao(), ctx());
    expect(res.status).toBe(200);

    const patchPagamento = chamadas.find((c) => c.method === "PATCH" && c.url.includes("payments?id="));
    expect(patchPagamento).toBeTruthy();
    expect((patchPagamento!.body as Record<string, unknown>).status).toBe("paid");

    const patchPedido = chamadas.find((c) => c.method === "PATCH" && c.url.includes("orders?id="));
    expect(patchPedido).toBeTruthy();
    expect((patchPedido!.body as Record<string, unknown>).status).toBe("pago");
    expect((patchPedido!.body as Record<string, unknown>).payment_status).toBe("paid");
    // Só sai de "aguardando pagamento"/"novo": pedido já entregue não volta.
    expect(patchPedido!.url).toContain("status=in.(novo,aguardando_pagamento)");

    // Histórico do pedido registrado como vindo do webhook.
    const evento = chamadas.find((c) => c.method === "POST" && c.url.includes("order_events"));
    expect((evento!.body as Record<string, unknown>).actor).toBe("webhook");

    // Ledger confirmado no fim (reserva → processa → confirma).
    const confirma = chamadas.find((c) => c.method === "PATCH" && c.url.includes("webhook_events"));
    expect((confirma!.body as Record<string, unknown>).processed_at).toBeTruthy();
  });

  it("não grava dados de cartão no `raw`", async () => {
    cenarioFeliz();
    const req = new Request(`https://loja.com.br/api/asaas/webhook/${TENANT}`, {
      method: "POST",
      headers: { "content-type": "application/json", "asaas-access-token": TOKEN },
      body: JSON.stringify({
        id: "evt_cartao",
        event: "PAYMENT_CONFIRMED",
        payment: {
          id: "pay_999",
          status: "CONFIRMED",
          billingType: "CREDIT_CARD",
          externalReference: PEDIDO,
          creditCard: { creditCardNumber: "4111111111111111" },
        },
      }),
    });
    await POST(req, ctx());

    const patch = chamadas.find((c) => c.method === "PATCH" && c.url.includes("payments?id="));
    const raw = JSON.stringify((patch!.body as Record<string, unknown>).raw);
    expect(raw).not.toContain("4111111111111111");
    expect(raw).not.toContain("creditCard");
  });
});

describe("webhook — token errado responde 200 e não faz nada", () => {
  it("token diferente do cadastrado: 200 sem tocar em pagamento nem pedido", async () => {
    cenarioFeliz();
    const res = await POST(requisicao({ token: "token-errado-de-um-atacante-qualquer" }), ctx());

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ motivo: "token_invalido" });

    expect(chamadas.some((c) => c.url.includes("webhook_events") && c.method === "POST")).toBe(false);
    expect(chamadas.some((c) => c.url.includes("payments") && c.method === "PATCH")).toBe(false);
    expect(chamadas.some((c) => c.url.includes("orders") && c.method === "PATCH")).toBe(false);
  });

  it("sem nenhum token: 200 e nada acontece", async () => {
    cenarioFeliz();
    const res = await POST(requisicao({ token: null }), ctx());
    expect(res.status).toBe(200);
    expect(chamadas.some((c) => c.method === "PATCH")).toBe(false);
  });
});

describe("webhook — idempotência", () => {
  it("evento repetido (ledger devolve 409): 200 e NADA é reprocessado", async () => {
    rota("GET", "tenant_payment_accounts", () => json([{ webhook_token_hash: TOKEN_HASH }]));
    rota("POST", "webhook_events", () => json({ code: "23505" }, 409));
    // Estas rotas existem justamente para provar que NÃO são chamadas.
    rota("GET", "payments?asaas_payment_id", () =>
      json([{ id: "pag-1", order_id: PEDIDO, status: "pending", amount_cents: 18990 }])
    );
    rota("PATCH", "orders?id=", () => json([{ id: PEDIDO }]));

    const res = await POST(requisicao(), ctx());

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ motivo: "evento_repetido" });
    expect(chamadas.some((c) => c.url.includes("payments"))).toBe(false);
    expect(chamadas.some((c) => c.method === "PATCH" && c.url.includes("orders"))).toBe(false);
  });

  it("um evento já pago que chega de novo por outra via não libera duas vezes", async () => {
    cenarioFeliz();
    // Mesmo evento, id diferente (o Asaas manda RECEIVED e CONFIRMED).
    rotas = rotas.filter((r) => !r.match(`${SUPABASE_URL}/rest/v1/payments?asaas_payment_id=x`, "GET"));
    rota("GET", "payments?asaas_payment_id", () =>
      json([{ id: "pag-1", order_id: PEDIDO, status: "paid", amount_cents: 18990 }])
    );

    const res = await POST(requisicao({ eventId: "evt_segundo" }), ctx());

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ motivo: "ja_estava_pago" });
    expect(chamadas.some((c) => c.method === "PATCH" && c.url.includes("orders"))).toBe(false);
  });
});

describe("webhook — isolamento entre lojas", () => {
  it("pagamento de outra loja não é encontrado (busca por id E tenant juntos)", async () => {
    rota("GET", "tenant_payment_accounts", () => json([{ webhook_token_hash: TOKEN_HASH }]));
    rota("POST", "webhook_events", () => vazio(201));
    // O banco devolve vazio porque o filtro de tenant não casa.
    rota("GET", "payments?asaas_payment_id", () => json([]));
    // E o pedido do externalReference também é de outra loja.
    rota("GET", "orders?id=", () => json([]));
    rota("PATCH", "webhook_events", () => vazio(200));

    const res = await POST(requisicao(), ctx());

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ motivo: "cobranca_desconhecida" });
    expect(chamadas.some((c) => c.method === "PATCH" && c.url.includes("orders"))).toBe(false);

    // A consulta do pagamento carrega OS DOIS filtros — é isto que impede uma
    // loja de confirmar o pagamento da outra.
    const busca = chamadas.find((c) => c.method === "GET" && c.url.includes("payments?asaas_payment_id"));
    expect(busca!.url).toContain("asaas_payment_id=eq.pay_999");
    expect(busca!.url).toContain(`tenant_id=eq.${TENANT}`);
  });

  it("a consulta da conta usa o tenant da URL, não o do corpo", async () => {
    cenarioFeliz();
    await POST(requisicao(), ctx(OUTRO_TENANT));
    const busca = chamadas.find((c) => c.url.includes("tenant_payment_accounts"));
    expect(busca!.url).toContain(`tenant_id=eq.${OUTRO_TENANT}`);
  });
});

describe("webhook — falha ao gravar: 500 e ledger limpo", () => {
  it("falha ao atualizar o pagamento: devolve 500 E apaga a linha do ledger", async () => {
    rota("GET", "tenant_payment_accounts", () => json([{ webhook_token_hash: TOKEN_HASH }]));
    rota("POST", "webhook_events", () => vazio(201));
    rota("GET", "payments?asaas_payment_id", () =>
      json([{ id: "pag-1", order_id: PEDIDO, status: "pending", amount_cents: 18990 }])
    );
    rota("PATCH", "payments?id=", () => json({ message: "banco indisponível" }, 500));
    rota("DELETE", "webhook_events", () => vazio(200));

    const res = await POST(requisicao(), ctx());

    expect(res.status).toBe(500);
    const apagou = chamadas.find((c) => c.method === "DELETE" && c.url.includes("webhook_events"));
    expect(apagou).toBeTruthy();
    expect(apagou!.url).toContain("event_id=eq.evt_abc123");
    // Nunca marca como processado o que não processou.
    expect(chamadas.some((c) => c.method === "PATCH" && c.url.includes("webhook_events"))).toBe(false);
  });

  it("PATCH que não pegou linha nenhuma também é falha (não mente 'pago')", async () => {
    rota("GET", "tenant_payment_accounts", () => json([{ webhook_token_hash: TOKEN_HASH }]));
    rota("POST", "webhook_events", () => vazio(201));
    rota("GET", "payments?asaas_payment_id", () =>
      json([{ id: "pag-1", order_id: PEDIDO, status: "pending", amount_cents: 18990 }])
    );
    // 200 com lista vazia: o PostgREST responde assim quando o WHERE não casa.
    rota("PATCH", "payments?id=", () => json([]));
    rota("DELETE", "webhook_events", () => vazio(200));

    const res = await POST(requisicao(), ctx());

    expect(res.status).toBe(500);
    expect(chamadas.some((c) => c.method === "DELETE" && c.url.includes("webhook_events"))).toBe(true);
  });

  it("falha ao registrar o evento do pedido também devolve 500 e limpa o ledger", async () => {
    cenarioFeliz();
    rotas.unshift({
      match: (url, m) => m === "POST" && url.includes("order_events"),
      responde: () => json({ message: "erro" }, 500),
    });
    rota("DELETE", "webhook_events", () => vazio(200));

    const res = await POST(requisicao(), ctx());
    expect(res.status).toBe(500);
    expect(chamadas.some((c) => c.method === "DELETE" && c.url.includes("webhook_events"))).toBe(true);
  });
});

describe("webhook — ambiente e loja sem conta", () => {
  it("sem service role no ambiente: 500 (fail-closed, o Asaas reenvia)", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const res = await POST(requisicao(), ctx());
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ motivo: "ambiente_incompleto" });
    expect(chamadas).toHaveLength(0);
  });

  it("loja sem conta conectada: 200 (nunca 404, senão o Asaas desliga o webhook)", async () => {
    rota("GET", "tenant_payment_accounts", () => json([]));
    const res = await POST(requisicao(), ctx());

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ motivo: "loja_sem_conta" });
    expect(chamadas.some((c) => c.url.includes("webhook_events"))).toBe(false);
  });

  it("banco fora ao consultar a conta: 500 para o Asaas reenviar depois", async () => {
    rota("GET", "tenant_payment_accounts", () => json({ message: "indisponível" }, 503));
    const res = await POST(requisicao(), ctx());
    expect(res.status).toBe(500);
  });

  it("evento que não muda situação nenhuma é aceito e ignorado", async () => {
    cenarioFeliz();
    const res = await POST(requisicao({ evento: "PAYMENT_CREATED" }), ctx());
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ motivo: "evento_ignorado" });
    expect(chamadas.some((c) => c.method === "PATCH" && c.url.includes("orders"))).toBe(false);
  });
});

describe("webhook — situações que não são pagamento", () => {
  it("OVERDUE atualiza a situação sem mudar o status do pedido", async () => {
    cenarioFeliz();
    const res = await POST(requisicao({ evento: "PAYMENT_OVERDUE", eventId: "evt_overdue" }), ctx());

    expect(res.status).toBe(200);
    const patchPedido = chamadas.find((c) => c.method === "PATCH" && c.url.includes("orders?id="));
    expect((patchPedido!.body as Record<string, unknown>).payment_status).toBe("overdue");
    expect((patchPedido!.body as Record<string, unknown>).status).toBeUndefined();
  });

  it("REFUNDED marca o pedido como reembolsado", async () => {
    cenarioFeliz();
    const res = await POST(requisicao({ evento: "PAYMENT_REFUNDED", eventId: "evt_refund" }), ctx());

    expect(res.status).toBe(200);
    const patchPedido = chamadas.find((c) => c.method === "PATCH" && c.url.includes("orders?id="));
    expect((patchPedido!.body as Record<string, unknown>).status).toBe("reembolsado");
  });
});
