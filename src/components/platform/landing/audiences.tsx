import { PlatformIcon } from "@/components/platform/landing/icons";
import type { PlatformContent } from "@/modules/platform/landing-content";

/**
 * "Para quem é".
 *
 * Faixa contínua com fios de separação (`gap-px` sobre fundo de borda) em vez
 * de cartões soltos e iguais -- lê como uma lista de nichos, não como três
 * caixinhas de template.
 */
export function LandingAudiences({ audiences }: { audiences: PlatformContent["audiences"] }) {
  if (audiences.items.length === 0) return null;

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl text-foreground sm:text-3xl">{audiences.title}</h2>
          {audiences.subtitle ? (
            <p className="mt-2 text-base text-muted-foreground">{audiences.subtitle}</p>
          ) : null}
        </div>

        <ul className="mt-8 grid gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {audiences.items.map((item, i) => (
            <li key={i} className="bg-card p-5">
              <span className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <PlatformIcon name={item.icon} className="size-5" />
              </span>
              <h3 className="mt-3 font-medium text-foreground">{item.name}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
