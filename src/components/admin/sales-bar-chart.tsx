import { formatCents } from "@/lib/money";
import { addDaysToDateStr, compareDateStr } from "@/lib/time/sao-paulo";
import type { SalesDay } from "@/modules/sales/service";

/** Gráfico de barras simples em SVG puro -- sem biblioteca nova só pra isso. */
export function SalesBarChart({ days, from, to }: { days: SalesDay[]; from: string; to: string }) {
  const byDay = new Map(days.map((d) => [d.day, d.revenueCents]));
  const series: { day: string; revenueCents: number }[] = [];
  for (let d = from; compareDateStr(d, to) <= 0; d = addDaysToDateStr(d, 1)) {
    series.push({ day: d, revenueCents: byDay.get(d) ?? 0 });
  }

  const max = Math.max(1, ...series.map((s) => s.revenueCents));
  const width = 100;
  const height = 40;
  const barWidth = width / series.length;

  if (series.every((s) => s.revenueCents === 0)) {
    return <p className="text-sm text-muted-foreground">Sem vendas confirmadas nesse período.</p>;
  }

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full overflow-visible" preserveAspectRatio="none">
        {series.map((s, i) => {
          const barHeight = (s.revenueCents / max) * height;
          return (
            <rect
              key={s.day}
              x={i * barWidth + barWidth * 0.15}
              y={height - barHeight}
              width={barWidth * 0.7}
              height={barHeight}
              rx={barWidth * 0.15}
              className="fill-primary"
            >
              <title>
                {s.day.split("-").reverse().join("/")}: {formatCents(s.revenueCents)}
              </title>
            </rect>
          );
        })}
      </svg>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{series[0]?.day.split("-").reverse().join("/")}</span>
        <span>{series[series.length - 1]?.day.split("-").reverse().join("/")}</span>
      </div>
    </div>
  );
}
