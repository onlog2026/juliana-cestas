import { describe, expect, it, vi } from "vitest";
import { createWhatsappClient, redigirWhatsapp, WhatsappError } from "@/modules/notifications/whatsapp-client";

const CHAVE = "minha-apikey-secreta-1234567890";

describe("whatsapp-client — monta a chamada certa", () => {
  it("chama POST /message/sendText/{instance} com header apikey e body number+text", async () => {
    const fetchImpl = vi.fn(async () => new Response("", { status: 200 }));
    const client = createWhatsappClient({
      baseUrl: "https://evo.exemplo.com.br",
      apiKey: CHAVE,
      instance: "juliana-cestas",
      fetchImpl,
    });

    await client.sendText("5561999999999", "Olá, pedido novo!");

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://evo.exemplo.com.br/message/sendText/juliana-cestas");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).apikey).toBe(CHAVE);
    expect(JSON.parse(init.body as string)).toEqual({
      number: "5561999999999",
      text: "Olá, pedido novo!",
    });
  });

  it("tira a barra final da baseUrl antes de montar a URL", async () => {
    const fetchImpl = vi.fn(async () => new Response("", { status: 200 }));
    const client = createWhatsappClient({
      baseUrl: "https://evo.exemplo.com.br/",
      apiKey: CHAVE,
      instance: "loja",
      fetchImpl,
    });
    await client.sendText("5561999999999", "oi");
    const [url] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://evo.exemplo.com.br/message/sendText/loja");
  });
});

describe("whatsapp-client — erros", () => {
  it("HTTP não-2xx vira WhatsappError com o status certo", async () => {
    const fetchImpl = vi.fn(async () => new Response("instância desconectada", { status: 400 }));
    const client = createWhatsappClient({ baseUrl: "https://evo.exemplo.com.br", apiKey: CHAVE, instance: "x", fetchImpl });

    await expect(client.sendText("5561999999999", "oi")).rejects.toThrow(WhatsappError);
    try {
      await client.sendText("5561999999999", "oi");
    } catch (e) {
      expect((e as WhatsappError).status).toBe(400);
    }
  });

  it("falha de rede vira WhatsappError sem travar (status 0)", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("network down");
    });
    const client = createWhatsappClient({ baseUrl: "https://evo.exemplo.com.br", apiKey: CHAVE, instance: "x", fetchImpl });

    await expect(client.sendText("5561999999999", "oi")).rejects.toThrow(WhatsappError);
    try {
      await client.sendText("5561999999999", "oi");
    } catch (e) {
      expect((e as WhatsappError).status).toBe(0);
    }
  });

  it("a apikey nunca aparece na mensagem de erro, mesmo vindo no corpo da resposta", async () => {
    const fetchImpl = vi.fn(async () => new Response(`erro: chave ${CHAVE} inválida`, { status: 401 }));
    const client = createWhatsappClient({ baseUrl: "https://evo.exemplo.com.br", apiKey: CHAVE, instance: "x", fetchImpl });

    try {
      await client.sendText("5561999999999", "oi");
      throw new Error("deveria ter lançado");
    } catch (e) {
      const erro = e as WhatsappError;
      expect(erro.message).not.toContain(CHAVE);
      expect(erro.message).toContain("[chave omitida]");
    }
  });
});

describe("redigirWhatsapp", () => {
  it("substitui a chave exata por [chave omitida]", () => {
    const texto = `deu erro com ${CHAVE} no header`;
    expect(redigirWhatsapp(texto, CHAVE)).not.toContain(CHAVE);
    expect(redigirWhatsapp(texto, CHAVE)).toContain("[chave omitida]");
  });

  it("sem apiKey (ou curta demais), devolve o texto intacto", () => {
    expect(redigirWhatsapp("texto qualquer", undefined)).toBe("texto qualquer");
    expect(redigirWhatsapp("texto qualquer", "abc")).toBe("texto qualquer");
  });
});
