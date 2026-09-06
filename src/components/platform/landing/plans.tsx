import { Check, Plus, TriangleAlert } from "lucide-react";
import type { PlatformContent } from "@/modules/platform/landing-content";
import type { PublicPlan } from "@/modules/platform/landing-service";

/**
 * Planos.
 *
 * NENHUM preço nasce aqui: tudo vem de `subscription_plans` em centavos. Se um
 * dia isto passar a ter valor escrito no código, é preço inventado -- foi
 * assim que no Agentop deu para assinar o plano máximo por R$ 1,00.
 *
 * Três estados diferentes de propósito:
 *   1. planos publicados  → mostra os planos;
 *   2. nenhum plano publicado → diz isso;
 *   3. falha ao ler o banco  → diz que FALHOU (não finge que não há planos).
 * Confundir 2 com 3 é o erro clássico: a lista some e ninguém sabe por quê.
 */

const REAIS = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function precoEmReais(centavos: number): string {
  return REAIS.format(centavos / 100);
}

export function LandingPlans({
  intro,
  plans,
}: {
  intro: PlatformContent["plans_intro"];
  /** `null` quando a leitura falhou -- diferente de lista vazia. */
  plans: PublicPlan[] | null;
}) {
  return (
    <section id="planos" className="border-b border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl text-foreground sm:text-3xl">{intro.title}</h2>
          {intro.subtitle ? <p className="mt-2 text-base text-muted-foreground">{intro.subtitle}</p> : null}
        </div>

        {plans === null ? (
          <div className="mt-8 flex items-start gap-3 rounded-card border border-destructive/40 bg-card p-6">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-foreground">Não conseguimos carregar os planos agora.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                É uma falha temporária nossa, não um problema com você. Atualize a página em alguns instantes ou{" "}
                <a href="/cadastro" className="font-medium text-primary hover:underline">
                  fale com a gente
                </a>{" "}
                que a gente passa os valores.
              </p>
              {/* A mensagem técnica do banco NÃO aparece aqui: esta página é
                  pública e o texto do erro do PostgREST entrega nome de tabela
                  e de esquema para qualquer visitante. O detalhe fica no log do
                  servidor (`console.error` em `page.tsx`). */}
            </div>
          </div>
        ) : plans.length === 0 ? (
          <div className="mt-8 rounded-card border border-border bg-card p-6">
            <p className="font-medium text-foreground">Os planos ainda não estão publicados.</p>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Preferimos não mostrar valor nenhum a mostrar um valor que não é o real.{" "}
              <a href="/cadastro" className="font-medium text-primary hover:underline">
                Deixe seu contato
              </a>{" "}
              que a gente avisa assim que abrir.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.slug}
                className={
                  plan.isAnchor
                    ? "rounded-card border-2 border-primary bg-card p-6"
                    : "rounded-card border border-border bg-card p-6"
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-xl text-foreground">{plan.name}</h3>
                  {plan.badge ? (
                    <span className="shrink-0 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground uppercase">
                      {plan.badge}
                    </span>
                  ) : null}
                </div>

                {plan.description ? (
                  <p className="mt-1.5 text-sm text-muted-foreground">{plan.description}</p>
                ) : null}

                <p className="mt-4 flex items-baseline gap-1.5">
                  <span className="font-display text-3xl text-foreground">
                    {plan.monthlyCents === 0 ? "Grátis" : precoEmReais(plan.monthlyCents)}
                  </span>
                  {plan.monthlyCents > 0 ? (
                    <span className="text-sm text-muted-foreground">/mês</span>
                  ) : null}
                </p>

                <a
                  href={`/cadastro?plano=${encodeURIComponent(plan.slug)}`}
                  className={
                    plan.isAnchor
                      ? "mt-5 flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                      : "mt-5 flex h-12 items-center justify-center rounded-full border border-primary/30 px-6 text-sm font-semibold text-primary transition-colors hover:bg-accent"
                  }
                >
                  Começar com o {plan.name}
                </a>

                {plan.included.length > 0 ? (
                  <ul className="mt-5 space-y-2 border-t border-border pt-5">
                    {plan.included.map((f) => (
                      <li key={f.slug} className="flex items-start gap-2 text-sm text-foreground">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>
                          {f.name}
                          {f.limitDisplay ? (
                            <span className="text-muted-foreground"> — {f.limitDisplay}</span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-5 border-t border-border pt-5 text-sm text-muted-foreground">
                    Os recursos deste plano ainda não foram detalhados.
                  </p>
                )}

                {plan.addons.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {plan.addons.map((f) => (
                      <li key={f.slug} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Plus className="mt-0.5 size-4 shrink-0" />
                        <span>{f.name} (adicional)</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        )}

        {intro.note ? <p className="mt-6 text-sm text-muted-foreground">{intro.note}</p> : null}
      </div>
    </section>
  );
}
