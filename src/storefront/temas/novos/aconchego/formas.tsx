import type { CSSProperties } from "react";
import { Foto, brl } from "../../kit";

/**
 * ACONCHEGO — peças visuais compartilhadas (sem hooks, servem a servidor e cliente):
 * manchas orgânicas (blobs), ilustrações de linha em SVG e o cartão "nuvem".
 */

export const wrapA = "mx-auto w-full max-w-[1180px] px-5 sm:px-8";

/** Raios assimétricos: dão o contorno "pedrinha" às fotos e cartões. */
export const FORMAS = [
  "58% 42% 45% 55% / 52% 56% 44% 48%",
  "42% 58% 60% 40% / 55% 45% 55% 45%",
  "50% 50% 38% 62% / 60% 40% 60% 40%",
  "60% 40% 52% 48% / 46% 58% 42% 54%",
];
export const forma = (i: number) => FORMAS[((i % FORMAS.length) + FORMAS.length) % FORMAS.length];

export const SOMBRA_NUVEM = "0 22px 44px -26px color-mix(in srgb, var(--t-primary) 42%, transparent), 0 4px 14px -8px color-mix(in srgb, var(--t-primary) 22%, transparent)";

const BLOBS = [
  "M43.6,-52.1C55.3,-42.7,62.6,-27.4,66.2,-10.4C69.8,6.6,69.7,25.3,60.4,38.7C51.1,52.1,32.6,60.2,13.6,64.4C-5.4,68.6,-24.9,68.9,-40.3,60.4C-55.7,51.9,-67,34.6,-69.6,16.4C-72.2,-1.8,-66.1,-20.9,-54.8,-33.3C-43.5,-45.7,-27,-51.4,-10.6,-55.3C5.8,-59.2,31.9,-61.5,43.6,-52.1Z",
  "M38.9,-47.4C50.4,-38.6,59.7,-26.1,63.6,-11.2C67.5,3.7,66,21,57.3,33.4C48.6,45.8,32.7,53.3,15.6,58.2C-1.5,63.1,-19.7,65.4,-33.6,58.2C-47.5,51,-57.1,34.3,-61.4,16.5C-65.7,-1.3,-64.7,-20.2,-55.5,-33.6C-46.3,-47,-28.9,-54.9,-12.4,-57.4C4.1,-59.9,27.4,-56.2,38.9,-47.4Z",
  "M47.3,-57.3C59.6,-46.6,66.4,-29.9,68.1,-13.1C69.8,3.7,66.4,20.6,57.6,34C48.8,47.4,34.6,57.3,18.5,62.2C2.4,67.1,-15.6,67,-31.4,60.3C-47.2,53.6,-60.8,40.3,-66.4,24.1C-72,7.9,-69.6,-11.2,-61,-26.1C-52.4,-41,-37.6,-51.7,-22.2,-60.8C-6.8,-69.9,9.2,-77.4,24.3,-73.5C33.8,-70.9,35,-68,47.3,-57.3Z",
];

/** Mancha orgânica de fundo (decorativa). A cor vem de `color`/currentColor. */
export function Blob({ i = 0, className, style }: { i?: number; className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="-80 -80 160 160" className={className} style={style} aria-hidden="true" focusable="false">
      <path d={BLOBS[i % BLOBS.length]} fill="currentColor" />
    </svg>
  );
}

type IconeProps = { className?: string; style?: CSSProperties };
const base = { viewBox: "0 0 48 48", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, focusable: "false" } as const;

export function Folha({ className, style }: IconeProps) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="M9 39C8 21 20 8 39 8c1 19-10 31-28 31Z" />
      <path d="M9 39 28 20" />
      <path d="M22 26c3-.2 6 .4 9 2.4M27 20.5c2.5-.4 5-.2 7.6 1" />
    </svg>
  );
}
export function Xicara({ className, style }: IconeProps) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="M10 21h24v7a10 10 0 0 1-10 10h-4a10 10 0 0 1-10-10Z" />
      <path d="M34 23h2.5a4.5 4.5 0 0 1 0 9H33" />
      <path d="M8 43h28" />
      <path d="M17 8c-2.5 3 2.5 4.500 0 8M25 8c-2.5 3 2.5 4.500 0 8" />
    </svg>
  );
}
export function Laco({ className, style }: IconeProps) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="M24 24c-6-9-17-11-17-4s11 8 17 4Z" />
      <path d="M24 24c6-9 17-11 17-4s-11 8-17 4Z" />
      <circle cx="24" cy="24" r="2.8" />
      <path d="M22.500 27 17 40M25.500 27 31 40" />
    </svg>
  );
}
export function Coracao({ className, style }: IconeProps) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="M24 40S7 29.500 7 18.500A9 9 0 0 1 24 14a9 9 0 0 1 17 4.500C41 29.500 24 40 24 40Z" />
    </svg>
  );
}
export function Faisca({ className, style }: IconeProps) {
  return (
    <svg {...base} className={className} style={style}>
      <path d="M24 6c1 9 3 14 12 18-9 4-11 9-12 18-1-9-3-14-12-18 9-4 11-9 12-18Z" />
    </svg>
  );
}

const ICONES_LISTA = [Folha, Coracao, Laco, Xicara, Faisca];
export function IconeDe({ i, className, style }: { i: number } & IconeProps) {
  const C = ICONES_LISTA[i % ICONES_LISTA.length];
  return <C className={className} style={style} />;
}

/** Linha ondulada fininha, usada como respiro entre blocos. */
export function Onda({ className, style }: IconeProps) {
  return (
    <svg viewBox="0 0 160 12" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M2 6c10-8 18 8 28 0s18 8 28 0 18 8 28 0 18 8 28 0 12 4 16 0" />
    </svg>
  );
}

export type CartaoDados = { href: string; nome: string; preco: number; precoDe?: number; serve?: string; imagem: string };

/**
 * Cartão "nuvem": superfície clara, sombra difusa, foto em forma orgânica.
 * O primeiro filho é o <div> com borda (é nele que o brilho de hover aparece).
 */
export function CartaoNuvem({ c, i }: { c: CartaoDados; i: number }) {
  const pct = c.precoDe && c.precoDe > c.preco ? Math.round((1 - c.preco / c.precoDe) * 100) : null;
  return (
    <a href={c.href} className="group block min-w-0">
      <div className="overflow-hidden rounded-[2rem] border p-2.5 transition-transform duration-300 motion-safe:group-hover:-translate-y-1" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)", boxShadow: SOMBRA_NUVEM }}>
        <div className="relative overflow-hidden" style={{ borderRadius: forma(i), aspectRatio: "1 / 1" }}>
          <Foto src={c.imagem} alt={c.nome} className="size-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105" />
          {pct ? <span className="absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: "var(--t-accent)", color: "var(--t-fg)" }}>-{pct}%</span> : null}
        </div>
        <div className="px-2 pt-3 pb-2 text-center">
          <p className="line-clamp-2 min-h-[2.6em] text-[17px] leading-snug" style={{ fontFamily: "var(--t-titulo)", fontWeight: 600 }}>{c.nome}</p>
          {c.serve ? <p className="mt-0.5 text-xs" style={{ color: "var(--t-muted)" }}>{c.serve}</p> : null}
          <p className="mt-2 flex items-baseline justify-center gap-2">
            {c.precoDe ? <s className="text-xs" style={{ color: "var(--t-muted)" }}>{brl(c.precoDe)}</s> : null}
            <span className="text-lg font-bold" style={{ color: "var(--t-primary)" }}>{brl(c.preco)}</span>
          </p>
        </div>
      </div>
    </a>
  );
}
