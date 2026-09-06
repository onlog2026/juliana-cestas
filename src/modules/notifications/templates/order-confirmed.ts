import { emailShell, ctaButton, brandSuffix, NEUTRAL_BRAND } from "./base";
import type { EmailBrand } from "../send";
import { formatCents } from "@/lib/money";

export function orderConfirmedEmail(
  params: {
    orderNumber: number;
    buyerName: string;
    recipientName: string;
    deliveryDateLabel: string;
    slotLabel: string;
    totalCents: number;
    orderUrl: string;
  },
  brand: EmailBrand = NEUTRAL_BRAND
) {
  const { orderNumber, buyerName, recipientName, deliveryDateLabel, slotLabel, totalCents, orderUrl } = params;
  const subject = `Pedido #${orderNumber} confirmado${brandSuffix(brand)}`;
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
  `, brand);
  return { subject, html };
}
