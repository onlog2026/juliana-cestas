import { describe, expect, it } from "vitest";
import {
  formatCentsToReais,
  centsToInputValue,
  parseReaisToCents,
  parseNumeroOpcional,
  parsePercentual,
  normalizarSlug,
  mensalidadeAnualEmCentavos,
} from "@/modules/platform/plans-service";

/**
 * O banco guarda CENTAVOS; a tela mostra e recebe REAIS. Toda a conversão
 * acontece nestas funções -- por isso elas têm teste. No Agentop, duas
 * unidades de dinheiro na mesma tela (um campo em centavos, outro em reais)
 * custaram um incidente real.
 */

describe("parseReaisToCents", () => {
  it("converte o jeito que um brasileiro digita", () => {
    expect(parseReaisToCents("129,90")).toBe(12990);
    expect(parseReaisToCents("R$ 129,90")).toBe(12990);
    expect(parseReaisToCents("1.234,56")).toBe(123456);
    expect(parseReaisToCents("0")).toBe(0);
    expect(parseReaisToCents("0,00")).toBe(0);
    expect(parseReaisToCents("99")).toBe(9900);
    expect(parseReaisToCents(" 49,9 ")).toBe(4990);
  });

  it("entende ponto como milhar quando vêm 3 dígitos depois dele", () => {
    expect(parseReaisToCents("1.234")).toBe(123400);
    expect(parseReaisToCents("12.34")).toBe(1234); // aqui o ponto é decimal
  });

  it("não deixa erro de arredondamento aparecer em centavos", () => {
    // 8,07 * 100 dá 806,9999... em ponto flutuante. Tem que virar 807.
    expect(parseReaisToCents("8,07")).toBe(807);
    expect(parseReaisToCents("1,10")).toBe(110);
    expect(parseReaisToCents("2,29")).toBe(229);
  });

  it("devolve null para tudo que não é um valor de dinheiro (nunca um valor chutado)", () => {
    expect(parseReaisToCents("")).toBeNull();
    expect(parseReaisToCents("   ")).toBeNull();
    expect(parseReaisToCents("abc")).toBeNull();
    expect(parseReaisToCents("-10")).toBeNull();
    expect(parseReaisToCents("10,999")).toBeNull();
    expect(parseReaisToCents("1,2,3")).toBeNull();
    expect(parseReaisToCents("12 reais")).toBeNull();
  });
});

describe("formatCentsToReais e centsToInputValue", () => {
  it("mostra o valor do jeito que o cliente lê", () => {
    expect(formatCentsToReais(12990)).toBe("R$ 129,90");
    expect(formatCentsToReais(0)).toBe("R$ 0,00");
    expect(formatCentsToReais(123456)).toBe("R$ 1.234,56");
  });

  it("preenche o campo do formulário sem o R$, com vírgula", () => {
    expect(centsToInputValue(12990)).toBe("129,90");
    expect(centsToInputValue(0)).toBe("0,00");
    expect(centsToInputValue(500)).toBe("5,00");
  });

  it("volta ao mesmo número depois de ir e voltar (o que a tela faz o dia inteiro)", () => {
    for (const centavos of [0, 1, 500, 12990, 123456, 999999]) {
      expect(parseReaisToCents(centsToInputValue(centavos))).toBe(centavos);
    }
  });
});

describe("parseNumeroOpcional", () => {
  it("trata campo vazio como 'sem limite', que é resposta válida", () => {
    expect(parseNumeroOpcional("")).toEqual({ ok: true, valor: null });
    expect(parseNumeroOpcional("   ")).toEqual({ ok: true, valor: null });
  });

  it("aceita inteiro e recusa o resto", () => {
    expect(parseNumeroOpcional("500")).toEqual({ ok: true, valor: 500 });
    expect(parseNumeroOpcional("0")).toEqual({ ok: true, valor: 0 });
    expect(parseNumeroOpcional("500 produtos")).toEqual({ ok: false });
    expect(parseNumeroOpcional("12,5")).toEqual({ ok: false });
    expect(parseNumeroOpcional("-3")).toEqual({ ok: false });
  });

  it("respeita o teto informado", () => {
    expect(parseNumeroOpcional("999", { max: 100 })).toEqual({ ok: false });
    expect(parseNumeroOpcional("50", { max: 100 })).toEqual({ ok: true, valor: 50 });
  });
});

describe("parsePercentual", () => {
  it("aceita de 0 a 100, com vírgula, e vazio vira 0", () => {
    expect(parsePercentual("20")).toBe(20);
    expect(parsePercentual("12,5")).toBe(12.5);
    expect(parsePercentual("")).toBe(0);
    expect(parsePercentual("100")).toBe(100);
  });

  it("recusa acima de 100 e texto inválido", () => {
    expect(parsePercentual("101")).toBeNull();
    expect(parsePercentual("muito")).toBeNull();
    expect(parsePercentual("-5")).toBeNull();
  });
});

describe("normalizarSlug", () => {
  it("transforma o nome do plano numa chave sem acento e sem espaço", () => {
    expect(normalizarSlug("Plano Essencial")).toBe("plano-essencial");
    expect(normalizarSlug("  Ação Básica  ")).toBe("acao-basica");
    expect(normalizarSlug("PRO")).toBe("pro");
    expect(normalizarSlug("!!!")).toBe("");
  });
});

describe("mensalidadeAnualEmCentavos", () => {
  it("aplica o desconto anual a partir de uma fonte única", () => {
    expect(mensalidadeAnualEmCentavos(12990, 20)).toBe(10392);
    expect(mensalidadeAnualEmCentavos(12990, 0)).toBe(12990);
    expect(mensalidadeAnualEmCentavos(10000, 10)).toBe(9000);
  });
});
