import { ChevronDown } from "lucide-react";
import type { PlatformContent } from "@/modules/platform/landing-content";

/**
 * Perguntas frequentes.
 *
 * Acordeão com `<details>`/`<summary>` nativos: abre e fecha sem JavaScript
 * nenhum, funciona com teclado e com leitor de tela de graça, e não some se a
 * hidratação falhar. A área de toque do `summary` tem 44px de altura mínima.
 */
export function LandingFaq({ faq }: { faq: PlatformContent["faq"] }) {
  if (faq.items.length === 0) return null;

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4">
            <h2 className="font-display text-2xl text-foreground sm:text-3xl">{faq.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Não achou a sua pergunta?{" "}
              <a href="/cadastro" className="font-medium text-primary hover:underline">
                Fale com a gente
              </a>
              .
            </p>
          </div>

          <div className="lg:col-span-8">
            <div className="divide-y divide-border overflow-hidden rounded-card border border-border bg-card">
              {faq.items.map((item, i) => (
                <details key={i} className="group">
                  {/* `list-none` sozinho não some com o triângulo no Safari --
                      lá o marcador é `::-webkit-details-marker`. */}
                  <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-left font-medium text-foreground marker:content-none hover:bg-accent/40 sm:px-5 [&::-webkit-details-marker]:hidden">
                    <span>{item.question}</span>
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="px-4 pb-4 text-sm leading-relaxed whitespace-pre-line text-muted-foreground sm:px-5">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
