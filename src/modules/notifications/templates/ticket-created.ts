import { emailShell, ctaButton } from "./base";

export function ticketCreatedEmail(params: { buyerName: string; subject: string; ticketUrl: string }) {
  const { buyerName, subject, ticketUrl } = params;
  const emailSubject = `Recebemos sua mensagem — Juliana Cestas`;
  const html = emailShell(`
    <p>Oi, ${buyerName.split(" ")[0]}!</p>
    <p>Recebemos seu chamado: <strong>${subject}</strong>.</p>
    <p>A Juliana vai responder por aqui assim que puder. Você acompanha tudo pelo link abaixo.</p>
    ${ctaButton(ticketUrl, "Ver meu chamado")}
  `);
  return { subject: emailSubject, html };
}
