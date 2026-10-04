import type { CSSProperties, ReactNode } from "react";
import { TEMA_FONT_CLASSES, fonteVar } from "./fonts";
import type { TemaKey, Variacao } from "./types";

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Invólucro de todo modelo: declara as cores (`--t-*`) e fontes (`--t-titulo`,
 * `--t-texto`, `--t-detalhe`) da variação. Os componentes do modelo só usam
 * essas variáveis — trocar a variação nunca exige mexer em componente.
 */
export function TemaRoot({ tema, v, children }: { tema: TemaKey; v: Variacao; children: ReactNode }) {
  const p = v.paleta;
  const style = {
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
    background: p.bg,
    color: p.fg,
    fontFamily: "var(--t-texto)",
    minHeight: "100vh",
  } as CSSProperties;
  return (
    <div data-modelo={tema} className={TEMA_FONT_CLASSES} style={style}>
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
