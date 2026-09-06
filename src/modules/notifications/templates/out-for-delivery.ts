import { emailShell, ctaButton, NEUTRAL_BRAND } from "./base";
import type { EmailBrand } from "../send";

export function outForDeliveryEmail(
  params: {
    orderNumber: number;
    buyerName: string;
    recipientName: string;
    addressLine: string;
    orderUrl: string;
  },
  brand: EmailBrand = NEUTRAL_BRAND
) {
  const { orderNumber, buyerName, recipientName, addressLine, orderUrl } = params;
  // Assunto já não tinha marca escrita e o "—" aqui separa o pedido, não a
  // loja: manter como está evita dois traços no mesmo assunto.
  const subject = `Sua cesta está a caminho — pedido #${orderNumber}`;
  const html = emailShell(`
    <p>Oi, ${buyerName.split(" ")[0]}! 🚚</p>
    <p>Sua cesta já saiu para entrega, para <strong>${recipientName}</strong>, em:</p>
    <p>${addressLine}</p>
    <p>Fique de olho no telefone de quem vai receber.</p>
    ${ctaButton(orderUrl, "Ver detalhes do pedido")}
  `, brand);
  return { subject, html };
}
