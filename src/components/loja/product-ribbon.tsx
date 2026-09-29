/**
 * Tarja diagonal (flag de promoção) no canto superior esquerdo da foto, com o
 * efeito de FITA DOBRADA: ela passa um pouquinho da borda da foto e, nas duas
 * pontas, aparece um triângulo mais escuro -- a parte que "dobra" e vai para trás.
 *
 * Puro CSS/SVG (sem blur, sem imagem): leve no celular. O pai precisa ser
 * `relative` e NÃO pode ter `overflow-hidden` (a fita passa 6 px para fora do
 * canto); a foto, sim, fica num filho com `overflow-hidden` e cantos arredondados.
 * O texto real vai em `sr-only` para leitores de tela; a fita é decorativa.
 *
 * O trecho visível da fita é curto, então nomes longos ("Últimas unidades")
 * quebram em DUAS linhas e a letra encolhe um pouco, em vez de sair cortada.
 */

/** Quanto a fita passa da borda da foto (px): é onde aparece a dobra. */
export const RIBBON_OVERHANG = 6;

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

/** Tamanho da letra (px) para o texto caber no trecho visível da fita. */
export function ribbonFontSize(lines: string[], size: number): number {
  const longest = Math.max(...lines.map((l) => l.length), 1);
  const visible = size * 0.82; // comprimento útil da fita dentro do canto
  return Math.max(7, Math.min(11, Math.floor(visible / (longest * 0.72))));
}

/** Escurece uma cor #rrggbb misturando com preto (factor 0..1 = quanto escurecer). */
export function shade(hex: string, factor = 0.42): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const ch = (i: number) => Math.round(parseInt(full.slice(i, i + 2), 16) * (1 - factor));
  const to = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
  return `#${to(ch(0))}${to(ch(2))}${to(ch(4))}`;
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
  const o = RIBBON_OVERHANG;
  const W = size + o; // caixa do recorte (a fita começa `o` px fora da foto)
  const lines = ribbonLines(label);
  const fontSize = ribbonFontSize(lines, size);
  const pad = lines.length > 1 ? 4 : 6;
  const height = Math.round(lines.length * fontSize * 1.1 + pad * 2); // espessura da fita
  const band = Math.round(size * 1.6);

  // Coordenadas da CAIXA (origem no canto da fita, `o` px fora da foto).
  // O centro da fita fica na diagonal x + y = c.
  const c = size * 0.7 + 2 * o;
  const left = Math.round(c / 2 - band / 2);
  const top = Math.round(c / 2 - height / 2);
  // Onde a borda de baixo da fita encosta nas bordas da foto (x + y = b).
  const b = c + (height * Math.SQRT2) / 2;
  const dark = shade(bg);

  return (
    <>
      <span className="sr-only">{label}</span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute z-10 overflow-hidden"
        style={{ left: -o, top: -o, width: W, height: W }}
      >
        {/* Dobras: triângulos escuros colados na borda de baixo da fita, nas duas pontas. */}
        <svg width={W} height={W} viewBox={`0 0 ${W} ${W}`} className="absolute inset-0">
          <polygon points={`${b},0 ${b - o},${o} ${b},${o}`} fill={dark} />
          <polygon points={`0,${b} ${o},${b - o} ${o},${b}`} fill={dark} />
        </svg>
        <span
          className="absolute block -rotate-45 text-center font-extrabold uppercase tracking-wide"
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
            boxShadow: "0 3px 6px -2px rgba(0,0,0,0.45)",
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
