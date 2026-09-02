"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function Reveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!("IntersectionObserver" in window)) {
      el.classList.add("jc-in");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("jc-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    observer.observe(el);

    // Rede de segurança: em alguns ambientes o IntersectionObserver existe
    // mas não dispara (visto antes em produção no Agentop). Se isso
    // acontecer, o pior cenário aqui não pode ser conteúdo invisível pra
    // sempre — depois de um tempo, revela de qualquer jeito.
    const fallback = window.setTimeout(() => el.classList.add("jc-in"), 1800);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <div ref={ref} className={`jc-reveal ${className}`}>
      {children}
    </div>
  );
}
