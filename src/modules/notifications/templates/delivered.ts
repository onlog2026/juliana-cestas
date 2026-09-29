import type { EmailBrand } from "../send";
import { NEUTRAL_BRAND, brandSuffix } from "./base";
import { ctaButton, emailShell, escapeHtml, firstName, htmlToText } from "./shell";

/** Agradecimento, no momento em que o pedido é marcado como entregue. */
export function deliveredEmail(
  params: { orderNumber: number; buyerName: string; shopUrl?: string },
  brand: EmailBrand = NEUTRAL_BRAND
) {
  const { orderNumber, buyerName } = params;
  const name = escapeHtml(firstName(buyerName));
  const subject = `Sua cesta chegou! Obrigada, ${firstName(buyerName) || "de coração"}${brandSuffix(brand)}`;
  const bodyHtml = `
    <p style="margin:0 0 14px;font-size:20px;font-family:Georgia,'Times New Roman',serif;color:#17251f;">${name ? `${name}, ` : ""}obrigada de coração!</p>
    <p style="margin:0 0 14px;">Sua cesta <strong>#${orderNumber}</strong> foi entregue. Fazer parte de um momento especial na vida de vocês é o que mais nos encanta neste trabalho.</p>
    <p style="margin:0;">Esperamos que tenha chegado do jeitinho que você imaginou. Quando quiser presentear alguém de novo, vai ser uma alegria montar outra cesta para você.</p>
    ${params.shopUrl ? ctaButton(params.shopUrl, "Ver novas cestas") : ""}
  `;
  const html = emailShell(bodyHtml, brand, { preheader: "Sua cesta foi entregue. Obrigada pela confiança!" });
  return { subject, html, text: htmlToText(bodyHtml) };
}
