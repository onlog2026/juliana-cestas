import { describe, expect, it, beforeEach, vi } from "vitest";

/**
 * O que este arquivo prova: **o registrador de erros não vaza segredo e não
 * derruba quem o chamou.**
 *
 * A spec lista "número de cartão foi parar no log" entre os erros que custaram
 * incidente. Como o `detail` é escrito à mão em dezenas de lugares do código,
 * a única garantia real é a sanitização — e a única garantia de que ela
 * funciona é este teste.
 */

// `vi.mock` é içado para o topo do arquivo; sem `vi.hoisted` a variável ainda
// não existiria quando a fábrica do mock rodasse.
const { gravado, estado } = vi.hoisted(() => ({
  gravado: [] as Record<string, unknown>[],
  // Trocar o modo simula as três realidades: banco respondendo, banco fora do
  // ar e banco recusando a escrita.
  estado: { modo: "ok" as "ok" | "cliente-explode" | "insert-recusado" },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => {
    if (estado.modo === "cliente-explode") {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada");
    }
    return {
      from: () => ({
        insert: async (linha: Record<string, unknown>) => {
          if (estado.modo === "insert-recusado") return { error: { message: "permission denied" } };
          gravado.push(linha);
          return { error: null };
        },
      }),
    };
  },
}));

import { reportError, sanitizeDetail, buildErrorRow } from "@/lib/platform/report-error";

/** Tudo o que iria para o banco, virado texto — é nisso que a chave não pode aparecer. */
function comoTexto(valor: unknown): string {
  return JSON.stringify(valor);
}

const CHAVE_ASAAS = "$aact_YTU5YTE0M2M2N2I4MTliNzk0YTI5N2U5MzdjNWZmYzRkZDk5";
const TOKEN_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.hK3xQ2mLp0aZv9Bc1dEfGh";

beforeEach(() => {
  gravado.length = 0;
  estado.modo = "ok";
});

describe("sanitizeDetail — o que NUNCA pode ser gravado", () => {
  it("apaga o valor de qualquer campo cujo nome pareça segredo", () => {
    const limpo = sanitizeDetail({
      apiKey: CHAVE_ASAAS,
      API_KEY: "outra-chave",
      api_key: "mais-uma",
      accessToken: "tok_abcdefghijklmno",
      client_secret: "segredo-do-cliente",
      password: "SenhaDoAdriano123",
      senha: "SenhaDoAdriano123",
      Authorization: "Bearer abcdefghijklmnop",
      cookie: "sb-access-token=abc",
      pedidoId: "PED-1234",
    });

    const texto = comoTexto(limpo);
    expect(texto).not.toContain(CHAVE_ASAAS);
    expect(texto).not.toContain("outra-chave");
    expect(texto).not.toContain("mais-uma");
    expect(texto).not.toContain("tok_abcdefghijklmno");
    expect(texto).not.toContain("segredo-do-cliente");
    expect(texto).not.toContain("SenhaDoAdriano123");
    expect(texto).not.toContain("sb-access-token=abc");

    // O que NÃO é segredo continua lá — sanitizar não pode cegar o debug.
    expect(texto).toContain("PED-1234");
  });

  it("mascara segredo mesmo em campo de nome inocente", () => {
    // O caso real: a chave vem grudada na mensagem de erro devolvida pelo gateway.
    const limpo = sanitizeDetail({
      resposta: `401 Unauthorized ao chamar o Asaas com ${CHAVE_ASAAS}`,
      jwt: TOKEN_JWT,
      cabecalho: "Bearer sbp_1234567890abcdefghij",
      cartao: "4111111111111111",
    });

    const texto = comoTexto(limpo);
    expect(texto).not.toContain(CHAVE_ASAAS);
    expect(texto).not.toContain(TOKEN_JWT);
    expect(texto).not.toContain("sbp_1234567890abcdefghij");
    expect(texto).not.toContain("4111111111111111");
    // O resto da mensagem sobrevive: quem lê precisa saber que foi um 401.
    expect(texto).toContain("401 Unauthorized");
  });

  it("acha o segredo mesmo aninhado dentro de outro objeto", () => {
    const limpo = sanitizeDetail({
      requisicao: { headers: { authorization: `Bearer ${CHAVE_ASAAS}` }, url: "/api/pagamento" },
    });
    const texto = comoTexto(limpo);
    expect(texto).not.toContain(CHAVE_ASAAS);
    expect(texto).toContain("/api/pagamento");
  });

  it("corta texto muito longo em vez de encher a tabela", () => {
    const limpo = sanitizeDetail({ html: "x".repeat(5000) }) as { html: string };
    expect(limpo.html.length).toBeLessThan(600);
    expect(limpo.html).toContain("texto cortado");
  });

  it("aguenta referência circular sem estourar a pilha", () => {
    const a: Record<string, unknown> = { nome: "a" };
    a.eu = a;
    expect(() => sanitizeDetail(a)).not.toThrow();
    expect(comoTexto(sanitizeDetail(a))).toContain("aninhado demais");
  });

  it("guarda mensagem e pilha de um Error, sem a chave que estava na mensagem", () => {
    const erro = new Error(`Falha ao autenticar com ${CHAVE_ASAAS}`);
    const limpo = sanitizeDetail(erro) as { nome: string; mensagem: string };
    expect(limpo.nome).toBe("Error");
    expect(limpo.mensagem).not.toContain(CHAVE_ASAAS);
    expect(limpo.mensagem).toContain("Falha ao autenticar");
  });

  it("limita a quantidade de itens de uma lista", () => {
    const limpo = sanitizeDetail(Array.from({ length: 100 }, (_, i) => i)) as unknown[];
    expect(limpo.length).toBeLessThanOrEqual(21);
    expect(comoTexto(limpo)).toContain("não registrados");
  });
});

