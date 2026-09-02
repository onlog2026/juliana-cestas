import { emailShell } from "./base";

export function deliveredEmail(params: { orderNumber: number; buyerName: string }) {
  const { orderNumber, buyerName } = params;
  const subject = `Pedido #${orderNumber} entregue — Juliana Cestas`;
  const html = emailShell(`
    <p>Oi, ${buyerName.split(" ")[0]}! 💛</p>
    <p>Sua cesta <strong>#${orderNumber}</strong> foi entregue. Esperamos que tenha adoçado o dia de quem recebeu!</p>
    <p>Se quiser fazer um novo pedido, é só voltar na loja quando quiser.</p>
  `);
  return { subject, html };
}
