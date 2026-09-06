import Link from "next/link";
import { getTenantId } from "@/lib/tenant/context";
import { getShowcaseReviews } from "@/modules/reviews/service";
import { Stars } from "./stars";
import { ReviewsCarousel } from "./reviews-carousel";

/**
 * A VITRINE DE AVALIAÇÕES DA HOME.
 *
 * Regra que manda aqui: **sem avaliação aprovada, não renderiza nada**. Uma
 * seção "O que dizem nossos clientes" vazia (ou com texto de placeholder) é
 * pior do que seção nenhuma — anuncia que a loja não tem prova social.
 *
 * A ordem é embaralhada NO SERVIDOR, com semente do dia (`orderForDay` em
 * `modules/reviews/service`): mesma sequência para servidor e navegador (sem
 * quebrar hidratação), sequência nova a cada dia.
 *
 * Este componente lê no servidor com service role, igual a `FeaturedProducts`
 * — não lê `headers()`, então a home continua estática.
 */
export async function ReviewsShowcase({ limit = 12 }: { limit?: number } = {}) {
  const tenantId = await getTenantId();
  const { reviews, summary } = await getShowcaseReviews(tenantId, limit);

  if (reviews.length === 0) return null;

  return (
    <section id="avaliacoes" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-foreground">Quem já recebeu conta</h2>
          {summary.total > 0 ? (
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Stars rating={summary.average} />
              <span>
                <strong className="text-foreground">
                  {summary.average.toFixed(1).replace(".", ",")}
                </strong>{" "}
                de 5 · {summary.total}{" "}
                {summary.total === 1 ? "avaliação" : "avaliações"}
              </span>
            </p>
          ) : null}
        </div>
        <Link
          href="/avaliacoes"
          className="text-sm font-semibold text-primary transition-colors hover:underline"
        >
          Ver todas
        </Link>
      </div>

      <div className="mt-5">
        <ReviewsCarousel reviews={reviews} />
      </div>
    </section>
  );
}
