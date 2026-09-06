import { describe, expect, it } from "vitest";
import {
  calcularFimDoBonus,
  mergeModules,
  normalizeVoucherCode,
} from "../../src/modules/platform/redeem";

/**
 * O resgate de cortesia libera acesso pago sem cobrar. As três funções abaixo
 * são as que decidem POR QUANTO TEMPO e O QUÊ -- por isso são puras e por isso
 * têm teste.
 */

describe("normalizeVoucherCode", () => {
  it("aceita o código como a pessoa costuma digitar", () => {
    expect(normalizeVoucherCode("  cesta-4k9p ")).toBe("CESTA-4K9P");
    expect(normalizeVoucherCode("CESTA 4K9P")).toBe("CESTA4K9P");
  });

  it("devolve vazio para lixo, em vez de casar com qualquer coisa", () => {
    expect(normalizeVoucherCode("")).toBe("");
    expect(normalizeVoucherCode("   ")).toBe("");
  });
});

describe("mergeModules", () => {
  it("não perde módulo que a loja já tinha", () => {
    expect(mergeModules(["cms", "seo"], ["ia"]).sort()).toEqual(["cms", "ia", "seo"]);
  });

  it("não duplica quando o mesmo módulo vem de dois lugares", () => {
    expect(mergeModules(["cms"], ["cms", "cms"])).toEqual(["cms"]);
  });

  it("aguenta lista nula dos dois lados", () => {
    expect(mergeModules(null, null)).toEqual([]);
    expect(mergeModules(null, ["ia"])).toEqual(["ia"]);
    expect(mergeModules(["ia"], null)).toEqual(["ia"]);
  });

  it("descarta entrada vazia em vez de gravar módulo sem nome", () => {
    expect(mergeModules(["cms"], ["", "  "])).toEqual(["cms"]);
  });
});

describe("calcularFimDoBonus", () => {
  const agora = new Date("2026-09-06T12:00:00.000Z");

  it("conta a partir de hoje quando não há cortesia anterior", () => {
    const fim = calcularFimDoBonus(null, 30, agora);
    expect(fim.toISOString()).toBe("2026-10-06T12:00:00.000Z");
  });

  it("SOMA à cortesia que ainda está valendo -- nunca encurta", () => {
    const fim = calcularFimDoBonus("2026-12-01T00:00:00.000Z", 30, agora);
    expect(fim.toISOString()).toBe("2026-12-31T00:00:00.000Z");
  });

  it("ignora cortesia já vencida e conta a partir de hoje", () => {
    const fim = calcularFimDoBonus("2026-01-01T00:00:00.000Z", 10, agora);
    expect(fim.toISOString()).toBe("2026-09-16T12:00:00.000Z");
  });

  it("não quebra com data inválida no banco", () => {
    const fim = calcularFimDoBonus("não é data", 7, agora);
    expect(fim.toISOString()).toBe("2026-09-13T12:00:00.000Z");
  });
});
