"use client";

import { Download } from "lucide-react";
import { formatCents } from "@/lib/money";

/**
 * Extrato: pedidos cruzados com o pagamento correspondente, com exportação em
 * CSV.
 *
 * O CSV já vem PRONTO do servidor (`buildExtractCsv`, em
 * `modules/finance/service.ts`) — este componente só recebe a string e cria
 * o arquivo no navegador na hora do clique (Blob + link temporário). Nada de
 * segredo passa por aqui: só o que já está na tabela desta tela.
 */

export type FinanceExtractRow = {
  orderId: string;
  orderNumber: number;
  /** Já formatada em pt-BR (dd/mm/aaaa hh:mm) — vem pronta do servidor. */
  dateLabel: string;
  buyerName: string;
  totalCents: number;
  orderStatusLabel: string;
  paymentStatusLabel: string;
  billingTypeLabel: string;
};

export function FinanceExtract({
  rows,
  csv,
  from,
  to,
}: {
  rows: FinanceExtractRow[];
  csv: string;
  from: string;
  to: string;
}) {
  function baixarCsv() {
    // BOM (﻿) na frente: sem ele o Excel em português abre acento
    // trocado (UTF-8 sem BOM vira "AtualizaÃ§Ã£o" na tela da lojista).
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `financeiro-${from}-a-${to}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Extrato de pedidos</h2>
        <button
          type="button"
          onClick={baixarCsv}
          disabled={rows.length === 0}
          className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-border bg-background px-3.5 text-xs font-medium text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="size-3.5" /> Exportar CSV
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="mt-3 rounded-card border border-border bg-card p-5 text-sm text-muted-foreground">
          Nenhum pedido nesse período.
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-card border border-border bg-card">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Pedido</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 text-right font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Status do pedido</th>
                <th className="px-4 py-3 font-medium">Pagamento</th>
                <th className="px-4 py-3 font-medium">Forma</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.orderId} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap text-foreground">#{r.orderNumber}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{r.dateLabel}</td>
                  <td className="px-4 py-3 text-foreground">{r.buyerName}</td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">{formatCents(r.totalCents)}</td>
                  <td className="px-4 py-3 text-foreground">{r.orderStatusLabel}</td>
                  <td className="px-4 py-3 text-foreground">{r.paymentStatusLabel}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.billingTypeLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
