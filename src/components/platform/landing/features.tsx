import { PlatformIcon } from "@/components/platform/landing/icons";
import type { PlatformContent } from "@/modules/platform/landing-content";

/**
 * "O que você recebe".
 *
 * O PRIMEIRO item ocupa duas colunas e duas linhas: é a hierarquia real da
 * seção (a loja no ar é o que a pessoa está comprando; o resto acompanha).
 * Grade de cartões todos do mesmo tamanho não tem hierarquia nenhuma -- e é
 * exatamente a cara de página feita por robô.
 */
export function LandingFeatures({ features }: { features: PlatformContent["features"] }) {
  if (features.items.length === 0) return null;

  const [principal, ...restantes] = features.items;

  return (
    <section className="border-b border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl text-foreground sm:text-3xl">{features.title}</h2>
          {features.subtitle ? (
            <p className="mt-2 text-base text-muted-foreground">{features.subtitle}</p>
          ) : null}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-card border border-primary/25 bg-card p-6 md:col-span-2 md:row-span-2 md:flex md:flex-col md:justify-center md:p-8">
            <span className="flex size-12 items-center justify-center rounded-[14px] bg-primary text-primary-foreground">
              <PlatformIcon name={principal.icon} className="size-6" />
            </span>
            <h3 className="mt-4 font-display text-xl text-foreground sm:text-2xl">{principal.title}</h3>
            <p className="mt-2 max-w-lg text-base leading-relaxed text-muted-foreground">
              {principal.description}
            </p>
          </article>

          {restantes.map((item, i) => (
            <article key={i} className="rounded-card border border-border bg-card p-5">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <PlatformIcon name={item.icon} className="size-[18px]" />
                </span>
                <h3 className="font-medium text-foreground">{item.title}</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
