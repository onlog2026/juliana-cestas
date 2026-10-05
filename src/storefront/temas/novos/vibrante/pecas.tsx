import type { CSSProperties } from "react";

/* VIBRANTE — peças compartilhadas (sem estado): cores dos blocos, faixa em movimento, estrela e botões em pílula. */

/** Cores dos blocos, em rodízio. O texto de cada bloco já vem com contraste garantido pela paleta. */
export const CORES: ReadonlyArray<{ bg: string; fg: string }> = [
  { bg: "var(--t-primary)", fg: "var(--t-on-primary)" },
  { bg: "var(--t-accent)", fg: "var(--t-fg)" },
  { bg: "color-mix(in srgb, var(--t-primary) 22%, var(--t-bg))", fg: "var(--t-fg)" },
  { bg: "var(--t-surface)", fg: "var(--t-fg)" },
];
export const cor = (i: number) => CORES[((i % CORES.length) + CORES.length) % CORES.length];
export const blocoEstilo = (i: number): CSSProperties => ({ background: cor(i).bg, color: cor(i).fg });

/** Botão em pílula grossa com contorno (a cor do contorno e do texto vem do bloco). */
export const PILULA = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-[3px] px-6 text-base font-bold";

/** Título gigante. Largura de fonte varia entre as variações, então quebra palavra em último caso. */
export const GIGANTE = "leading-[0.98] tracking-tight [overflow-wrap:anywhere]";

export function Estrela({ className = "size-5", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden="true" fill="currentColor">
      <path d="M12 0c.9 6.4 5.6 11.1 12 12-6.4.9-11.1 5.6-12 12-.9-6.4-5.6-11.1-12-12C6.4 11.1 11.1 6.4 12 0Z" />
    </svg>
  );
}

const CSS_MARQUEE =
  ".vb-track{display:flex;width:max-content;animation:vb-run 34s linear infinite}" +
  ".vb-track:hover{animation-play-state:paused}" +
  "@keyframes vb-run{from{transform:translateX(0)}to{transform:translateX(-50%)}}" +
  "@media (prefers-reduced-motion:reduce){.vb-track{animation:none}}";

/** Faixa de texto em movimento (CSS puro; parada quando o visitante pede menos movimento). */
export function Faixa({ frases, fundo, texto, tamanho = "text-sm sm:text-base" }: { frases: string[]; fundo: string; texto: string; tamanho?: string }) {
  const grupo = (oculto: boolean) => (
    <div className="flex shrink-0 items-center" aria-hidden={oculto || undefined}>
      {[0, 1, 2].flatMap((rep) =>
        frases.map((f, i) => (
          <span key={`${rep}-${i}`} className="flex shrink-0 items-center gap-6 pr-6 font-bold whitespace-nowrap">
            {f} <Estrela className="size-4" />
          </span>
        )),
      )}
    </div>
  );
  return (
    <div className={`overflow-hidden py-2.5 ${tamanho}`} style={{ background: fundo, color: texto, fontFamily: "var(--t-titulo)" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS_MARQUEE }} />
      <div className="vb-track">
        {grupo(false)}
        {grupo(true)}
      </div>
    </div>
  );
}
