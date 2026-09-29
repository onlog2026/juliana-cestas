"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Check, Loader2, Search } from "lucide-react";
import { saveProductOrder } from "@/modules/catalog/actions";
import { filterProducts, moveTo } from "@/modules/catalog/product-order";

export type ProductRow = {
  id: string;
  name: string;
  active: boolean;
  imageUrl: string | null;
  categoryLabel: string | null;
  sku: string | null;
  priceLabel: string;
  deliveryLabel: string;
  stock: number | null;
  stockLow: boolean;
};

type SaveState = "idle" | "saving" | "saved" | "error";

const SAVE_DELAY_MS = 600;

/**
 * Lista de produtos do painel: 3 por linha no computador, com busca, setas ↑↓ e
 * número de posição. A ordem manda na loja inteira.
 *
 * Rápido de propósito (era lento por 5 motivos): o estado local é a verdade
 * enquanto a pessoa mexe; os botões NUNCA travam; vários movimentos seguidos
 * viram UMA gravação (espera 600 ms sem mexer); só uma gravação voa por vez (se
 * mexeu durante, grava o último estado logo depois); e o servidor só escreve as
 * linhas que mudaram, sem recarregar o painel.
 *
 * O cartão inteiro é um Link para editar; os controles de ordem ficam FORA do
 * Link (irmãos), então nunca navegam ao reordenar.
 */
export function ProductsList({ products: initial }: { products: ProductRow[] }) {
  const router = useRouter();
  const [products, setProducts] = useState<ProductRow[]>(initial);
  const [term, setTerm] = useState("");
  const [save, setSave] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflight = useRef(false);
  const latest = useRef<string[] | null>(null);

  // Só ressincroniza se o CONJUNTO de produtos mudou (criou/apagou/renomeou em
  // outra tela). Nunca por causa de ordem -- senão sobrescreveria o que a
  // pessoa acabou de mexer e ainda não foi gravado.
  const initialKey = initial.map((p) => `${p.id}:${p.name}:${p.active}:${p.imageUrl ?? ""}`).sort().join("|");
  const [seenKey, setSeenKey] = useState(initialKey);
  if (seenKey !== initialKey) {
    setSeenKey(initialKey);
    setProducts(initial);
  }

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  async function flush() {
    if (inflight.current || !latest.current) return;
    inflight.current = true;
    setSave("saving");
    const ids = latest.current;
    latest.current = null;
    try {
      const result = await saveProductOrder(ids);
      if (!result.ok) {
        if (result.stale) {
          setSave("idle");
          router.refresh();
        } else {
          setError(result.error);
          setSave("error");
        }
      } else {
        setError(null);
        setSave(latest.current ? "saving" : "saved");
      }
    } catch {
      setError("Sem conexão. Toque em “Tentar de novo”.");
      setSave("error");
    } finally {
      inflight.current = false;
      // Mexeu enquanto gravava: grava o último estado agora.
      if (latest.current) void flush();
    }
  }

  function schedule(next: ProductRow[]) {
    latest.current = next.map((p) => p.id);
    setSave("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), SAVE_DELAY_MS);
  }

  function apply(next: ProductRow[]) {
    if (next === products) return;
    setProducts(next);
    schedule(next);
  }

  function retry() {
    latest.current = products.map((p) => p.id);
    void flush();
  }

  const searching = term.trim() !== "";
  const visible = filterProducts(products, term);

  if (products.length === 0) {
    return (
      <p className="mt-6 rounded-card border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Nenhuma cesta cadastrada ainda. Clique em “Nova cesta” para começar.
      </p>
    );
  }

  return (
    <>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <label className="relative block min-w-[220px] flex-1" style={{ maxWidth: 420 }}>
          <span className="sr-only">Buscar produto</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar por nome, categoria ou código"
            className="h-11 rounded-full border border-border bg-card pl-10 pr-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ width: "100%" }}
          />
        </label>

        <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
          {save === "saving" ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="size-3.5 animate-spin" /> Salvando…
            </span>
          ) : save === "saved" ? (
            <span className="inline-flex items-center gap-1.5 text-primary">
              <Check className="size-3.5" /> Ordem salva
            </span>
          ) : save === "error" ? (
            <button type="button" onClick={retry} className="font-medium text-destructive underline">
              Não salvou — tentar de novo
            </button>
          ) : (
            `${products.length} cestas`
          )}
        </p>
      </div>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      {searching ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Mostrando {visible.length} de {products.length}. Para reordenar, limpe a busca.
        </p>
      ) : null}

      {visible.length === 0 ? (
        <p className="mt-6 rounded-card border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nenhuma cesta encontrada para “{term}”.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((product) => {
            const index = products.findIndex((p) => p.id === product.id);
            return (
              <li key={product.id} className="flex flex-col rounded-card border border-border bg-card">
                <Link
                  href={`/admin/produtos/${product.id}`}
                  className="jc-nav-hover flex min-w-0 flex-1 items-start gap-3 rounded-t-card p-3"
                >
                  <span className="relative size-20 shrink-0 overflow-hidden rounded-[10px] bg-secondary">
                    {product.imageUrl ? (
                      <Image src={product.imageUrl} alt={product.name} fill sizes="80px" className="object-cover" />
                    ) : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {product.name}
                      {!product.active ? (
                        <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-normal text-muted-foreground">
                          inativa
                        </span>
                      ) : null}
                    </span>
                    {product.categoryLabel ? (
                      <span className="block truncate text-xs font-medium text-foreground/80">
                        {product.categoryLabel}
                      </span>
                    ) : null}
                    <span className="block text-sm font-semibold tabular-nums text-foreground">
                      {product.priceLabel}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Entrega: {product.deliveryLabel}
                      {product.stock !== null ? (
                        <>
                          {" · "}
                          <span className={product.stockLow ? "font-medium text-destructive" : undefined}>
                            Estoque: {product.stock}
                          </span>
                        </>
                      ) : null}
                    </span>
                  </span>
                </Link>

                <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    Posição
                    <PositionInput
                      value={index + 1}
                      max={products.length}
                      disabled={searching}
                      onCommit={(pos) => apply(moveTo(products, index, pos - 1))}
                    />
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => apply(moveTo(products, index, index - 1))}
                      disabled={searching || index === 0}
                      aria-label={`Mover ${product.name} para cima`}
                      className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-accent disabled:opacity-30"
                    >
                      <ArrowUp className="size-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => apply(moveTo(products, index, index + 1))}
                      disabled={searching || index === products.length - 1}
                      aria-label={`Mover ${product.name} para baixo`}
                      className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-accent disabled:opacity-30"
                    >
                      <ArrowDown className="size-5" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

/** Campo "Posição": digita o número e confirma com Enter ou ao sair do campo. */
function PositionInput({
  value,
  max,
  disabled,
  onCommit,
}: {
  value: number;
  max: number;
  disabled: boolean;
  onCommit: (position: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  function commit() {
    if (draft === null) return;
    const n = Number.parseInt(draft, 10);
    setDraft(null);
    if (Number.isFinite(n) && n !== value) onCommit(Math.max(1, Math.min(max, n)));
  }

  return (
    <input
      value={draft ?? String(value)}
      onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 3))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") setDraft(null);
      }}
      inputMode="numeric"
      disabled={disabled}
      aria-label="Posição na loja"
      className="h-11 rounded-lg border border-border bg-background px-2 text-center text-sm font-medium tabular-nums text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      style={{ width: 64 }}
    />
  );
}
