"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Minus, Plus, ScanLine, TriangleAlert } from "lucide-react";
import { formatCents } from "@/lib/money";
import { registrarMovimento } from "@/modules/inventory/actions";
import {
  MOVEMENT_HELP,
  MOVEMENT_LABELS,
  requerMotivo,
  type StockMovementKind,
} from "@/modules/inventory/movements";
import type { LinhaEstoque } from "@/modules/inventory/service";

/**
 * Ícone vem daqui, do lado do cliente, escolhido por uma STRING. Passar o
 * componente de ícone de um componente de servidor para um de cliente derruba a
 * página em produção mesmo passando no `tsc` e no build — já aconteceu neste
 * projeto (ver `mobile-nav-drawer.tsx` e o registro de módulos).
 */
const ICONES: Record<StockMovementKind, typeof Plus> = {
  entrada: Plus,
  saida: Minus,
  ajuste: ScanLine,
  perda: TriangleAlert,
};

const ORDEM: StockMovementKind[] = ["entrada", "saida", "ajuste", "perda"];

function reaisParaCentavos(bruto: string): number | null {
  const limpo = bruto.trim().replace(/\./g, "").replace(",", ".");
  if (!limpo) return null;
  const valor = Number.parseFloat(limpo);
  return Number.isFinite(valor) ? Math.round(valor * 100) : null;
}

function MovimentoForm({
  produto,
  kind,
  onPronto,
  onCancelar,
}: {
  produto: LinhaEstoque;
  kind: StockMovementKind;
  onPronto: () => void;
  onCancelar: () => void;
}) {
  const [quantidade, setQuantidade] = useState("");
  const [motivo, setMotivo] = useState("");
  const [custo, setCusto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    const qtd = Number.parseInt(quantidade.trim(), 10);
    if (!Number.isFinite(qtd)) {
      setErro("Digite a quantidade em número inteiro.");
      return;
    }

    iniciar(async () => {
      const resultado = await registrarMovimento({
        productId: produto.id,
        kind,
        quantity: qtd,
        reason: motivo,
        unitCostCents: kind === "entrada" ? reaisParaCentavos(custo) : null,
      });
      if (!resultado.ok) {
        setErro(resultado.error);
        return;
      }
      onPronto();
    });
  }

  return (
    <form onSubmit={enviar} className="mt-3 space-y-3 rounded-[10px] border border-border bg-background p-4">
      <div>
        <p className="text-sm font-medium text-foreground">
          {MOVEMENT_LABELS[kind]} — {produto.name}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{MOVEMENT_HELP[kind]}</p>
      </div>

      {produto.stockQuantity === null ? (
        <p className="rounded-[10px] bg-secondary p-3 text-xs text-foreground">
          Esta cesta está hoje como <strong>estoque ilimitado</strong> (feita sob encomenda). Ao gravar este
          lançamento, ela passa a ter estoque controlado, começando do zero mais o que você lançar agora.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">
            {kind === "ajuste" ? "Quantidade contada na prateleira" : "Quantidade"}
          </span>
          <input
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            inputMode="numeric"
            autoFocus
            placeholder="0"
            className="h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>

        {kind === "entrada" ? (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">
              Custo por unidade (R$) — opcional
            </span>
            <input
              value={custo}
              onChange={(e) => setCusto(e.target.value)}
              inputMode="decimal"
              placeholder="0,00"
              className="h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              Se preencher, o custo médio da cesta é recalculado.
            </span>
          </label>
        ) : null}
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">
          Motivo {requerMotivo(kind) ? "(obrigatório)" : "(opcional)"}
        </span>
        <input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder={kind === "perda" ? "Ex.: 3 potes de geleia venceram" : "Ex.: contagem do fim do mês"}
          className="h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      {erro ? <p className="text-sm text-destructive">{erro}</p> : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pendente}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {pendente ? <Loader2 className="size-4 animate-spin" /> : null}
          Gravar lançamento
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="inline-flex h-11 items-center justify-center rounded-[10px] border border-border px-4 text-sm font-medium text-foreground hover:bg-accent"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function StockManager({ produtos }: { produtos: LinhaEstoque[] }) {
  const router = useRouter();
  const [aberto, setAberto] = useState<{ produtoId: string; kind: StockMovementKind } | null>(null);

  function concluir() {
    setAberto(null);
    router.refresh();
  }

  if (produtos.length === 0) {
    return (
      <p className="rounded-card border border-border bg-card p-5 text-sm text-muted-foreground">
        Nenhuma cesta cadastrada ainda. Cadastre em Produtos para começar a controlar o estoque.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border rounded-card border border-border bg-card">
      {produtos.map((produto) => {
        const abertoAqui = aberto?.produtoId === produto.id;
        return (
          <div key={produto.id} className="px-4 py-3.5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {produto.name}
                  {!produto.active ? (
                    <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-normal text-muted-foreground">
                      inativa
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {produto.stockQuantity === null ? (
                    <span>Estoque ilimitado (sob encomenda)</span>
                  ) : (
                    <span className={produto.abaixoDoMinimo ? "font-medium text-destructive" : undefined}>
                      {produto.abaixoDoMinimo ? (
                        <AlertTriangle className="mr-1 inline size-3 align-[-2px]" />
                      ) : null}
                      {produto.stockQuantity} em estoque
                      {produto.lowStockThreshold !== null ? ` · mínimo ${produto.lowStockThreshold}` : ""}
                    </span>
                  )}
                  {" · "}
                  Custo: {produto.costCents === null ? "—" : formatCents(produto.costCents)}
                  {" · "}
                  Parado: {produto.valorParadoCents === null ? "—" : formatCents(produto.valorParadoCents)}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {ORDEM.map((kind) => {
                  const Icone = ICONES[kind];
                  const ativo = abertoAqui && aberto?.kind === kind;
                  return (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => setAberto(ativo ? null : { produtoId: produto.id, kind })}
                      className={`inline-flex h-9 items-center gap-1.5 rounded-[10px] border px-3 text-xs font-medium transition-colors ${
                        ativo
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground hover:bg-accent"
                      }`}
                    >
                      <Icone className="size-3.5" /> {MOVEMENT_LABELS[kind]}
                    </button>
                  );
                })}
              </div>
            </div>

            {abertoAqui && aberto ? (
              <MovimentoForm
                produto={produto}
                kind={aberto.kind}
                onPronto={concluir}
                onCancelar={() => setAberto(null)}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
