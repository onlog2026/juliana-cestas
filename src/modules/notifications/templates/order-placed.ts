// E-mail "pedido efetuado": um pedido avulso OU o resumo de um carrinho com
// várias cestas (uma linha por cesta). Arquivo puro (só importa ./shell).

import {
  ctaButton,
  emailShell,
  escapeHtml,
  firstName,
  formatBrl,
  htmlToText,
  secondaryButton,
  whatsappLink,
  type ShellBrand,
  type ShellOptions,
} from "./shell";

export type PlacedOrderLine = {
  orderNumber: number;
  recipientName: string;
  deliveryDateLabel: string;
  slotLabel: string;
  totalCents: number;
};

export type OrderPlacedParams = {
  buyerName: string;
  orders: PlacedOrderLine[];
  /** Soma de todas as cestas (o pedido avulso repete o total dele). */
  totalCents: number;
  /** Link de acompanhamento COM o token (`/pedido/<id>?t=<token>`). */
  orderUrl: string;
};

function suffix(brand: ShellBrand): string {
  return brand.storeName ? ` — ${brand.storeName}` : "";
}

export function orderPlacedEmail(params: OrderPlacedParams, brand: ShellBrand, opts: ShellOptions = {}) {
  const { buyerName, orders, totalCents, orderUrl } = params;
  const name = escapeHtml(firstName(buyerName));
  const greeting = name ? `Oi, ${name}!` : "Oi!";
  const many = orders.length > 1;
  const first = orders[0];

  const subject = many
    ? `Recebemos seus ${orders.length} presentes${suffix(brand)}`
    : `Recebemos o seu pedido #${first?.orderNumber ?? ""}${suffix(brand)}`;

  const rows = orders
    .map(
      (o) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #eee7d6;font-size:15px;line-height:1.5;">
          <strong>Pedido #${o.orderNumber}</strong> — para ${escapeHtml(o.recipientName)}<br/>
          <span style="color:#8a7d5f;">${escapeHtml(o.deliveryDateLabel)}, entre ${escapeHtml(o.slotLabel)}</span>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #eee7d6;text-align:right;white-space:nowrap;font-weight:600;font-size:15px;">${formatBrl(o.totalCents)}</td>
      </tr>`
    )
    .join("");

  // Pagamento combinado pelo WhatsApp da loja (decisão do dono): mensagem já pronta com o(s) número(s).
  const numbers = orders.map((o) => `#${o.orderNumber}`).join(", ");
  const payLink = whatsappLink(
    brand,
    many ? `Olá! Quero finalizar o pagamento dos meus pedidos ${numbers}.` : `Olá! Quero finalizar o pagamento do meu pedido ${numbers}.`
  );

  const intro = many
    ? `<p style="margin:0 0 14px;">Que alegria! Recebemos os seus <strong>${orders.length} presentes</strong> e já anotamos cada detalhe com carinho.</p>`
    : `<p style="margin:0 0 14px;">Que alegria receber o seu pedido! Já anotamos cada detalhe com carinho.</p>`;

  const bodyHtml = `
    <p style="margin:0 0 14px;font-size:20px;font-family:Georgia,'Times New Roman',serif;color:#17251f;">${greeting}</p>
    ${intro}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">${rows}
      ${
        many
          ? `<tr><td style="padding:14px 0 0;font-weight:600;">Total</td><td style="padding:14px 0 0;text-align:right;font-weight:700;font-size:17px;">${formatBrl(totalCents)}</td></tr>`
          : ""
      }
    </table>
    <p style="margin:18px 0 0;">Assim que o pagamento for confirmado, avisamos você por aqui. Se precisar mudar algo, é só nos chamar.</p>
    ${ctaButton(orderUrl, many ? "Acompanhar meus pedidos" : "Acompanhar meu pedido")}
    ${payLink ? `<br/>${secondaryButton(payLink, "Finalizar o pagamento pelo WhatsApp")}` : ""}
  `;

  const html = emailShell(bodyHtml, brand, {
    preheader: many
      ? `Recebemos ${orders.length} presentes. Total ${formatBrl(totalCents)}.`
      : `Pedido #${first?.orderNumber ?? ""} recebido. Total ${formatBrl(totalCents)}.`,
    ...opts,
  });
  return { subject, html, text: htmlToText(bodyHtml) };
}
