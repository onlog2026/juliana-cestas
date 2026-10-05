"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Foto } from "../../kit";
import { Avatar } from "./post";

/** STORIES — faixa de círculos e visualizador em tela cheia (barras de progresso, toque esquerdo/direito, Esc, sem autoplay se o aparelho pede menos movimento). */

export type Slide = { nome: string; preco: string; imagem: string; href: string };
export type Grupo = { chave: string; nome: string; imagem: string; hrefCategoria: string; slides: Slide[] };

const DURACAO = 5000;
const SEM_EFEITO = { boxShadow: "none", filter: "none" } as const;

export function Historias({ grupos }: { grupos: Grupo[] }) {
  const [aberto, setAberto] = useState<number | null>(null);
  const [i, setI] = useState(0);
  const [vistos, setVistos] = useState<Record<string, boolean>>({});
  const [reduzido, setReduzido] = useState(true);
  const origem = useRef<HTMLElement | null>(null);
  const fecharRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduzido(mq.matches);
    const f = () => setReduzido(mq.matches);
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);

  const abrir = useCallback((n: number) => {
    origem.current = document.activeElement as HTMLElement | null;
    setAberto(n);
    setI(0);
    setVistos((v) => ({ ...v, [grupos[n].chave]: true }));
  }, [grupos]);

  const fechar = useCallback(() => {
    setAberto(null);
    origem.current?.focus?.();
  }, []);

  const proximo = useCallback(() => {
    if (aberto === null) return;
    const g = grupos[aberto];
    if (i < g.slides.length - 1) setI(i + 1);
    else if (aberto < grupos.length - 1) {
      setAberto(aberto + 1);
      setI(0);
      setVistos((v) => ({ ...v, [grupos[aberto + 1].chave]: true }));
    } else fechar();
  }, [aberto, i, grupos, fechar]);

  const anterior = useCallback(() => {
    if (aberto === null) return;
    if (i > 0) setI(i - 1);
    else if (aberto > 0) {
      setAberto(aberto - 1);
      setI(0);
    } else setI(0);
  }, [aberto, i]);

  useEffect(() => {
    if (aberto === null) return;
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    fecharRef.current?.focus();
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
      else if (e.key === "ArrowRight") proximo();
      else if (e.key === "ArrowLeft") anterior();
    };
    window.addEventListener("keydown", tecla);
    return () => {
      document.body.style.overflow = antes;
      window.removeEventListener("keydown", tecla);
    };
  }, [aberto, proximo, anterior, fechar]);

  const g = aberto !== null ? grupos[aberto] : null;
  const s = g ? g.slides[Math.min(i, g.slides.length - 1)] : null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes hs-prog{from{transform:scaleX(0)}to{transform:scaleX(1)}}.hs-fill{transform-origin:left center;animation:hs-prog ${DURACAO}ms linear forwards}@media (prefers-reduced-motion:reduce){.hs-fill{animation:none;transform:scaleX(1)}}[data-historias]::-webkit-scrollbar{display:none}` }} />
      <div data-historias className="flex snap-x gap-4 overflow-x-auto px-4 py-4" style={{ scrollbarWidth: "none" }} role="list" aria-label="Histórias">
        {grupos.map((gr, n) => (
          <button key={gr.chave} type="button" role="listitem" onClick={() => abrir(n)} aria-label={`Abrir histórias: ${gr.nome}`} className="flex w-[76px] shrink-0 snap-start flex-col items-center gap-2 rounded-xl py-1" style={SEM_EFEITO}>
            <span className="rounded-full p-[3px]" style={{ background: vistos[gr.chave] ? "var(--t-line)" : "conic-gradient(var(--t-primary), var(--t-accent), var(--t-primary))" }}>
              <span className="block size-[62px] overflow-hidden rounded-full border-[3px]" style={{ borderColor: "var(--t-bg)", background: "var(--t-surface)" }}>
                <Foto src={gr.imagem} alt="" className="size-full object-cover" />
              </span>
            </span>
            <span className="w-full truncate text-center text-xs" style={{ color: vistos[gr.chave] ? "var(--t-muted)" : "var(--t-fg)" }}>{gr.nome}</span>
          </button>
        ))}
      </div>

      {g && s ? (
        <div role="dialog" aria-modal="true" aria-label={`Histórias: ${g.nome}`} className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--t-fg) 72%, transparent)" }}>
          <div className="relative flex h-dvh w-full max-w-[440px] flex-col overflow-hidden sm:h-[min(92dvh,820px)] sm:rounded-3xl" style={{ background: "var(--t-bg)", color: "var(--t-fg)" }}>
            <div className="px-3 pt-3 pb-2" style={{ background: "var(--t-surface)" }}>
              <div className="flex gap-1" aria-hidden="true">
                {g.slides.map((_, n) => (
                  <span key={n} className="h-[3px] flex-1 overflow-hidden rounded-full" style={{ background: "color-mix(in srgb, var(--t-fg) 20%, transparent)" }}>
                    {n < i ? <span className="block h-full w-full" style={{ background: "var(--t-fg)" }} /> : null}
                    {n === i ? <span key={`${aberto}-${i}`} className="hs-fill block h-full w-full" style={{ background: "var(--t-fg)" }} onAnimationEnd={proximo} /> : null}
                  </span>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-3">
                <Avatar imagem={g.imagem} alt="" tamanho="size-9" />
                <p className="min-w-0 flex-1 truncate text-sm font-semibold">{g.nome}</p>
                <button ref={fecharRef} type="button" onClick={fechar} aria-label="Fechar histórias" className="flex size-11 items-center justify-center rounded-full"><X className="size-5" /></button>
              </div>
            </div>

            <div className="relative min-h-0 flex-1" style={{ background: "var(--t-surface)" }}>
              <Foto key={s.imagem} src={s.imagem} alt={s.nome} className="absolute inset-0 size-full object-cover" />
              <button type="button" onClick={anterior} aria-label="História anterior" className="absolute inset-y-0 left-0 w-1/3 border-0" style={SEM_EFEITO} />
              <button type="button" onClick={proximo} aria-label="Próxima história" className="absolute inset-y-0 right-0 w-2/3 border-0" style={SEM_EFEITO} />
            </div>

            <div className="px-4 pt-4" style={{ background: "var(--t-bg)", paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
              <p className="line-clamp-2 text-lg leading-snug font-semibold" style={{ fontFamily: "var(--t-titulo)" }}>{s.nome}</p>
              <div className="mt-3 flex items-center gap-3">
                <p className="flex-1 text-xl font-bold tabular-nums">{s.preco}</p>
                <a href={s.href} className="inline-flex min-h-12 items-center rounded-full px-7 font-semibold" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>Ver cesta</a>
              </div>
              <a href={g.hrefCategoria} className="mt-2 inline-flex min-h-11 items-center text-sm underline" style={{ color: "var(--t-muted)" }}>Ver tudo de {g.nome}</a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
