import { emailShell, ctaButton } from "./base";

export function ticketReplyEmail(params: {
  buyerName: string;
  subject: string;
  replyBody: string;
  ticketUrl: string;
}) {
  const { buyerName, subject, replyBody, ticketUrl } = params;
  const emailSubject = `Nova resposta no seu chamado — Juliana Cestas`;
  const html = emailShell(`
    <p>Oi, ${buyerName.split(" ")[0]}!</p>
    <p>Você tem uma resposta nova no chamado <strong>${subject}</strong>:</p>
    <p style="background-color:#f6f1e8;border-radius:10px;padding:14px 16px;margin:16px 0;">${replyBody}</p>
    ${ctaButton(ticketUrl, "Ver conversa completa")}
  `);
  return { subject: emailSubject, html };
}
