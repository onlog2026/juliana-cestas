import { describe, expect, it, vi } from "vitest";
import { createMelhorEnvioClient, redigirMelhorEnvio, MelhorEnvioError } from "@/modules/shipping/melhor-envio-client";

const TOKEN = "meu-token-secreto-da-melhor-envio-123456";

const input = {
  fromCep: "70000000",
  toCep: "01310100",
  weightGrams: 1500,
  lengthCm: 30,
  widthCm: 20,
  heightCm: 15,
};

function jsonRes(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("melhor-envio-client — monta a chamada certa", () => {
  it("chama POST /api/v2/me/shipment/calculate com Bearer e o pacote em kg/cm", async () => {
    const fetchImpl = vi.fn(async () => jsonRes([]));
    const client = createMelhorEnvioClient({ token: TOKEN, environment: "sandbox", fetchImpl });

    await client.calculate(input);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate");
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${TOKEN}`);
    const body = JSON.parse(init.body as string);
    expect(body.from.postal_code).toBe("70000000");
    expect(body.to.postal_code).toBe("01310100");
    expect(body.package).toEqual({ weight: 1.5, height: 15, width: 20, length: 30 });
  });

  it("usa a URL de produção quando environment=production", async () => {
    const fetchImpl = vi.fn(async () => jsonRes([]));
    const client = createMelhorEnvioClient({ token: TOKEN, environment: "production", fetchImpl });
    await client.calculate(input);
    const [url] = fetchImpl.mock.calls[0] as unknown as [string];
    expect(url).toBe("https://melhorenvio.com.br/api/v2/me/shipment/calculate");
  });
});

describe("melhor-envio-client — parsing defensivo da resposta", () => {
  it("mapeia preço, nome e prazo; ordena do mais barato pro mais caro", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonRes([
        { id: 2, name: "SEDEX", price: "45.90", delivery_time: 2, company: { name: "Correios" } },
        { id: 1, name: "PAC", price: 23.5, delivery_time: "5", company: { name: "Correios" } },
      ])
    );
    const client = createMelhorEnvioClient({ token: TOKEN, environment: "sandbox", fetchImpl });
    const options = await client.calculate(input);

    expect(options).toHaveLength(2);
    expect(options[0]).toEqual({ id: "1", name: "PAC", companyName: "Correios", priceCents: 2350, deliveryDays: 5 });
    expect(options[1]).toEqual({ id: "2", name: "SEDEX", companyName: "Correios", priceCents: 4590, deliveryDays: 2 });
  });

  it("descarta itens com campo error (serviço indisponível pra essa rota)", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonRes([
        { id: 1, name: "PAC", price: "23.50", error: "Serviço indisponível para o destino" },
        { id: 2, name: "SEDEX", price: "45.90" },
      ])
    );
    const client = createMelhorEnvioClient({ token: TOKEN, environment: "sandbox", fetchImpl });
    const options = await client.calculate(input);
    expect(options).toHaveLength(1);
    expect(options[0].name).toBe("SEDEX");
  });

  it("descarta item malformado (sem preço válido) em vez de quebrar a cotação inteira", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonRes([{ id: 1, name: "PAC", price: "não é número" }, { id: 2, name: "SEDEX", price: "45.90" }])
    );
    const client = createMelhorEnvioClient({ token: TOKEN, environment: "sandbox", fetchImpl });
    const options = await client.calculate(input);
    expect(options).toHaveLength(1);
    expect(options[0].name).toBe("SEDEX");
  });

  it("resposta que não é array vira lista vazia, não erro", async () => {
    const fetchImpl = vi.fn(async () => jsonRes({ message: "algo inesperado" }));
    const client = createMelhorEnvioClient({ token: TOKEN, environment: "sandbox", fetchImpl });
    await expect(client.calculate(input)).resolves.toEqual([]);
  });
});

describe("melhor-envio-client — erros e segurança do token", () => {
  it("HTTP não-2xx vira MelhorEnvioError com o status certo", async () => {
    const fetchImpl = vi.fn(async () => new Response("token inválido", { status: 401 }));
    const client = createMelhorEnvioClient({ token: TOKEN, environment: "sandbox", fetchImpl });
    await expect(client.calculate(input)).rejects.toThrow(MelhorEnvioError);
  });

  it("o token nunca aparece na mensagem de erro", async () => {
    const fetchImpl = vi.fn(async () => new Response(`erro: ${TOKEN} inválido`, { status: 401 }));
    const client = createMelhorEnvioClient({ token: TOKEN, environment: "sandbox", fetchImpl });
    try {
      await client.calculate(input);
      throw new Error("deveria ter lançado");
    } catch (e) {
      expect((e as Error).message).not.toContain(TOKEN);
      expect((e as Error).message).toContain("[token omitido]");
    }
  });

  it("falha de rede vira MelhorEnvioError (status 0), nunca deixa a exceção crua escapar", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("network down");
    });
    const client = createMelhorEnvioClient({ token: TOKEN, environment: "sandbox", fetchImpl });
    await expect(client.calculate(input)).rejects.toThrow(MelhorEnvioError);
  });
});

describe("redigirMelhorEnvio", () => {
  it("substitui o token exato por [token omitido]", () => {
    expect(redigirMelhorEnvio(`falhou com ${TOKEN}`, TOKEN)).not.toContain(TOKEN);
  });
  it("sem token, devolve o texto intacto", () => {
    expect(redigirMelhorEnvio("texto qualquer")).toBe("texto qualquer");
  });
});
