import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatCents } from "@/lib/money";
import type { Compra } from "@/modules/purchases/service";

/** "2026-09-05" -> "05/09/2026". Data de calendário, sem fuso no meio. */
export function formatarDataBr(dataIso: string): string {
  const [ano, mes, dia] = dataIso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

/**
 * Lista de compras. Componente de servidor puro (sem estado): só recebe dados
 * já prontos e desenha. Tabela larga vive dentro de `overflow-x-auto`, para o
 * corpo da página nunca rolar de lado no celular.
 */
export function PurchaseList({ compras }: { compras: Compra[] }) {
  if (compras.length === 0) {
    return (
      <p className="rounded-card border border-border bg-card p-5 text-sm text-muted-foreground">
        Nenhuma compra registrada no período. Assim que você registrar a primeira, ela alimenta o estoque e
        aparece como despesa aqui.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-card border border-border bg-card">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="px-4 py-3 font-medium">Data</th>
            <th className="px-4 py-3 font-medium">Fornecedor</th>
            <th className="px-4 py-3 font-medium">Nota</th>
            <th className="px-4 py-3 text-right font-medium">Total</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {compras.map((compra) => (
            <tr key={compra.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
              <td className="px-4 py-3 text-foreground">{formatarDataBr(compra.purchasedAt)}</td>
              <td className="px-4 py-3 text-foreground">{compra.supplierName ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{compra.invoiceNumber ?? "—"}</td>
              <td className="px-4 py-3 text-right font-medium text-foreground">
                {formatCents(compra.totalCents)}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/admin/compras/${compra.id}`}
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Ver <ChevronRight className="size-4" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
