/**
 * Tarja diagonal no canto superior esquerdo da foto do produto (flag de
 * promoção). Puro CSS: uma faixa a 45° recortada pelo canto (o pai precisa ser
 * `relative` e `overflow-hidden`). O texto real vai em `sr-only` para leitores de
 * tela; a faixa em si é decorativa. Sem blur nem imagem: leve no celular.
 *
 * O pedaço visível da faixa é curto (~o lado do canto), então nomes longos
 * ("Últimas unidades") quebram em DUAS linhas e a letra encolhe um pouco, em vez
 * de sair cortada nas pontas.
 */

/** Divide o texto em até 2 linhas equilibradas (só quebra em espaço e se for longo). */
export function ribbonLines(label: string): string[] {
  const text = label.trim();
  const words = text.split(/\s+/);
  if (text.length <= 9 || words.length < 2) return [text];
  let best: [string, string] = [words[0], words.slice(1).join(" ")];
  let diff = Math.abs(best[0].length - best[1].length);
  for (let i = 2; i < words.length; i++) {
    const a = words.slice(0, i).join(" ");
    const b = words.slice(i).join(" ");
    const d = Math.abs(a.length - b.length);
    if (d < diff) {
      best = [a, b];
      diff = d;
    }
  }
  return best;
}

/** Tamanho da letra (px) para o texto caber no trecho visível da faixa. */
export function ribbonFontSize(lines: string[], size: number): number {
  const longest = Math.max(...lines.map((l) => l.length), 1);
  const visible = size * 0.82; // comprimento útil da faixa dentro do canto
  return Math.max(7, Math.min(11, Math.floor(visible / (longest * 0.72))));
}

export function ProductRibbon({
  label,
  bg,
  text,
  size = 96,
}: {
  label: string;
  bg: string;
  text: string;
  size?: number;
}) {
  const lines = ribbonLines(label);
  const fontSize = ribbonFontSize(lines, size);
  const band = Math.round(size * 1.5);
  const pad = lines.length > 1 ? 4 : 6;
  // altura aproximada da faixa (linhas + respiro) para manter o centro na diagonal do canto
  const height = lines.length * fontSize * 1.1 + pad * 2;
  const centerOnDiagonal = size * 0.7; // x + y do centro da faixa
  const left = Math.round(centerOnDiagonal / 2 - band / 2 - 2);
  const top = Math.round(centerOnDiagonal / 2 - height / 2 + 2);

  return (
    <>
      <span className="sr-only">{label}</span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-10 overflow-hidden"
        style={{ width: size, height: size }}
      >
        <span
          className="absolute block -rotate-45 text-center font-extrabold uppercase tracking-wide shadow-md"
          style={{
            background: bg,
            color: text,
            width: band,
            left,
            top,
            paddingTop: pad,
            paddingBottom: pad,
            fontSize,
            lineHeight: 1.1,
          }}
        >
          {lines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </span>
      </span>
    </>
  );
}
