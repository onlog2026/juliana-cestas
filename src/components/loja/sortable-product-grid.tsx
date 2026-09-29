"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  PROMO_AFTER_ITEMS,
  availableSortOptions,
  isSortKey,
  promoInsertIndex,
  sortEntries,
  type SortKey,
  type SortableMeta,
} from "@/modules/catalog/sort-products";

/** Quantas colunas (de 5) ficam vazias na última linha do computador. */
export function fillColumns(count: number, columns = 5): number {
  return count <= 0 ? 0 : (columns - (count % columns)) % columns;
}

export type GridEntry = SortableMeta & {
  id: string;
  /** O cartão já renderizado NO SERVIDOR (ProductCard continua server component). */
  node: ReactNode;
};

/**
 * Grade de produtos da home com ordenação feita no navegador.
 *
 * Por que no navegador: a home é uma página ESTÁTICA (rápida e barata). Ler
 * `searchParams` no servidor a tornaria dinâmica -- calculada a cada visita.
 * Aqui o servidor entrega a grade já montada e este componente só REORDENA os
 * cartões que já vieram prontos. O estado inicial é a ordem manual da loja
 * ("Destaques"), igual ao HTML do servidor, então não há troca de conteúdo na
 * hidratação. A escolha fica na URL como `#ordem=...` (sem recarregar).
 *
 * Grade: 2 colunas no celular, 3 no tablet, 5 no computador; até `maxVisible`
 * produtos (6 linhas × 5). Os banners promocionais entram DEPOIS DA 3ª LINHA
 * de cada largura (6, 9 e 15 produtos), cada um visível só no seu breakpoint.
 */
export function SortableProductGrid({
  title,
  entries,
  promo,
  fill,
  maxVisible = 30,
}: {
  title: string;
  entries: GridEntry[];
  /** Banners promocionais (já renderizados no servidor); ausente = sem banners. */
  promo?: ReactNode;
  /** Banner do espaço vazio da última linha (só computador); ausente = sem banner. */
  fill?: ReactNode;
  maxVisible?: number;
}) {
  const [sort, setSort] = useState<SortKey>("destaques");
  const [announce, setAnnounce] = useState("");
  const [showAll, setShowAll] = useState(false);

  const options = useMemo(() => availableSortOptions(entries), [entries]);

  // Depois de hidratar, respeita `#ordem=...` (link compartilhado / botão voltar).
  useEffect(() => {
    const match = /(?:^#|&)ordem=([a-z-]+)/.exec(window.location.hash);
    if (match && isSortKey(match[1]) && options.some((o) => o.key === match[1])) {
      setSort(match[1]);
    }
  }, [options]);

  function handleChange(next: string) {
    if (!isSortKey(next)) return;
    setSort(next);
    setAnnounce(`Ordenado por: ${options.find((o) => o.key === next)?.label ?? next}`);
    // replaceState (não pushState): mudar a ordem não deve empilhar histórico.
    const base = window.location.pathname + window.location.search;
    window.history.replaceState(null, "", next === "destaques" ? base : `${base}#ordem=${next}`);
  }

  const sorted = useMemo(() => sortEntries(entries, sort), [entries, sort]);
  const visible = showAll ? sorted : sorted.slice(0, maxVisible);
  const hiddenCount = sorted.length - visible.length;

  // Monta as células da grade: produtos + 3 cópias do bloco de banners, cada uma
  // visível em UMA faixa de largura (o CSS esconde as outras; imagens de itens
  // escondidos com loading=lazy não são baixadas).
  const promoSlots = promo
    ? [
        { key: "promo-m", at: promoInsertIndex(visible.length, PROMO_AFTER_ITEMS.mobile), className: "sm:hidden" },
        {
          key: "promo-t",
          at: promoInsertIndex(visible.length, PROMO_AFTER_ITEMS.tablet),
          className: "hidden sm:block lg:hidden",
        },
        { key: "promo-d", at: promoInsertIndex(visible.length, PROMO_AFTER_ITEMS.desktop), className: "hidden lg:block" },
      ]
    : [];

  const cells: ReactNode[] = [];
  for (let i = 0; i <= visible.length; i++) {
    for (const slot of promoSlots) {
      if (slot.at === i) {
        cells.push(
          <div key={slot.key} className={`col-span-full ${slot.className}`} data-promo-slot={slot.key}>
            {promo}
          </div>
        );
      }
    }
    if (i < visible.length) cells.push(
        <div key={visible[i].id} className="flex flex-col">
          {visible[i].node}
        </div>
      );
  }

  // Sobra na última linha do computador (5 colunas): o banner ocupa as colunas
  // vazias. Linha fechada (resto 0) = nada a preencher. A largura vai em `style`
  // porque o Tailwind não gera classe `col-span-N` montada em tempo de execução.
  const gapColumns = fillColumns(visible.length);
  if (fill && gapColumns > 0) {
    cells.push(
      <div
        key="fill"
        className="hidden lg:block"
        style={{ gridColumn: `span ${gapColumns} / span ${gapColumns}` }}
        data-fill-slot={gapColumns}
      >
        {fill}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-foreground">{title}</h2>
        {entries.length > 1 ? (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Ordenar por</span>
            <select
              value={sort}
              onChange={(e) => handleChange(e.target.value)}
              aria-label="Ordenar produtos"
              className="h-11 rounded-[10px] border border-border bg-card px-3 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {options.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">{cells}</div>

      {hiddenCount > 0 ? (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="inline-flex h-12 items-center rounded-full border border-border bg-card px-7 text-base font-semibold text-foreground transition-colors hover:bg-accent"
          >
            Ver todas as {sorted.length} cestas
          </button>
        </div>
      ) : null}
    </>
  );
}
