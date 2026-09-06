import { Check, ArrowRight, Lock } from "lucide-react";
import type { PlatformContent } from "@/modules/platform/landing-content";

/**
 * Primeiro dobra.
 *
 * Composição assimétrica de propósito (7 colunas de texto, 5 de imagem-cartão):
 * herói centralizado sobre degradê é a cara de página gerada por robô. A cor
 * sai toda dos tokens da marca -- nada de paleta nova.
 */
export function LandingHero({ hero }: { hero: PlatformContent["hero"] }) {
  return (
    <section className="border-b border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            {hero.eyebrow ? (
              <span className="inline-flex items-center rounded-full border border-primary/25 bg-card px-3 py-1 text-xs font-semibold tracking-wide text-primary uppercase">
                {hero.eyebrow}
              </span>
            ) : null}

            <h1 className="mt-4 font-display text-[1.9rem] leading-[1.12] text-foreground sm:text-4xl lg:text-[2.9rem]">
              {hero.title}
            </h1>

            {hero.subtitle ? (
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {hero.subtitle}
              </p>
            ) : null}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Âncoras: /cadastro e /planos são a próxima fase. */}
              <a
                href="/cadastro"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground transition-transform hover:bg-primary/90 active:scale-[0.98]"
              >
                {hero.primaryLabel}
                <ArrowRight className="size-4" />
              </a>
              {hero.secondaryLabel ? (
                <a
                  href="/planos"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-primary/30 px-7 text-base font-semibold text-primary transition-colors hover:bg-accent"
                >
                  {hero.secondaryLabel}
                </a>
              ) : null}
            </div>

            {hero.proof ? (
              <p className="mt-6 max-w-lg border-l-2 border-primary/30 pl-3 text-sm text-muted-foreground">
                {hero.proof}
              </p>
            ) : null}
          </div>

          {/* Cartão-ilustração: a mesma ideia da vitrine que o lojista vai ter.
              Sem número inventado -- só o que a plataforma realmente entrega. */}
          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-card border border-border bg-card shadow-[var(--jc-shadow)]">
              <div className="flex items-center gap-2 border-b border-border bg-secondary/60 px-3 py-2.5">
                <span className="flex gap-1" aria-hidden>
                  <span className="size-2 rounded-full bg-border" />
                  <span className="size-2 rounded-full bg-border" />
                  <span className="size-2 rounded-full bg-border" />
                </span>
                <span className="ml-1 flex min-w-0 flex-1 items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs text-muted-foreground">
                  <Lock className="size-3 shrink-0" />
                  <span className="truncate">www.sualoja.com.br</span>
                </span>
              </div>

              <ul className="divide-y divide-border">
                {hero.highlights.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                      <Check className="size-3.5" />
                    </span>
                    <span className="text-sm text-foreground">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
