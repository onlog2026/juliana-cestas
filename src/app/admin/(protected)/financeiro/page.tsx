import type { Metadata } from "next";
import { TrendingUp, ShoppingBag, Receipt } from "lucide-react";
import { requireStaffWithModule } from "@/lib/auth/require-module";
import { formatCents } from "@/lib/money";
import { addDaysToDateStr, saoPauloDateStr } from "@/lib/time/sao-paulo";
import { getSalesSummary, getSalesByDay } from "@/modules/sales/service";
import {
  getFinanceStatus,
  listFinanceExtract,
  buildExtractCsv,
  orderStatusLabel,
  paymentStatusLabel,
  billingTypeLabel,
} from "@/modules/finance/service";
import { SalesBarChart } from "@/components/admin/sales-bar-chart";
import { FinanceSummary } from "@/components/admin/finance-summary";
import { FinanceExtract, type FinanceExtractRow } from "@/components/admin/finance-extract";

export const metadata: Metadata = { title: "Financeiro" };

const DATA_HORA_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** "dd/mm/aaaa hh:mm", sem a vírgula que `toLocaleString` insere dependendo do ICU. */
function formatarDataHoraBr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const partes = DATA_HORA_FORMATTER.formatToParts(d);
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "";
  return `${valor("day")}/${valor("month")}/${valor("year")} ${valor("hour")}:${valor("minute")}`;
}

export default async function AdminFinanceiroPage(props: {
  searchParams: Promise<{ de?: string; ate?: string; atualizar?: string }>;
}) {
  const staff = await requireStaffWithModule("financeiro");
  const params = await props.searchParams;

  const hoje = saoPauloDateStr();
  const de = params.de || addDaysToDateStr(hoje, -29);
  const ate = params.ate || hoje;
  const forcarAtualizacao = params.atualizar === "1";

  const [status, vendas, vendasPorDia, extrato] = await Promise.all([
    getFinanceStatus(staff.tenantId, { forceRefresh: forcarAtualizacao }),
    getSalesSummary(staff.tenantId, de, ate),
    getSalesByDay(staff.tenantId, de, ate),
    listFinanceExtract(staff.tenantId, de, ate),
  ]);

  const csv = buildExtractCsv(extrato);
  const extractRows: FinanceExtractRow[] = extrato.map((r) => ({
    orderId: r.orderId,
    orderNumber: r.orderNumber,
    dateLabel: formatarDataHoraBr(r.createdAt),
    buyerName: r.buyerName,
    totalCents: r.totalCents,
    orderStatusLabel: orderStatusLabel(r.orderStatus),
    paymentStatusLabel: paymentStatusLabel(r.paymentStatus),
    billingTypeLabel: billingTypeLabel(r.billingType),
  }));

  const refreshHref = `/admin/financeiro?de=${de}&ate=${ate}&atualizar=1`;

  return (
    <div className="max-w-[1100px]">
      <h1 className="font-display text-2xl text-foreground">Financeiro</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Vendas, saldo e recebíveis da sua loja. O saldo e os recebíveis vêm direto da sua conta no Asaas.
      </p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-foreground">De</span>
          <input
            type="date"
            name="de"
            defaultValue={de}
            className="h-11 rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-foreground">Até</span>
          <input
            type="date"
            name="ate"
            defaultValue={ate}
            className="h-11 rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground"
          />
        </label>
        <button
          type="submit"
          className="h-11 rounded-[10px] border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-accent"
        >
          Filtrar
        </button>
      </form>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-card border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="size-4" /> Faturamento do período
          </div>
          <p className="mt-2 font-display text-2xl text-foreground">{formatCents(vendas.revenueCents)}</p>
        </div>
        <div className="rounded-card border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShoppingBag className="size-4" /> Pedidos pagos
          </div>
          <p className="mt-2 font-display text-2xl text-foreground">{vendas.ordersCount}</p>
        </div>
        <div className="rounded-card border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Receipt className="size-4" /> Ticket médio
          </div>
          <p className="mt-2 font-display text-2xl text-foreground">{formatCents(vendas.avgTicketCents)}</p>
        </div>
      </div>

      <div className="mt-4 rounded-card border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Vendas por dia</h2>
        <div className="mt-4">
          <SalesBarChart days={vendasPorDia} from={de} to={ate} />
        </div>
      </div>

      <div className="mt-4">
        <FinanceSummary status={status} refreshHref={refreshHref} />
      </div>

      <div className="mt-8">
        <FinanceExtract rows={extractRows} csv={csv} from={de} to={ate} />
      </div>
    </div>
  );
}
