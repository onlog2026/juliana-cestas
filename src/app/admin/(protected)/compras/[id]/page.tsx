import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireStaffWithModule } from "@/lib/auth/require-module";
import { formatCents } from "@/lib/money";
import { obterCompra } from "@/modules/purchases/service";
import { formatarDataBr } from "@/components/admin/purchase-list";

export default async function AdminCompraDetalhePage(props: { params: Promise<{ id: string }> }) {
  const staff = await requireStaffWithModule("compras");
  const { id } = await props.params;

  // A leitura já filtra por loja: id de compra de outra loja devolve nada.
  const compra = await obterCompra(staff.tenantId, id);
  if (!compra) notFound();

  // Conferência visível: a soma dos itens tem que bater com o total gravado.
  // Se um dia não bater, é melhor a lojista ver o aviso do que confiar num
  // número calado.
  const somaDosItens = compra.itens.reduce((soma, item) => soma + item.totalCents, 0);
  const bate = somaDosItens === compra.totalCents;

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/compras"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Voltar para compras
      </Link>

      <h1 className="mt-3 font-display text-2xl text-foreground">
        Compra de {formatarDataBr(compra.purchasedAt)}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Fornecedor: {compra.supplierName ?? "não informado"}
        {compra.invoiceNumber ? ` · Nota ${compra.invoiceNumber}` : ""}
      </p>

      <div className="mt-6 overflow-x-auto rounded-card border border-border bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">Entrou no estoque de</th>
              <th className="px-4 py-3 text-right font-medium">Quantidade</th>
              <th className="px-4 py-3 text-right font-medium">Custo unitário</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {compra.itens.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-foreground">{item.description}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {item.productId && item.productName ? (
                    <Link href={`/admin/produtos/${item.productId}`} className="text-primary hover:underline">
                      {item.productName}
                    </Link>
                  ) : (
                    "Insumo avulso (não mexe no estoque)"
                  )}
                </td>
                <td className="px-4 py-3 text-right text-foreground">{item.quantity}</td>
                <td className="px-4 py-3 text-right text-foreground">{formatCents(item.unitCostCents)}</td>
                <td className="px-4 py-3 text-right font-medium text-foreground">
                  {formatCents(item.totalCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-card p-5">
        <span className="text-sm text-foreground">Total da compra</span>
        <span className="font-display text-2xl text-foreground">{formatCents(compra.totalCents)}</span>
      </div>

      {!bate ? (
        <p className="mt-3 rounded-[10px] border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          Atenção: a soma dos itens ({formatCents(somaDosItens)}) não bate com o total gravado. Registre uma
          compra nova com os valores certos e avise quem cuida do sistema — não altere esta.
        </p>
      ) : null}

      {compra.notes ? (
        <div className="mt-4 rounded-card border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Observações</h2>
          <p className="mt-1 text-sm text-muted-foreground">{compra.notes}</p>
        </div>
      ) : null}

      <p className="mt-6 text-xs text-muted-foreground">
        A entrada de estoque desta compra está no histórico da tela de{" "}
        <Link href="/admin/estoque" className="text-primary hover:underline">
          Estoque
        </Link>
        . Compra gravada não é apagada nem editada: correção é um lançamento novo.
      </p>
    </div>
  );
}
