import { contraste } from "@/storefront/temas/contraste";
import type { EmailColors } from "@/modules/notifications/templates/shell";

type Paleta = { bg: string; fg: string; primary: string; accent: string; line: string };

/**
 * Cores do e-mail a partir da paleta do modelo da loja. O cartão do e-mail continua branco (legível
 * em qualquer app); mudam a faixa do topo, o botão, o destaque, o fundo da página e os fios.
 * Garante: faixa escura o bastante para texto claro, botão com texto branco legível (>= 4,5).
 */
export function coresDeEmail(p: Paleta): EmailColors {
  const branco = "#ffffff";
  const fundoEscuro = contraste(p.bg, "#000000") < contraste(p.bg, branco); // fundo mais perto do preto (ex.: Noir)
  const band = fundoEscuro ? p.bg : contraste(p.fg, branco) >= 7 ? p.fg : "#1f2937";
  const primary = contraste(p.primary, branco) >= 4.5 ? p.primary : band;
  const accent = contraste(p.accent, band) >= 3 ? p.accent : "#ffffff";
  return {
    band,
    primary,
    accent,
    page: fundoEscuro ? "#f4f4f5" : p.bg,
    line: fundoEscuro ? "#e4e4e7" : p.line,
  };
}
