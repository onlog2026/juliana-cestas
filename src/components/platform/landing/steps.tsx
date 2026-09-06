import type { PlatformContent } from "@/modules/platform/landing-content";

/**
 * "Como funciona".
 *
 * Aqui o número é legítimo: é uma sequência de verdade, e a ordem importa. Sai
 * da posição na lista (não de um campo que alguém teria que manter certo à
 * mão) -- reordenar no editor renumera sozinho.
 */
export function LandingSteps({ steps }: { steps: PlatformContent["steps"] }) {
  if (steps.items.length === 0) return null;

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl text-foreground sm:text-3xl">{steps.title}</h2>
          {steps.subtitle ? <p className="mt-2 text-base text-muted-foreground">{steps.subtitle}</p> : null}
        </div>

        <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {steps.items.map((item, i) => (
            <li key={i} className="relative border-t-2 border-primary/20 pt-7">
              <span className="absolute -top-5 left-0 flex size-10 items-center justify-center rounded-full bg-primary font-display text-lg text-primary-foreground">
                {i + 1}
              </span>
              <h3 className="font-medium text-foreground">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
