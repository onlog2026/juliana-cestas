import { describe, expect, it, vi } from "vitest";
import {
  createAsaasClient,
  redigir,
  centsToReais,
  reaisToCents,
  AsaasError,
  ASAAS_BASE_URL,
  MIN_PAYMENT_CENTS,
} from "@/modules/payments/asaas-client";

const CHAVE = "$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjAwMDAwMA==";

function respostaJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("asaas-client — a chave nunca vaza", () => {
  it("redige a chave exata de qualquer texto", () => {
    const texto = `falhou usando ${CHAVE} no header`;
    expect(redigir(texto, CHAVE)).not.toContain(CHAVE);
    expect(redigir(texto, CHAVE)).toContain("[chave omitida]");
  });

  it("redige QUALQUER coisa com formato de chave do Asaas, mesmo sem saber qual é", () => {
    const outra = "$aact_hmlg_ABCDEFGHIJKLMNOPQRSTUVXZ0123456789";
    expect(redigir(`erro: ${outra}`)).not.toContain(outra);
  });

  it("erro 401 do Asaas com a chave dentro do corpo não devolve a chave na mensagem", async () => {
    const fetchImpl = vi.fn(async (_url: string, _init?: RequestInit) =>
      respostaJson(
        {
          errors: [
            { code: "invalid_access_token", description: `A chave de API fornecida é inválida: ${CHAVE}` },
          ],
        },
        401
      )
    );
    const client = createAsaasClient({ apiKey: CHAVE, environment: "production", fetchImpl });

    await expect(client.getAccount()).rejects.toThrow(AsaasError);
    try {
      await client.getAccount();
    } catch (e) {
      const erro = e as AsaasError;
      expect(erro.message).not.toContain(CHAVE);
      expect(erro.message).toContain("[chave omitida]");
      expect(erro.status).toBe(401);
    }
  });

  it("a chave nunca aparece no objeto de erro serializado", async () => {
    const fetchImpl = vi.fn(async (_url: string, _init?: RequestInit) => new Response(`erro cru com ${CHAVE}`, { status: 500 }));
    const client = createAsaasClient({ apiKey: CHAVE, environment: "production", fetchImpl });

    try {
      await client.getPayment("pay_1");
      throw new Error("deveria ter lançado");
    } catch (e) {
      const erro = e as AsaasError;
      const serializado = JSON.stringify({ message: erro.message, code: erro.code, status: erro.status });
      expect(serializado).not.toContain(CHAVE);
      expect(serializado).not.toContain("$aact_");
    }
  });
});

describe("asaas-client — autenticação e endereços", () => {
  it("manda a chave no header access_token (nunca Authorization Bearer)", async () => {
    const fetchImpl = vi.fn(async (_url: string, _init?: RequestInit) => respostaJson({ name: "Loja" }));
    const client = createAsaasClient({ apiKey: CHAVE, environment: "production", fetchImpl });
    await client.getAccount();

    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers.access_token).toBe(CHAVE);
    expect(headers.Authorization).toBeUndefined();
  });

  it("usa a base de produção e a de sandbox conforme o ambiente", async () => {
    const fetchImpl = vi.fn(async (_url: string, _init?: RequestInit) => respostaJson({}));

    await createAsaasClient({ apiKey: CHAVE, environment: "production", fetchImpl }).getAccount();
    expect(fetchImpl.mock.calls[0][0]).toBe(`${ASAAS_BASE_URL.production}/myAccount/commercialInfo`);

    await createAsaasClient({ apiKey: CHAVE, environment: "sandbox", fetchImpl }).getAccount();
    expect(fetchImpl.mock.calls[1][0]).toBe(`${ASAAS_BASE_URL.sandbox}/myAccount/commercialInfo`);
  });
});

describe("asaas-client — resposta lida como texto antes do JSON", () => {
  it("HTML de erro vira frase em português, não 'Unexpected token <'", async () => {
    const fetchImpl = vi.fn(
      async (_url: string, _init?: RequestInit) => new Response("<html><body>502 Bad Gateway</body></html>", { status: 502 })
    );
    const client = createAsaasClient({ apiKey: CHAVE, environment: "production", fetchImpl });

    await expect(client.getAccount()).rejects.toThrow(/indisponível/i);
  });

  it("HTML com status 200 também não estoura de forma inútil", async () => {
    const fetchImpl = vi.fn(async (_url: string, _init?: RequestInit) => new Response("<html>manutenção</html>", { status: 200 }));
    const client = createAsaasClient({ apiKey: CHAVE, environment: "production", fetchImpl });

    await expect(client.getPayment("pay_1")).rejects.toThrow(/formato inesperado/i);
  });

  it("corpo vazio com 200 não quebra", async () => {
    const fetchImpl = vi.fn(async (_url: string, _init?: RequestInit) => new Response("", { status: 200 }));
    const client = createAsaasClient({ apiKey: CHAVE, environment: "production", fetchImpl });
    await expect(client.deleteWebhook("hook_1")).resolves.toEqual({});
  });
});

