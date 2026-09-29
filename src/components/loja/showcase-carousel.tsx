"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Item = { id: string; node: ReactNode };

/** Embaralha (Fisher–Yates) sem mexer no array original. */
function shuffle<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const STEP_MS = 3500;

/**
 * Carrossel das vitrines "Mais comprados / Mais clicados". A ordem inicial é a
 * do servidor (igual ao HTML estático, sem troca na hidratação); depois de
 * hidratar, embaralha UMA vez no navegador. Anda sozinho, devagar, e PARA com o
 * mouse por cima, foco de teclado, toque ou aba escondida. Quem pede "menos
 * movimento" no sistema não tem rolagem automática (só as setas).
 */
export function ShowcaseCarousel({ title, items }: { title: string; items: Item[] }) {
  const [list, setList] = useState(items);
  const trackRef = useRef<HTMLUListElement>(null);
  const pausedRef = useRef(false);
  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    setList(shuffle(items));
  }, [items]);

  const step = useCallback((dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const width = (card?.getBoundingClientRect().width ?? 240) + 20;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    if (dir === 1 && atEnd) el.scrollTo({ left: 0, behavior: "smooth" });
    else if (dir === -1 && el.scrollLeft <= 4) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    else el.scrollBy({ left: dir * width, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => setCanScroll(el.scrollWidth > el.clientWidth + 4);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [list]);

  useEffect(() => {
    if (!canScroll) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (pausedRef.current || document.hidden) return;
      step(1);
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, [canScroll, step]);

  const pause = () => {
    pausedRef.current = true;
  };
  const resume = () => {
    pausedRef.current = false;
  };

  return (
    <section
      className="mx-auto max-w-[1800px] px-4 pt-10 sm:px-6 lg:px-8 2xl:px-12"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      onTouchStart={pause}
      onTouchEnd={() => window.setTimeout(resume, 4000)}
    >
      <div className="flex items-end justify-between gap-3">
        <h2 className="font-display text-2xl text-foreground sm:text-3xl">{title}</h2>
        {canScroll ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label={`${title}: anterior`}
              className="flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-accent"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label={`${title}: próximo`}
              className="flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-accent"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        ) : null}
      </div>
      <ul
        ref={trackRef}
        className="mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] sm:gap-7 [&::-webkit-scrollbar]:hidden"
      >
        {list.map((item) => (
          <li
            key={item.id}
            className="w-[calc((100%-1.25rem)/2)] shrink-0 snap-start sm:w-[calc((100%-3.5rem)/3)] lg:w-[calc((100%-5.25rem)/4)] xl:w-[calc((100%-7rem)/5)] 2xl:w-[calc((100%-8.75rem)/6)]"
          >
            {item.node}
          </li>
        ))}
      </ul>
    </section>
  );
}
