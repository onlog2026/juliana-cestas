import { beforeAll, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";

let mod: typeof import("@/lib/security/crypto-secret");

beforeAll(async () => {
  process.env.PAYMENT_KEY_ENC_KEY = randomBytes(32).toString("base64");
  mod = await import("@/lib/security/crypto-secret");
});

describe("crypto-secret", () => {
  it("cifra e decifra de volta o mesmo valor", () => {
    const chave = "$aact_YTU5YTE0M2M2N2I4MTliNzk0YTI5N2U5MzdjNWZm";
    const cifrado = mod.encryptSecret(chave);
    expect(cifrado).not.toContain(chave);
    expect(mod.decryptSecret(cifrado)).toBe(chave);
  });

  it("cada cifragem gera um texto diferente (IV aleatório)", () => {
    const a = mod.encryptSecret("mesma-chave");
    const b = mod.encryptSecret("mesma-chave");
    expect(a).not.toBe(b);
    expect(mod.decryptSecret(a)).toBe(mod.decryptSecret(b));
  });

  it("recusa texto adulterado em vez de devolver lixo", () => {
    const cifrado = mod.encryptSecret("chave-secreta");
    const partes = cifrado.split(".");
    const adulterado = [partes[0], partes[1], partes[2], Buffer.from("outra coisa").toString("base64")].join(".");
    expect(() => mod.decryptSecret(adulterado)).toThrow();
  });

  it("recusa formato desconhecido", () => {
    expect(() => mod.decryptSecret("nao-e-um-segredo")).toThrow(/formato desconhecido/i);
  });

  it("lastFour devolve só os 4 últimos", () => {
    expect(mod.lastFour("$aact_abcdef1234")).toBe("1234");
  });

  it("sem a variável de ambiente, falha fechado (não grava em texto puro)", async () => {
    const saved = process.env.PAYMENT_KEY_ENC_KEY;
    delete process.env.PAYMENT_KEY_ENC_KEY;
    expect(mod.isSecretCryptoReady()).toBe(false);
    expect(() => mod.encryptSecret("x")).toThrow(/PAYMENT_KEY_ENC_KEY/);
    process.env.PAYMENT_KEY_ENC_KEY = saved;
  });
});
