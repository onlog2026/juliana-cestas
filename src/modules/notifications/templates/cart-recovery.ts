import { emailShell, ctaButton, brandSuffix, NEUTRAL_BRAND } from "./base";
import type { EmailBrand } from "../send";

/**
 * Convite para finalizar a compra — carrinho abandonado.
 *
 * Sai quando o pedido fica "aguardando_pagamento" por mais tempo do que a
 * loja configurou (ver `src/modules/automations/run.ts`). O link leva para a
 * MESMA página do e-mail de confirmação (`/pedido/<id>?t=<token>`), que já
 * mostra o QR/PIX para quem ainda não pagou — não existe uma página separada
 * de "recuperar carrinho".
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function cartRecoveryEmail(
  params: {
    orderNumber: number;
    buyerName: string;
    /** Nomes do que a pessoa tinha escolhido, para ela lembrar do que se trata. */
    itemNames: string[];
    /** URL da página do pedido, já com o token novo (ver comentário em run.ts). */
    checkoutUrl: string;
  },
  brand: EmailBrand = NEUTRAL_BRAND
) {
  const { orderNumber, buyerName, itemNames, checkoutUrl } = params;
  const primeiroNome = escapeHtml(buyerName.trim().split(" ")[0] || "tudo bem");
  const url = escapeHtml(checkoutUrl);

  const subject = `Sua cesta ainda está esperando por você${brandSuffix(brand)}`;

  const listaItens =
    itemNames.length > 0
      ? `<p style="margin:12px 0 0;color:#8a7d5f;font-size:14px;">Você tinha escolhido: ${escapeHtml(
          itemNames.slice(0, 4).join(", ")
        )}${itemNames.length > 4 ? " e mais" : ""}.</p>`
      : "";

  const html = emailShell(
    `
    <p>Oi, ${primeiroNome}!</p>
    <p>Você começou o pedido <strong>#${orderNumber}</strong> mas o pagamento ainda não foi
    concluído. Ele continua reservado para você — falta só finalizar.</p>
    ${listaItens}
    <p style="margin:24px 0 0;text-align:center;">${ctaButton(url, "Finalizar meu pedido")}</p>
    <p style="margin:24px 0 0;font-size:13px;color:#8a7d5f;">
      Se o botão não abrir, use este endereço:<br />
      <a href="${url}" style="color:#556b2f;">${url}</a>
    </p>
  `,
    brand
  );

  /** Versão em texto puro, para cliente de e-mail que não renderiza HTML. */
  const text = [
    `Oi, ${buyerName.trim().split(" ")[0] || ""}!`,
    "",
    `Seu pedido #${orderNumber} ainda nao foi pago. Ele continua reservado para voce.`,
    itemNames.length > 0 ? `Voce tinha escolhido: ${itemNames.join(", ")}.` : "",
    "",
    `Finalize aqui: ${checkoutUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}
