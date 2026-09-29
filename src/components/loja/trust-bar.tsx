import Link from "next/link";
import { Gift, Star } from "lucide-react";
import { getTenantId } from "@/lib/tenant/context";
import { getReviewsSummary } from "@/modules/reviews/service";
import { getDeliverySettings } from "@/modules/delivery/settings";
import { DeliveryToday } from "./delivery-today";

/**
 * Faixa fina de confiança abaixo do banner: nota real, entrega e cartão.
 * Nota só aparece com avaliação aprovada (nunca inventada); a frase de entrega
 * só com horário de entrega cadastrado. Estática (a hora é calculada no cliente).
 */
export async function TrustBar() {
  const tenantId = await getTenantId();
  const [summary, delivery] = await Promise.all([
    getReviewsSummary(tenantId).catch(() => ({ average: 0, total: 0 })),
    getDeliverySettings(tenantId).catch(() => null),
  ]);

  return (
    <div className="border-y border-border/70 bg-card/60">
      <ul className="mx-auto flex max-w-[1800px] items-center gap-x-8 gap-y-1 overflow-x-auto px-4 py-1 text-sm text-foreground [scrollbar-width:none] sm:px-6 lg:px-8 2xl:px-12 [&::-webkit-scrollbar]:hidden">
        {summary.total > 0 ? (
          <li className="shrink-0">
            <Link href="/avaliacoes" className="inline-flex min-h-11 items-center gap-1.5 hover:text-primary">
              <Star aria-hidden="true" className="size-4 fill-[var(--jc-gold)] text-[var(--jc-gold)]" />
              <span className="font-semibold tabular-nums">{summary.average.toFixed(1).replace(".", ",")}</span>
              <span className="text-muted-foreground">
                · {summary.total} {summary.total === 1 ? "avaliação" : "avaliações"}
              </span>
            </Link>
          </li>
        ) : null}
        {delivery ? (
          <li className="flex min-h-11 shrink-0 items-center">
            <DeliveryToday
              settings={{
                slotMinutes: delivery.slotMinutes,
                leadTimeHours: delivery.leadTimeHours,
                horizonDays: delivery.horizonDays,
                hours: delivery.hours,
                blockedDates: delivery.blockedDates,
              }}
            />
          </li>
        ) : null}
        <li className="flex min-h-11 shrink-0 items-center gap-1.5">
          <Gift aria-hidden="true" className="size-4 text-primary" strokeWidth={1.8} />
          <span>Cartão de mensagem personalizado</span>
        </li>
      </ul>
    </div>
  );
}
