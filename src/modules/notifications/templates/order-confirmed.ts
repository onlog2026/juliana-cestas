import { emailShell, ctaButton } from "./base";
import { formatCents } from "@/lib/money";

export function orderConfirmedEmail(params: {
  orderNumber: number;
  buyerName: string;
  recipientName: string;
  deliveryDateLabel: string;
  slotLabel: string;
  totalCents: number;
  orderUrl: string;
}) {
  const { orderNumber, buyerName, recipientName, deliveryDateLabel, slotLabel, totalCents, orderUrl } = params;
  const subject = `Pedido #${orderNumber} confirmado — Juliana Cestas`;
  const html = emailShell(`
    <p>Oi, ${buyerName.split(" ")[0]}! 🧺</p>
    <p>Seu pedido <strong>#${orderNumber}</strong> foi registrado com sucesso.</p>
    <p>
      <strong>Para:</strong> ${recipientName}<br/>
      <strong>Entrega:</strong> ${deliveryDateLabel}, entre ${slotLabel}<br/>
      <strong>Total:</strong> ${formatCents(totalCents)}
    </p>
    <p>Assim que o pagamento for confirmado, você recebe um novo e-mail e pode acompanhar tudo pelo link abaixo.</p>
    ${ctaButton(orderUrl, "Acompanhar meu pedido")}
  `);
  return { subject, html };
}