describe("asaas-client — dinheiro", () => {
  it("converte centavos para reais sem erro de ponto flutuante", () => {
    expect(centsToReais(500)).toBe(5);
    expect(centsToReais(18990)).toBe(189.9);
    expect(centsToReais(1)).toBe(0.01);
    expect(centsToReais(70)).toBe(0.7);
  });

  it("converte reais do Asaas de volta para centavos", () => {
    expect(reaisToCents(189.9)).toBe(18990);
    expect(reaisToCents("5.00")).toBe(500);
    expect(reaisToCents("abacaxi")).toBeNull();
  });

  it("recusa valor abaixo de R$ 5,00 ANTES de chamar a API, em português", async () => {
    const fetchImpl = vi.fn(async (_url: string, _init?: RequestInit) => respostaJson({ id: "pay_1" }));
    const client = createAsaasClient({ apiKey: CHAVE, environment: "production", fetchImpl });

    await expect(
      client.createPayment({
        customerId: "cus_1",
        billingType: "PIX",
        amountCents: MIN_PAYMENT_CENTS - 1,
        dueDate: "2026-09-06",
      })
    ).rejects.toThrow(/valor mínimo para cobrança é R\$ 5,00/i);

    // O ponto principal: nem chegou a bater no Asaas.
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("manda o valor em REAIS no corpo (a API do Asaas não usa centavos)", async () => {
    const fetchImpl = vi.fn(async (_url: string, _init?: RequestInit) => respostaJson({ id: "pay_1", status: "PENDING" }));
    const client = createAsaasClient({ apiKey: CHAVE, environment: "production", fetchImpl });

    await client.createPayment({
      customerId: "cus_1",
      billingType: "PIX",
      amountCents: 18990,
      dueDate: "2026-09-06",
      externalReference: "pedido-1",
    });

    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${ASAAS_BASE_URL.production}/payments`);
    const corpo = JSON.parse(String(init.body));
    expect(corpo.value).toBe(189.9);
    expect(corpo.billingType).toBe("PIX");
    expect(corpo.externalReference).toBe("pedido-1");
  });
});

describe("asaas-client — webhook", () => {
  it("cria o webhook com authToken, sendType SEQUENTIALLY e eventos de pagamento", async () => {
    const fetchImpl = vi.fn(async (_url: string, _init?: RequestInit) => respostaJson({ id: "hook_1", hasAuthToken: true }));
    const client = createAsaasClient({ apiKey: CHAVE, environment: "production", fetchImpl });

    const token = "a".repeat(32);
    await client.createWebhook({
      name: "Loja teste",
      url: "https://exemplo.com.br/api/asaas/webhook/abc",
      email: "loja@exemplo.com.br",
      authToken: token,
      events: ["PAYMENT_RECEIVED"],
    });

    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${ASAAS_BASE_URL.production}/webhooks`);
    const corpo = JSON.parse(String(init.body));
    expect(corpo.authToken).toBe(token);
    expect(corpo.authToken.length).toBeGreaterThanOrEqual(32);
    expect(corpo.sendType).toBe("SEQUENTIALLY");
    expect(corpo.enabled).toBe(true);
    expect(corpo.events).toContain("PAYMENT_RECEIVED");
  });

  it("pede o QR do Pix no caminho documentado", async () => {
    const fetchImpl = vi.fn(async (_url: string, _init?: RequestInit) =>
      respostaJson({ encodedImage: "iVBORw0KG", payload: "00020126", expirationDate: "2026-09-06 23:59:59" })
    );
    const client = createAsaasClient({ apiKey: CHAVE, environment: "production", fetchImpl });

    const qr = await client.getPixQrCode("pay_123");
    expect(fetchImpl.mock.calls[0][0]).toBe(`${ASAAS_BASE_URL.production}/payments/pay_123/pixQrCode`);
    expect(qr.payload).toBe("00020126");
    expect(qr.encodedImage).toBe("iVBORw0KG");
  });
});
