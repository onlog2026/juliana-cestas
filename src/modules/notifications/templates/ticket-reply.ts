import { emailShell, ctaButton, brandSuffix, NEUTRAL_BRAND } from "./base";
import type { EmailBrand } from "../send";

export function ticketReplyEmail(
  params: {
    buyerName: string;
    subject: string;
    replyBody: string;
    ticketUrl: string;
  },
  brand: EmailBrand = NEUTRAL_BRAND
) {
  const { buyerName, subject, replyBody, ticketUrl } = params;
  const emailSubject = `Nova resposta no seu chamado${brandSuffix(brand)}`;
  const html = emailShell(`
    <p>Oi, ${buyerName.split(" ")[0]}!</p>
    <p>Você tem uma resposta nova no chamado <strong>${subject}</strong>:</p>
    <p style="background-color:#f6f1e8;border-radius:10px;padding:14px 16px;margin:16px 0;">${replyBody}</p>
    ${ctaButton(ticketUrl, "Ver conversa completa")}
  `, brand);
  return { subject: emailSubject, html };
}
