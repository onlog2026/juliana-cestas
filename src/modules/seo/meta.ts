/**
 * Ajustes PUROS de título e descrição para o Google (sem banco, sem React):
 *  - título ≤ 60 caracteres (o Google corta o resto);
 *  - descrição entre 70 e 160: curta demais vira o texto-padrão da página, comprida demais é
 *    cortada na última palavra inteira.
 */

export const TITLE_MAX = 60;
export const DESCRIPTION_MIN = 70;
export const DESCRIPTION_MAX = 160;

/** Corta em `max` caracteres sem partir palavra e sem deixar pontuação solta no fim. */
export function truncateAtWord(text: string, max: number, ellipsis = ""): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const room = max - ellipsis.length;
  let cut = clean.slice(0, room + 1);
  const lastSpace = cut.lastIndexOf(" ");
  // Só recua até o espaço se isso não jogar fora quase tudo.
  cut = lastSpace > room * 0.5 ? cut.slice(0, lastSpace) : clean.slice(0, room);
  return cut.replace(/[\s,;:|\-–—·.]+$/u, "") + ellipsis;
}

/** Título pronto para a aba/Google: máximo 60, sem cortar palavra. */
export function clampTitle(text: string, max = TITLE_MAX): string {
  return truncateAtWord(text, max);
}

/**
 * Escolhe a descrição da página: a escrita pelo dono se tiver tamanho decente
 * (cortada em 160 se passar); senão, o texto-padrão. O texto-padrão também é
 * limitado a 160 e nunca fica abaixo do que o Google considera curto demais.
 */
export function pickDescription(custom: string | null | undefined, fallback: string): string {
  const own = (custom ?? "").replace(/\s+/g, " ").trim();
  if (own.length >= DESCRIPTION_MIN) return truncateAtWord(own, DESCRIPTION_MAX, "…");
  return truncateAtWord(fallback, DESCRIPTION_MAX, "…");
}
