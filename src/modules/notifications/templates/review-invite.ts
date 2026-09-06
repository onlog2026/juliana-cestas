import { emailShell, brandSuffix, NEUTRAL_BRAND } from "./base";
import type { EmailBrand } from "../send";

/**
 * Convite para avaliar a compra. Sai DEPOIS da entrega — pedir avaliação de
 * uma cesta que ainda não chegou irrita quem comprou.
 *
 * As cinco estrelas são LINKS: cada uma abre `/avaliar/<token>?nota=N` já com
 * a nota escolhida, então quem só quer dar a nota resolve em um clique. Logo
 * abaixo vai o mesmo caminho em texto puro, porque cliente de e-mail que
 * bloqueia imagem/estilo continua tendo um link legível para clicar.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const LEGENDA: Record<number, string> = {
  1: "Não gostei",
  2: "Podia ser melhor",
  3: "Foi ok",
  4: "Gostei",
  5: "Amei!",
};

export function reviewInviteEmail(
  params: {
    orderNumber: number;
    buyerName: string;
    /** Nomes do que a pessoa comprou, para ela lembrar do que se trata. */
    itemNames: string[];
    /** URL da página de avaliação, já com o token (sem o `?nota=`). */
    reviewUrl: string;
  },
  brand: EmailBrand = NEUTRAL_BRAND
) {
  const { orderNumber, buyerName, itemNames, reviewUrl } = params;
  const primeiroNome = escapeHtml(buyerName.trim().split(" ")[0] || "tudo bem");
  const url = escapeHtml(reviewUrl);

  const subject = `Como foi sua cesta, ${buyerName.trim().split(" ")[0] || "conta pra gente"}?${brandSuffix(brand)}`;

  const estrelas = [1, 2, 3, 4, 5]
    .map(
      (nota) =>
        `<a href="${url}?nota=${nota}" title="${LEGENDA[nota]}" style="display:inline-block;text-decoration:none;font-size:34px;line-height:1;color:#d9a441;padding:0 4px;">&#9733;</a>`
    )
    .join("");

  const listaItens =
    itemNames.length > 0
      ? `<p style="margin:12px 0 0;color:#8a7d5f;font-size:14px;">Você pediu: ${escapeHtml(
          itemNames.slice(0, 4).join(", ")
        )}${itemNames.length > 4 ? " e mais" : ""}.</p>`
      : "";

  const html = emailShell(
    `
    <p>Oi, ${primeiroNome}!</p>
    <p>Sua cesta <strong>#${orderNumber}</strong> já foi entregue. Queremos muito saber o que você achou — leva menos de um minuto.</p>
    ${listaItens}
    <p style="margin:24px 0 6px;font-weight:600;">Que nota você dá para essa compra?</p>
    <p style="margin:0;text-align:center;">${estrelas}</p>
    <p style="margin:6px 0 0;text-align:center;font-size:12px;color:#8a7d5f;">Clique em uma estrela para avaliar</p>
    <p style="margin:24px 0 0;font-size:13px;color:#8a7d5f;">
      Se as estrelas acima não abrirem, use este endereço:<br />
      <a href="${url}" style="color:#556b2f;">${url}</a>
    </p>
    <p style="margin:20px 0 0;font-size:13px;color:#8a7d5f;">
      Sua avaliação passa por uma conferência da loja antes de aparecer no site.
    </p>
  `,
    brand
  );

  /** Versão em texto puro, para cliente de e-mail que não renderiza HTML. */
  const text = [
    `Oi, ${buyerName.trim().split(" ")[0] || ""}!`,
    "",
    `Sua cesta #${orderNumber} foi entregue. Que nota voce da para essa compra?`,
    "",
    ...[1, 2, 3, 4, 5].map((nota) => `${nota} - ${LEGENDA[nota]}: ${reviewUrl}?nota=${nota}`),
    "",
    `Ou abra ${reviewUrl} e escolha a nota na pagina.`,
    "",
    "Sua avaliacao passa por uma conferencia da loja antes de aparecer no site.",
  ].join("\n");

  return { subject, html, text };
}
