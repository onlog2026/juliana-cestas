import type { CSSProperties, ReactNode } from "react";
import { TEMA_FONT_CLASSES, fonteVar } from "./fonts";
import { contraste, lum } from "./contraste";
import type { TemaKey, Variacao } from "./types";

export { contraste } from "./contraste";

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Invólucro de todo modelo: declara as cores (`--t-*`) e fontes (`--t-titulo`,
 * `--t-texto`, `--t-detalhe`) da variação. Os componentes do modelo só usam
 * essas variáveis — trocar a variação nunca exige mexer em componente.
 */
const EFEITOS = `[data-modelo] nav a{display:inline-flex;align-items:center;min-height:44px}[data-modelo] footer a{display:inline-flex;align-items:center;min-height:44px}[data-modelo] :is(a,button,select,summary){transition:box-shadow .22s ease,border-color .22s ease,background-color .22s ease,color .22s ease,transform .22s ease,filter .22s ease}[data-modelo] :is(button:not(:disabled):not([aria-disabled=true]),select,summary,a[class*="border"]):hover{border-color:var(--t-brilho)!important;box-shadow:0 0 0 1px var(--t-brilho),0 0 18px -2px color-mix(in srgb,var(--t-brilho) 55%,transparent);filter:brightness(1.08)}[data-modelo] a:hover>div:first-child:is([class*=border],[class*=rounded],[class*=overflow]){border-color:var(--t-brilho)!important;box-shadow:0 0 0 1px var(--t-brilho),0 0 24px -4px color-mix(in srgb,var(--t-brilho) 60%,transparent)}[data-modelo] a.group:hover:not(:has(>div:first-child)){box-shadow:0 0 0 1px var(--t-brilho),0 0 24px -4px color-mix(in srgb,var(--t-brilho) 60%,transparent)}[data-modelo] :is(nav,footer,header) a:hover{filter:none;text-shadow:0 0 14px color-mix(in srgb,currentColor 60%,transparent)}[data-modelo] :is(nav,footer,header) a:not([class*="-ul"]):not([class*="border"]):hover{text-decoration:underline;text-decoration-color:currentColor;text-underline-offset:6px}[data-modelo] :is(a,button,select,summary,input,textarea):focus-visible{outline:2px solid var(--t-brilho);outline-offset:3px}@media (prefers-reduced-motion:reduce){[data-modelo] *{transition:none!important}}`;

export function TemaRoot({ tema, v, children }: { tema: TemaKey; v: Variacao; children: ReactNode }) {
  const base = v.paleta;
  // Fundo escuro: bordas claras (visíveis) e destaque sempre legível (contraste >= 4.5 sobre o fundo).
  const escuro = lum(base.bg) < 0.2;
  const p = escuro
    ? {
        ...base,
        line: `color-mix(in srgb, ${base.fg} 34%, transparent)`,
        accent: contraste(base.accent, base.bg) >= 4.5 ? base.accent : `color-mix(in srgb, ${base.accent} 45%, ${base.fg})`,
      }
    : base;
  // Texto sobre fundo de destaque: o que tiver mais contraste (claro ou escuro).
  const acentoHex = escuro && p.accent !== base.accent ? null : base.accent;
  const sobreAcento = acentoHex ? (contraste(acentoHex, "#141414") >= contraste(acentoHex, "#ffffff") ? "#141414" : "#ffffff") : "#141414";
  const style = {
    "--t-on-accent": sobreAcento,
    // Cor do "acender" ao passar o mouse / focar: o destaque principal do modelo.
    "--t-brilho": base.primary,
    "--t-bg": p.bg,
    "--t-fg": p.fg,
    "--t-primary": p.primary,
    "--t-on-primary": p.onPrimary,
    "--t-accent": p.accent,
    "--t-surface": p.surface,
    "--t-muted": p.muted,
    "--t-line": p.line,
    "--t-titulo": fonteVar(v.fontes.titulo),
    "--t-texto": fonteVar(v.fontes.texto),
    "--t-detalhe": fonteVar(v.fontes.detalhe ?? v.fontes.titulo),
    // Mesmas cores/fontes para os componentes JÁ existentes da loja (carrinho, checkout, avaliações…):
    // eles leem estas variáveis, então herdam o modelo sem serem reescritos.
    "--background": p.bg,
    "--foreground": p.fg,
    "--card": p.surface,
    "--card-foreground": p.fg,
    "--popover": p.surface,
    "--popover-foreground": p.fg,
    "--primary": p.primary,
    "--primary-foreground": p.onPrimary,
    "--secondary": p.surface,
    "--secondary-foreground": p.fg,
    "--muted": p.surface,
    "--muted-foreground": p.muted,
    "--accent": p.surface,
    "--accent-foreground": p.fg,
    "--border": p.line,
    "--input": p.line,
    "--ring": p.primary,
    "--font-young-serif": fonteVar(v.fontes.titulo),
    "--font-figtree": fonteVar(v.fontes.texto),
    background: p.bg,
    color: p.fg,
    fontFamily: "var(--t-texto)",
    minHeight: "100dvh",
    overflowX: "clip",
  } as CSSProperties;
  return (
    <div data-modelo={tema} className={TEMA_FONT_CLASSES} style={style}>
      {/* Toque: links dos menus com pelo menos 44px de altura em qualquer modelo. */}
      <style dangerouslySetInnerHTML={{ __html: EFEITOS }} />
      {children}
    </div>
  );
}

/** Foto simples (sem otimizador: as fotos já vêm do Storage em WebP). */
export function Foto({ src, alt, className, style }: { src: string; alt: string; className?: string; style?: CSSProperties }) {
  if (!src) return <div className={className} style={{ background: "var(--t-surface)", ...style }} aria-hidden="true" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" decoding="async" className={className} style={style} />;
}

