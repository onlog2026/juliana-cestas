"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Minus, Plus, ScanLine, Search, TriangleAlert } from "lucide-react";
import { formatCents } from "@/lib/money";
import { registrarMovimento } from "@/modules/inventory/actions";
import {
  MOVEMENT_HELP,
  MOVEMENT_LABELS,
  requerMotivo,
  type StockMovementKind,
} from "@/modules/inventory/movements";
import type { LinhaEstoque, MovimentoEstoque } from "@/modules/inventory/service";
import { normalizeSearch } from "@/modules/catalog/product-order";

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
    <form onSubmit={enviar} className="mt-3 space-y-3 rounded-[10px] border border-border bg-background p-3">
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

      <div className="grid gap-3">
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

function dataCurta(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

/**
 * Estoque em 2 colunas (computador): à esquerda a lista de cestas com busca;
 * à direita UM só formulário de movimentação, da cesta selecionada, com as
 * últimas movimentações dela. No celular as colunas empilham (lista, depois o
 * formulário, e a tela rola até ele ao escolher a cesta).
 */
export function StockManager({
  produtos,
  movimentos = [],
}: {
  produtos: LinhaEstoque[];
  movimentos?: MovimentoEstoque[];
}) {
  const router = useRouter();
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [kind, setKind] = useState<StockMovementKind>("entrada");
  const [versao, setVersao] = useState(0);
  const [busca, setBusca] = useState("");
  const painelRef = useRef<HTMLDivElement>(null);

  const filtrados = useMemo(() => {
    const q = normalizeSearch(busca);
    return q ? produtos.filter((p) => normalizeSearch(p.name).includes(q)) : produtos;
  }, [produtos, busca]);

  const selecionado = produtos.find((p) => p.id === selecionadoId) ?? null;
  const recentes = selecionado ? movimentos.filter((m) => m.productId === selecionado.id).slice(0, 6) : [];

  function escolher(id: string) {
    setSelecionadoId(id);
    setVersao((v) => v + 1);
    // No celular o formulário fica ABAIXO da lista: leva a tela até ele.
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      requestAnimationFrame(() => painelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }

  function concluir() {
    setVersao((v) => v + 1);
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
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div>
        <label className="relative mb-3 block" style={{ maxWidth: 420 }}>
          <span className="sr-only">Buscar cesta</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar cesta"
            className="h-11 rounded-full border border-border bg-card pl-10 pr-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ width: "100%" }}
          />
        </label>

        {filtrados.length === 0 ? (
          <p className="rounded-card border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
            Nenhuma cesta encontrada.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-card border border-border bg-card">
            {filtrados.map((produto) => {
              const ativo = produto.id === selecionadoId;
              return (
                <li key={produto.id}>
                  <button
                    type="button"
                    onClick={() => escolher(produto.id)}
                    aria-pressed={ativo}
                    className={`flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                      ativo ? "bg-primary/10" : "hover:bg-accent"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {produto.name}
                        {!produto.active ? (
                          <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-normal text-muted-foreground">
                            inativa
                          </span>
                        ) : null}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        Custo: {produto.costCents === null ? "—" : formatCents(produto.costCents)}
                        {" · "}
                        Parado: {produto.valorParadoCents === null ? "—" : formatCents(produto.valorParadoCents)}
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-xs">
                      {produto.stockQuantity === null ? (
                        <span className="text-muted-foreground">Ilimitado</span>
                      ) : (
                        <span
                          className={
                            produto.abaixoDoMinimo ? "font-semibold text-destructive" : "font-medium text-foreground"
                          }
                        >
                          {produto.abaixoDoMinimo ? (
                            <AlertTriangle className="mr-1 inline size-3 align-[-2px]" />
                          ) : null}
                          {produto.stockQuantity} un.
                          {produto.lowStockThreshold !== null ? (
                            <span className="block font-normal text-muted-foreground">
                              mín. {produto.lowStockThreshold}
                            </span>
                          ) : null}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div ref={painelRef} className="scroll-mt-4 lg:sticky lg:top-4">
        {selecionado ? (
          <div className="rounded-card border border-border bg-card p-4">
            <p className="text-sm font-semibold text-foreground">{selecionado.name}</p>
            <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-2">
              {ORDEM.map((k) => {
                const Icone = ICONES[k];
                const ativo = kind === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setKind(k);
                      setVersao((v) => v + 1);
                    }}
                    aria-pressed={ativo}
                    className={`inline-flex h-11 items-center justify-center gap-1.5 rounded-[10px] border px-3 text-xs font-medium transition-colors ${
                      ativo
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:bg-accent"
                    }`}
                  >
                    <Icone className="size-3.5" /> {MOVEMENT_LABELS[k]}
                  </button>
                );
              })}
            </div>

            <MovimentoForm
              key={`${selecionado.id}-${kind}-${versao}`}
              produto={selecionado}
              kind={kind}
              onPronto={concluir}
              onCancelar={() => setSelecionadoId(null)}
            />

            {recentes.length > 0 ? (
              <div className="mt-4">
                <p className="text-xs font-semibold text-foreground">Últimas movimentações desta cesta</p>
                <ul className="mt-2 space-y-1.5">
                  {recentes.map((m) => (
                    <li key={m.id} className="flex justify-between gap-2 text-xs text-muted-foreground">
                      <span>
                        {dataCurta(m.createdAt)} · {MOVEMENT_LABELS[m.kind]}{" "}
                        {m.kind === "ajuste" ? `(contou ${m.quantity})` : m.quantity}
                      </span>
                      <span className="font-medium text-foreground">saldo {m.balanceAfter}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="rounded-card border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Escolha uma cesta na lista para lançar entrada, saída, ajuste ou perda.
          </p>
        )}
      </div>
    </div>
  );
}
