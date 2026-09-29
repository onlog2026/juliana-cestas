// Ponto de entrada dos templates de e-mail transacional. A casca visual (faixa
// colorida com a logo, imagem de contexto, rodapé) mora em `./shell` -- um arquivo
// puro, sem imports, porque o webhook do Asaas também o usa. A MARCA vem do
// tenant (EmailBrand), nunca escrita fixa aqui.

import type { EmailBrand } from "../send";
import { ctaButton, emailShell as shellV2, escapeHtml, type ShellOptions } from "./shell";

/**
 * Marca vazia: usada quando o chamador ainda não resolveu o tenant.
 * Nunca inventa nome de loja — o e-mail sai sem marca, jamais com a marca
 * de outra loja.
 */
export const NEUTRAL_BRAND: EmailBrand = {
  storeName: "",
  logoUrl: null,
  // TODO F7: virá de tenant_domains
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "",
  replyTo: null,
  whatsapp: null,
};

/**
 * Sufixo de assunto com o nome da loja (" — Loja X"). Sem nome cadastrado,
 * devolve string vazia — o assunto nunca termina com traço solto.
 */
export function brandSuffix(brand: EmailBrand): string {
  return brand.storeName ? ` — ${brand.storeName}` : "";
}

/** Casca v2 (faixa colorida com a logo, imagem de contexto opcional). Ver ./shell. */
export function emailShell(bodyHtml: string, brand: EmailBrand = NEUTRAL_BRAND, opts?: ShellOptions): string {
  return shellV2(bodyHtml, brand, opts);
}

export { ctaButton, escapeHtml };
