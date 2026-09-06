import Link from "next/link";
import { Boxes, Receipt, TrendingDown } from "lucide-react";
import { requireStaffWithModule } from "@/lib/auth/require-module";
import { formatCents } from "@/lib/money";
import { addDaysToDateStr, saoPauloDateStr } from "@/lib/time/sao-paulo";
import { gastoEmCompras, listarCompras, listarFornecedores } from "@/modules/purchases/service";
import { listarEstoque, resumirEstoque } from "@/modules/inventory/service";
import { PurchaseForm } from "@/components/admin/purchase-form";
import { PurchaseList } from "@/components/admin/purchase-list";
import { SupplierForm } from "@/components/admin/supplier-form";
import { SalesBarChart } from "@/components/admin/sales-bar-chart";

const PERIODOS = [
  { dias: 30, label: "30 dias" },
  { dias: 90, label: "90 dias" },
  { dias: 365, label: "12 meses" },
];

export default async function AdminComprasPage(props: {
  searchParams: Promise<{ dias?: string }>;
}) {
  const staff = await requireStaffWithModule("compras");
  const params = await props.searchParams;

  const dias = PERIODOS.some((p) => p.dias === Number(params.dias)) ? Number(params.dias) : 30;
  const ate = saoPauloDateStr();
  const de = addDaysToDateStr(ate, -(dias - 1));

  const [compras, fornecedores, gasto, linhasEstoque] = await Promise.all([
    listarCompras(staff.tenantId, { de, ate }),
    listarFornecedores(staff.tenantId),
    gastoEmCompras(staff.tenantId, de, ate),
    listarEstoque(staff.tenantId),
  ]);
  const resumoEstoque = resumirEstoque(linhasEstoque);

  // REUSO do gráfico de barras SVG das vendas — nenhuma biblioteca nova entra
  // no projeto por causa desta tela. Ele espera `revenueCents`; aqui o valor é
  // gasto, não receita, e o título do bloco deixa isso explícito.
  const serieDoGrafico = gasto.porDia.map((d) => ({
    day: d.day,
    revenueCents: d.totalCents,
    ordersCount: 0,
  }));

  const valorParadoTexto =
    resumoEstoque.valorParado.produtosContados === 0
      ? "—"
      : formatCents(resumoEstoque.valorParado.valorCents);

  const produtosParaCompra = linhasEstoque
    .filter((l) => l.active)
    .map((l) => ({ id: l.id, name: l.name }));

  return (
    <div className="max-w-[1100px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-foreground">Compras</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registre o que você comprou dos fornecedores. Cada item ligado a uma cesta entra no estoque na
            hora, e a compra inteira vira despesa no resumo.
          </p>
        </div>
        <div className="flex gap-2">
          {PERIODOS.map((p) => (
            <Link
              key={p.dias}
              href={`/admin/compras?dias=${p.dias}`}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                dias === p.dias
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
            <TrendingDown className="size-4" /> Gasto em compras
          </div>
          <p className="mt-2 font-display text-2xl text-foreground">{formatCents(gasto.totalCents)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Soma das compras registradas no período.</p>
        </div>
        <div className="rounded-card border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Receipt className="size-4" /> Compras registradas
          </div>
          <p className="mt-2 font-display text-2xl text-foreground">{compras.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {fornecedores.length} fornecedor(es) cadastrado(s).
          </p>
        </div>
        <div className="rounded-card border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Boxes className="size-4" /> Valor parado em estoque
          </div>
          <p className="mt-2 font-display text-2xl text-foreground">{valorParadoTexto}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {resumoEstoque.valorParado.produtosContados === 0
              ? "Ainda não dá para saber: nenhuma cesta ativa tem custo e estoque ao mesmo tempo."
              : resumoEstoque.valorParado.produtosIncompletos > 0
                ? `Faltam ${resumoEstoque.valorParado.produtosIncompletos} cesta(s) sem custo ou sem estoque — o valor real é maior.`
                : "Custo × saldo de todas as cestas ativas."}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-card border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Gasto com compras por dia</h2>
        <div className="mt-4">
          <SalesBarChart days={serieDoGrafico} from={de} to={ate} />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-foreground">Nova compra</h2>
        <div className="mt-3">
          <PurchaseForm fornecedores={fornecedores} produtos={produtosParaCompra} hoje={ate} />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-foreground">Compras do período</h2>
        <div className="mt-3">
          <PurchaseList compras={compras} />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-foreground">Fornecedores</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Cadastrar é opcional: dá para registrar uma compra sem fornecedor. Cadastre quem se repete, para
          conseguir olhar o gasto por fornecedor depois.
        </p>
        <div className="mt-3">
          <SupplierForm fornecedores={fornecedores} />
        </div>
      </div>
    </div>
  );
}