describe("buildErrorRow — a linha que iria para o banco", () => {
  it("mascara segredo que veio dentro da própria mensagem", () => {
    const linha = buildErrorRow({
      module: "pagamento",
      action: "criar_cobranca",
      level: "critical",
      message: `Asaas recusou a chave ${CHAVE_ASAAS}`,
      detail: null,
    });
    expect(linha.message).not.toContain(CHAVE_ASAAS);
    expect(linha.message).toContain("Asaas recusou a chave");
  });

  it("nível inválido vira 'error' em vez de derrubar o CHECK do banco", () => {
    const linha = buildErrorRow({
      module: "email",
      action: "enviar",
      level: "explodiu" as never,
      message: "algo",
    });
    expect(linha.level).toBe("error");
  });

  it("tenantId que não é uuid vira null em vez de quebrar o INSERT inteiro", () => {
    const linha = buildErrorRow({
      tenantId: "juliana-cestas",
      module: "email",
      action: "enviar",
      level: "error",
      message: "algo",
    });
    expect(linha.tenant_id).toBeNull();
  });

  it("aceita um uuid de verdade", () => {
    const id = "3f1b0c2a-9d44-4f8e-9c11-6a2b7d8e0f31";
    const linha = buildErrorRow({ tenantId: id, module: "email", action: "enviar", level: "error", message: "x" });
    expect(linha.tenant_id).toBe(id);
  });
});

describe("reportError — grava sem vazar e sem nunca lançar", () => {
  it("a chave de API passada em detail NÃO aparece no que seria gravado", async () => {
    await reportError({
      tenantId: "3f1b0c2a-9d44-4f8e-9c11-6a2b7d8e0f31",
      module: "pagamento",
      action: "criar_cobranca",
      level: "critical",
      message: "Não foi possível criar a cobrança no Asaas.",
      detail: {
        pedidoId: "PED-9987",
        asaasApiKey: CHAVE_ASAAS,
        headers: { authorization: `Bearer ${CHAVE_ASAAS}` },
        respostaBruta: `{"errors":[{"description":"invalid access_token ${CHAVE_ASAAS}"}]}`,
      },
    });

    expect(gravado).toHaveLength(1);
    const texto = comoTexto(gravado[0]);
    expect(texto).not.toContain(CHAVE_ASAAS);
    expect(texto).not.toContain("aact_");
    // O que serve para investigar continua gravado.
    expect(texto).toContain("PED-9987");
    expect(texto).toContain("Não foi possível criar a cobrança no Asaas.");
  });

  it("não lança quando falta a variável de ambiente do banco", async () => {
    estado.modo = "cliente-explode";
    const erroDoConsole = vi.spyOn(console, "error").mockImplementation(() => {});

    // O contrato inteiro está nesta linha: quem chamou continua a vida dele.
    await expect(
      reportError({ module: "email", action: "enviar", level: "error", message: "falhou" })
    ).resolves.toBeUndefined();

    expect(erroDoConsole).toHaveBeenCalled();
    erroDoConsole.mockRestore();
  });

  it("não lança quando o INSERT é recusado pelo banco", async () => {
    estado.modo = "insert-recusado";
    const erroDoConsole = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      reportError({ module: "email", action: "enviar", level: "error", message: "falhou" })
    ).resolves.toBeUndefined();

    // `.insert()` não lança: devolve `{ error }`. Se ninguém checar, a falha
    // some -- é por isso que o console tem que ter sido chamado.
    expect(erroDoConsole).toHaveBeenCalled();
    erroDoConsole.mockRestore();
  });
});
