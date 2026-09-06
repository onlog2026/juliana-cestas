import { emailShell, ctaButton, brandSuffix, NEUTRAL_BRAND } from "./base";
import type { EmailBrand } from "../send";

export function ticketCreatedEmail(
  params: { buyerName: string; subject: string; ticketUrl: string },
  brand: EmailBrand = NEUTRAL_BRAND
) {
  const { buyerName, subject, ticketUrl } = params;
  const emailSubject = `Recebemos sua mensagem${brandSuffix(brand)}`;
  const answerLine = brand.storeName
    ? `A equipe da ${brand.storeName} responde por aqui assim que puder.`
    : "A gente responde por aqui assim que puder.";
  const html = emailShell(`
    <p>Oi, ${buyerName.split(" ")[0]}!</p>
    <p>Recebemos seu chamado: <strong>${subject}</strong>.</p>
    <p>${answerLine} Você acompanha tudo pelo link abaixo.</p>
    ${ctaButton(ticketUrl, "Ver meu chamado")}
  `, brand);
  return { subject: emailSubject, html };
}
