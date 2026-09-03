import Link from "next/link";
import { AlertTriangle, ShoppingBag, Receipt, TrendingUp } from "lucide-react";
import { getSalesSummary, getSalesByDay, getTopProducts, getLowStockProducts } from "@/modules/sales/service";
import { SalesBarChart } from "@/components/admin/sales-bar-chart";
import { formatCents } from "@/lib/money";
import { saoPauloDateStr, addDaysToDateStr } from "@/lib/time/sao-paulo";

const PERIODS = [
  { days: 7, label: "7 dias" },
  { days: 30, label: "30 dias" },
  { days: 90, label: "90 dias" },
];

export default async function AdminDashboardPage(props: PageProps<"/admin">) {
  const params = await props.searchParams;
  const periodDays = Number(params?.dias) || 30;
  const to = saoPauloDateStr();
  const from = addDaysToDateStr(to, -(periodDays - 1));

  const [summary, byDay, topProducts, lowStock] = await Promise.all([
    getSalesSummary(from, to),
    getSalesByDay(from, to),
    getTopProducts(from, to),
    getLowStockProducts(),
  ]);

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-foreground">Vendas</h1>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <Link
              key={p.days}
              href={`/admin?dias=${p.days}`}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                periodDays === p.days
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-accent"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-card border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="size-4" /> Faturamento
          </div>
          <p className="mt-2 font-display text-2xl text-foreground">{formatCents(summary.revenueCents)}</p>
        </div>
        <div className="rounded-card border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShoppingBag className="size-4" /> Pedidos pagos
          </div>
          <p className="mt-2 font-display text-2xl text-foreground">{summary.ordersCount}</p>
        </div>
        <div className="rounded-card border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Receipt className="size-4" /> Ticket médio
          </div>
          <p className="mt-2 font-display text-2xl text-foreground">{formatCents(summary.avgTicketCents)}</p>
        </div>
      </div>

      <div className="mt-4 rounded-card border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Vendas por dia</h2>
        <div className="mt-4">
          <SalesBarChart days={byDay} from={from} to={to} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-card border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Cestas mais vendidas</h2>
          {topProducts.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Sem vendas confirmadas nesse período.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {topProducts.map((p) => (
                <li key={p.name} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-foreground">
                    {p.qty}x {p.name}
                  </span>
                  <span className="shrink-0 text-muted-foreground">{formatCents(p.revenueCents)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-card border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <AlertTriangle className="size-4 text-destructive" /> Estoque baixo
          </h2>
          {lowStock.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Nenhuma cesta com estoque baixo.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                  <Link href={`/admin/produtos/${p.id}`} className="truncate text-foreground hover:text-primary">
                    {p.name}
                  </Link>
                  <span className="shrink-0 font-medium text-destructive">{p.stockQuantity} em estoque</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
