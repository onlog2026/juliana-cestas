import { emailShell, brandSuffix, NEUTRAL_BRAND } from "./base";
import type { EmailBrand } from "../send";

export function deliveredEmail(
  params: { orderNumber: number; buyerName: string },
  brand: EmailBrand = NEUTRAL_BRAND
) {
  const { orderNumber, buyerName } = params;
  const subject = `Pedido #${orderNumber} entregue${brandSuffix(brand)}`;
  const html = emailShell(`
    <p>Oi, ${buyerName.split(" ")[0]}! 💛</p>
    <p>Sua cesta <strong>#${orderNumber}</strong> foi entregue. Esperamos que tenha adoçado o dia de quem recebeu!</p>
    <p>Se quiser fazer um novo pedido, é só voltar na loja quando quiser.</p>
  `, brand);
  return { subject, html };
}
