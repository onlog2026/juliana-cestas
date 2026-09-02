import { emailShell, ctaButton } from "./base";

export function outForDeliveryEmail(params: {
  orderNumber: number;
  buyerName: string;
  recipientName: string;
  addressLine: string;
  orderUrl: string;
}) {
  const { orderNumber, buyerName, recipientName, addressLine, orderUrl } = params;
  const subject = `Sua cesta está a caminho — pedido #${orderNumber}`;
  const html = emailShell(`
    <p>Oi, ${buyerName.split(" ")[0]}! 🚚</p>
    <p>Sua cesta já saiu para entrega, para <strong>${recipientName}</strong>, em:</p>
    <p>${addressLine}</p>
    <p>Fique de olho no telefone de quem vai receber.</p>
    ${ctaButton(orderUrl, "Ver detalhes do pedido")}
  `);
  return { subject, html };
}
