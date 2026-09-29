// Casca HTML dos e-mails transacionais (versão 2) + utilitários de texto.
//
// ═══ ARQUIVO PURO, SEM NENHUM IMPORT ═══
// O webhook do Asaas (`api/asaas/webhook/[tenantId]/route.ts`) importa
// `order-paid.ts`, que importa este arquivo. Aquela rota NÃO pode depender de
// nada de "@/" nem de `server-only` (um import quebrado lá derruba o
// recebimento de todos os pagamentos). Por isso aqui só existe TypeScript puro:
// nada de import de outros módulos do projeto, nem de pacotes.

/** O que a casca precisa saber da loja (subconjunto de `EmailBrand`). */
export type ShellBrand = {
  storeName: string;
  logoUrl: string | null;
  siteUrl: string;
  /** WhatsApp da loja (só dígitos, com ou sem 55). Sem ele, o e-mail não mostra WhatsApp. */
  whatsapp?: string | null;
};

export type ShellOptions = {
  /** Cor da faixa do cabeçalho (padrão: verde-escuro da marca). */
  bandColor?: string;
  /** Imagem de contexto abaixo do cabeçalho (URL absoluta, PNG/JPG/WebP). */
  heroImageUrl?: string;
  /** Texto alternativo da imagem (aparece se o cliente bloquear imagens). */
  heroAlt?: string;
  /** Resumo que o app de e-mail mostra ao lado do assunto. */
  preheader?: string;
};

export const DEFAULT_BAND_COLOR = "#17251f";
const GOLD = "#d9a441";
const OLIVE = "#556b2f";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Só aceita cor no formato #rgb / #rrggbb (o resto cai no padrão). */
function safeColor(value: string | undefined, fallback: string): string {
  return value && /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(value.trim()) ? value.trim() : fallback;
}

/** Só https:// (ou http://) entra em `src`/`href` de e-mail; qualquer outra coisa some. */
function safeUrl(value: string | null | undefined): string | null {
  const v = (value ?? "").trim();
  return /^https?:\/\//i.test(v) ? v : null;
}

/** "R$ 1.234,56" a partir de centavos (sem depender de Intl no servidor de e-mail). */
export function formatBrl(cents: number): string {
  const negative = cents < 0;
  const abs = Math.abs(Math.round(cents));
  const reais = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const centavos = String(abs % 100).padStart(2, "0");
  return `${negative ? "-" : ""}R$ ${reais},${centavos}`;
}

/** Primeiro nome, já escapado; vazio vira "tudo bem" (o e-mail nunca sai com "Oi, !"). */
export function firstName(fullName: string): string {
  const first = (fullName ?? "").trim().split(/\s+/)[0] ?? "";
  return first;
}

/** Número no formato internacional para o wa.me (celular BR com 10-11 dígitos ganha o 55). */
export function whatsappDigits(raw: string | null | undefined): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  return digits.length <= 11 ? `55${digits}` : digits;
}

/** "(61) 99989-4889" a partir do número (com ou sem 55). */
export function formatPhoneBr(raw: string | null | undefined): string {
  let d = (raw ?? "").replace(/\D/g, "");
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return d;
}

/** Link do WhatsApp da loja com mensagem pronta; null se a loja não tem número. */
export function whatsappLink(brand: ShellBrand, message?: string): string | null {
  const phone = whatsappDigits(brand.whatsapp);
  if (!phone) return null;
  return `https://wa.me/${phone}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

/** Botão secundário (contorno verde) -- ex.: "Pagar pelo WhatsApp" ao lado do botão principal. */
export function secondaryButton(href: string, label: string): string {
  const url = safeUrl(href);
  if (!url) return "";
  return `<a href="${escapeHtml(url)}" style="display:inline-block;margin-top:12px;padding:12px 28px;background-color:#ffffff;color:${OLIVE};text-decoration:none;border-radius:999px;font-weight:600;font-size:15px;border:2px solid ${OLIVE};">${escapeHtml(label)}</a>`;
}

export function ctaButton(href: string, label: string): string {
  const url = safeUrl(href);
  if (!url) return "";
  return `<a href="${escapeHtml(url)}" style="display:inline-block;margin-top:22px;padding:14px 30px;background-color:${OLIVE};color:#ffffff;text-decoration:none;border-radius:999px;font-weight:600;font-size:15px;">${escapeHtml(label)}</a>`;
}

/**
 * Casca do e-mail: faixa colorida com a logo, imagem de contexto opcional,
 * corpo e rodapé. Tabelas + estilo inline (Gmail/Outlook/Apple Mail), 560 px.
 */
export function emailShell(bodyHtml: string, brand: ShellBrand, opts: ShellOptions = {}): string {
  const storeName = escapeHtml(brand.storeName);
  const band = safeColor(opts.bandColor, DEFAULT_BAND_COLOR);
  const logo = safeUrl(brand.logoUrl);
  const header = logo
    ? `<img src="${escapeHtml(logo)}" alt="${storeName}" width="220" style="max-height:56px;max-width:220px;height:auto;border:0;display:inline-block;" />`
    : `<span style="font-family:Georgia,'Times New Roman',serif;font-size:24px;color:${GOLD};font-weight:600;">${storeName}</span>`;

  const hero = safeUrl(opts.heroImageUrl);
  const heroRow = hero
    ? `<tr><td style="padding:0;line-height:0;"><img src="${escapeHtml(hero)}" alt="${escapeHtml(opts.heroAlt ?? "")}" width="560" style="width:100%;max-width:560px;height:auto;border:0;display:block;" /></td></tr>`
    : "";

  const preheader = opts.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(opts.preheader)}</div>`
    : "";

  const waLink = whatsappLink(brand);
  const whatsappFooter = waLink
    ? `<br/><a href="${escapeHtml(waLink)}" style="font-size:13px;color:#556b2f;text-decoration:none;font-weight:600;">WhatsApp: ${escapeHtml(formatPhoneBr(brand.whatsapp))}</a>`
    : "";

  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background-color:#f6f1e8;font-family:Arial,Helvetica,sans-serif;">
    ${preheader}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f1e8;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e0d2;">
            <tr>
              <td bgcolor="${band}" style="background-color:${band};padding:26px 32px;text-align:center;">
                ${header}
              </td>
            </tr>
            <tr><td bgcolor="${GOLD}" style="background-color:${GOLD};height:3px;line-height:3px;font-size:0;">&nbsp;</td></tr>
            ${heroRow}
            <tr>
              <td style="padding:30px 32px 26px;color:#3a3226;font-size:16px;line-height:1.65;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px 24px;text-align:center;border-top:1px solid #e6e0d2;">
                <span style="font-size:12px;color:#8a7d5f;">${storeName}</span>${whatsappFooter}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Versão em texto puro do corpo (cliente que não renderiza HTML, filtros de
 * spam que exigem a alternativa em texto). Links viram "texto: endereço".
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href: string, label: string) => {
      const text = label.replace(/<[^>]+>/g, "").trim();
      return text && text !== href ? `${text}: ${href}` : href;
    })
    .replace(/<\/(p|tr|h[1-6]|li)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
