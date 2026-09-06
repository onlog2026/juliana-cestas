import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PlatformContent } from "@/modules/platform/landing-content";

/**
 * Última chamada + rodapé.
 *
 * A faixa escura usa `primary`/`primary-foreground` -- o mesmo par de tokens da
 * marca invertido, igual à barra lateral do painel. Nenhuma cor nova entra na
 * página só para "dar contraste no fim".
 */
export function LandingClosing({
  closing,
  wordmark,
}: {
  closing: PlatformContent["closing"];
  wordmark: string;
}) {
  const ano = new Date().getFullYear();

  return (
    <>
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-14 sm:px-6 sm:py-16 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl sm:text-3xl">{closing.title}</h2>
            {closing.body ? (
              <p className="mt-2 text-base text-primary-foreground/85">{closing.body}</p>
            ) : null}
          </div>
          <a
            href="/cadastro"
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-primary-foreground px-7 text-base font-semibold text-primary transition-transform hover:opacity-90 active:scale-[0.98]"
          >
            {closing.buttonLabel}
            <ArrowRight className="size-4" />
          </a>
        </div>
      </section>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            <span className="font-medium text-foreground">{wordmark}</span>
            {closing.footerNote ? ` — ${closing.footerNote}` : ""}
          </p>
          {/* `min-h-11`: links de navegação do rodapé também precisam de 44px
              de alvo de toque no celular. */}
          <div className="flex flex-wrap items-center gap-x-5">
            <a href="/planos" className="inline-flex min-h-11 items-center hover:text-foreground">
              Planos
            </a>
            <Link href="/admin/login" className="inline-flex min-h-11 items-center hover:text-foreground">
              Entrar na minha loja
            </Link>
            <span className="inline-flex min-h-11 items-center">© {ano}</span>
          </div>
        </div>
      </footer>
    </>
  );
}
