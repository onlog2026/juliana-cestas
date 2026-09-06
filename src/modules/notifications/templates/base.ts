// Casca HTML compartilhada por todos os e-mails transacionais — mesma
// identidade visual do site (bege + verde-oliva). A MARCA vem do tenant
// (EmailBrand), nunca escrita fixa aqui.

import type { EmailBrand } from "../send";

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
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Sufixo de assunto com o nome da loja (" — Loja X"). Sem nome cadastrado,
 * devolve string vazia — o assunto nunca termina com traço solto.
 */
export function brandSuffix(brand: EmailBrand): string {
  return brand.storeName ? ` — ${brand.storeName}` : "";
}

export function emailShell(bodyHtml: string, brand: EmailBrand = NEUTRAL_BRAND): string {
  const storeName = escapeHtml(brand.storeName);
  const header = brand.logoUrl
    ? `<img src="${escapeHtml(brand.logoUrl)}" alt="${storeName}" style="max-height:44px;max-width:220px;border:0;display:inline-block;" />`
    : `<span style="font-size:22px;color:#556b2f;font-weight:600;">${storeName}</span>`;
  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background-color:#f6f1e8;font-family:Georgia,'Young Serif',serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f1e8;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e0d2;">
            <tr>
              <td style="padding:28px 32px 16px;text-align:center;border-bottom:1px solid #e6e0d2;">
                ${header}
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;font-family:Arial,Helvetica,sans-serif;color:#3a3226;font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;text-align:center;border-top:1px solid #e6e0d2;">
                <span style="font-size:12px;color:#8a7d5f;">${storeName}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function ctaButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;padding:12px 28px;background-color:#556b2f;color:#ffffff;text-decoration:none;border-radius:999px;font-weight:600;font-size:14px;">${label}</a>`;
}
