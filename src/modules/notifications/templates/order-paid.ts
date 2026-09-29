// E-mail "pagamento confirmado". Arquivo PURO (só importa ./shell): o webhook
// do Asaas importa este arquivo por caminho relativo e não pode depender de
// nada de "@/" -- ver o cabeçalho de `api/asaas/webhook/[tenantId]/route.ts`.

import { ctaButton, emailShell, escapeHtml, firstName, formatBrl, htmlToText, type ShellBrand, type ShellOptions } from "./shell";

export type OrderPaidParams = {
  buyerName: string;
  /** Um ou mais pedidos (carrinho pago de uma vez). */
  orders: Array<{ orderNumber: number; recipientName?: string; totalCents: number }>;
  /** Botão opcional (ex.: o site da loja). Sem endereço, sem botão. */
  ctaUrl?: string;
  ctaLabel?: string;
};

export function orderPaidEmail(params: OrderPaidParams, brand: ShellBrand, opts: ShellOptions = {}) {
  const { buyerName, orders, ctaUrl, ctaLabel } = params;
  const name = escapeHtml(firstName(buyerName));
  const greeting = name ? `Oi, ${name}!` : "Oi!";
  const many = orders.length > 1;
  const total = orders.reduce((sum, o) => sum + o.totalCents, 0);
  const numbers = orders.map((o) => `#${o.orderNumber}`).join(", ");
  const suffix = brand.storeName ? ` — ${brand.storeName}` : "";

  const subject = many
    ? `Pagamento confirmado: seus ${orders.length} presentes${suffix}`
    : `Pagamento confirmado: pedido #${orders[0]?.orderNumber ?? ""}${suffix}`;

  const lines = many
    ? `<p style="margin:0 0 14px;">Recebemos o pagamento de <strong>${orders.length} pedidos</strong> (${escapeHtml(numbers)}), no valor total de <strong>${formatBrl(total)}</strong>.</p>`
    : `<p style="margin:0 0 14px;">Recebemos o pagamento do pedido <strong>#${orders[0]?.orderNumber ?? ""}</strong>, no valor de <strong>${formatBrl(total)}</strong>.${
        orders[0]?.recipientName ? ` A entrega é para <strong>${escapeHtml(orders[0].recipientName)}</strong>.` : ""
      }</p>`;

  const bodyHtml = `
    <p style="margin:0 0 14px;font-size:20px;font-family:Georgia,'Times New Roman',serif;color:#17251f;">${greeting}</p>
    <p style="margin:0 0 14px;"><strong>Pagamento confirmado!</strong> Muito obrigada pela confiança.</p>
    ${lines}
    <p style="margin:0;">Agora é com a gente: vamos montar ${many ? "cada cesta" : "a cesta"} com todo o carinho e avisar quando sair para entrega.</p>
    ${ctaUrl ? ctaButton(ctaUrl, ctaLabel ?? "Visitar a loja") : ""}
  `;

  const html = emailShell(bodyHtml, brand, {
    preheader: `Pagamento de ${formatBrl(total)} confirmado. Já estamos preparando tudo.`,
    ...opts,
  });
  return { subject, html, text: htmlToText(bodyHtml) };
}
