import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Cifra segredos de terceiros que precisam ficar no banco -- hoje, a chave da
 * conta Asaas de cada vendedor.
 *
 * Por que cifrar se a tabela já é service-role: a chave do Asaas do vendedor
 * dá acesso ao DINHEIRO dele. Um dump de banco, um backup vazado ou um SELECT
 * indevido não podem entregar a chave em texto puro. Cifrada, o vazamento do
 * banco sozinho não basta -- precisa TAMBÉM da variável de ambiente.
 *
 * AES-256-GCM: além de cifrar, detecta adulteração (se alguém mexer no texto
 * cifrado, o decifrar falha em vez de devolver lixo).
 *
 * Formato guardado: "v1.<iv base64>.<tag base64>.<cifrado base64>"
 * O prefixo de versão existe pra permitir trocar de algoritmo depois sem
 * precisar adivinhar o formato de cada linha antiga.
 *
 * PAYMENT_KEY_ENC_KEY: 32 bytes em base64. Gerar UMA vez com
 *   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 * e guardar com cuidado -- perder a chave significa que todo vendedor terá
 * que reconectar a conta de pagamento dele.
 */

const VERSION = "v1";
const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; // padrão recomendado para GCM

function getKey(): Buffer {
  const raw = process.env.PAYMENT_KEY_ENC_KEY;
  if (!raw) {
    // Fail-closed de propósito: melhor recusar a operação do que gravar a
    // chave do vendedor em texto puro por descuido de configuração.
    throw new Error("PAYMENT_KEY_ENC_KEY não configurada -- não é possível cifrar/decifrar segredos.");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(`PAYMENT_KEY_ENC_KEY inválida: esperado 32 bytes em base64, veio ${key.length}.`);
  }
  return key;
}

/** Diz se dá pra usar segredos cifrados neste ambiente (sem lançar erro). */
export function isSecretCryptoReady(): boolean {
  try {
    getKey();
    return true;
  } catch {
    return false;
  }
}

export function encryptSecret(plain: string): string {
  if (!plain) throw new Error("Nada para cifrar.");
  const key = getKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(".");
}

export function decryptSecret(stored: string): string {
  const parts = stored.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error("Segredo em formato desconhecido.");
  }
  const key = getKey();
  const iv = Buffer.from(parts[1], "base64");
  const tag = Buffer.from(parts[2], "base64");
  const data = Buffer.from(parts[3], "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

/** Últimos 4 caracteres -- é o único pedaço da chave que pode voltar à tela. */
export function lastFour(plain: string): string {
  return plain.slice(-4);
}
