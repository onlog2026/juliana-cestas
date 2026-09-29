"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  NO_FILTER,
  PRICE_BANDS,
  PROMO_AFTER_ITEMS,
  availableSortOptions,
  filterEntries,
  isSortKey,
  parseFilterHash,
  promoInsertIndex,
  serializeFilter,
  sortEntries,
  type GridFilter,
  type PriceBandKey,
  type SortKey,
  type SortableMeta,
} from "@/modules/catalog/sort-products";
import { events } from "@/modules/analytics/events";

/** Quantas colunas (de 5) ficam vazias na última linha do computador. */
export function fillColumns(count: number, columns = 5): number {
  return count <= 0 ? 0 : (columns - (count % columns)) % columns;
}

/** Categoria para os chips de filtro: `ids` = ela + as subcategorias. */
export type GridCategory = { slug: string; name: string; ids: string[] };

export type GridEntry = SortableMeta & {
  id: string;
  categoryId?: string;
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
 * Grade: 2 colunas no celular, 3 no tablet, 5 no computador e 6 em tela
 * muito larga (>= 1536px); até `maxVisible` produtos. Os banners promocionais entram
 * DEPOIS DA 3ª LINHA de cada largura (6, 9, 15 e 18 produtos), cada um visível só no seu breakpoint.
 */
export function SortableProductGrid({
  title,
  entries,
  promo,
  fill,
  categories = [],
  maxVisible = 30,
}: {
  title: string;
  entries: GridEntry[];
  /** Banners promocionais (já renderizados no servidor); ausente = sem banners. */
  promo?: ReactNode;
  /** Banner do espaço vazio da última linha (só computador); ausente = sem banner. */
  fill?: ReactNode;
  /** Chips de categoria (vazio = sem filtro por categoria). */
  categories?: GridCategory[];
  maxVisible?: number;
}) {
  const [sort, setSort] = useState<SortKey>("destaques");
  const [announce, setAnnounce] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<GridFilter>(NO_FILTER);
  const categoryIds = useMemo(() => new Map(categories.map((c) => [c.slug, c.ids] as const)), [categories]);

  const options = useMemo(() => availableSortOptions(entries), [entries]);

  // Depois de hidratar, respeita `#ordem=...` (link compartilhado / botão voltar).
  useEffect(() => {
    const match = /(?:^#|&)ordem=([a-z-]+)/.exec(window.location.hash);
    if (match && isSortKey(match[1]) && options.some((o) => o.key === match[1])) {
      setSort(match[1]);
    }
    const fromHash = parseFilterHash(window.location.hash, new Set(categories.map((c) => c.slug)));
    if (fromHash.category || fromHash.band) setFilter(fromHash);
  }, [options, categories]);

  /** Escreve ordem e filtro juntos na URL (sem empilhar histórico). */
  function writeHash(nextSort: SortKey, nextFilter: GridFilter) {
    const base = window.location.pathname + window.location.search;
    const parts: string[] = [];
    if (nextSort !== "destaques") parts.push(`ordem=${nextSort}`);
    const f = serializeFilter(nextFilter);
    if (f) parts.push(`filtro=${f}`);
    window.history.replaceState(null, "", parts.length ? `${base}#${parts.join("&")}` : base);
  }

  function changeFilter(next: GridFilter) {
    setFilter(next);
    setShowAll(false);
    writeHash(sort, next);
    if (next.category !== filter.category && next.category) events.filterProducts("categoria", next.category);
    if (next.band !== filter.band && next.band) events.filterProducts("preco", next.band);
  }

  function handleChange(next: string) {
    if (!isSortKey(next)) return;
    setSort(next);
    setAnnounce(`Ordenado por: ${options.find((o) => o.key === next)?.label ?? next}`);
    writeHash(next, filter);
  }

  const filtered = useMemo(() => filterEntries(entries, filter, categoryIds), [entries, filter, categoryIds]);
  const sorted = useMemo(() => sortEntries(filtered, sort), [filtered, sort]);
  const filtering = Boolean(filter.category || filter.band);
  const visible = showAll ? sorted : sorted.slice(0, maxVisible);
  const hiddenCount = sorted.length - visible.length;

  // Monta as células da grade: produtos + 4 cópias do bloco de banners, cada uma
  // visível em UMA faixa de largura (o CSS esconde as outras; imagens de itens
  // escondidos com loading=lazy não são baixadas).
  const promoSlots = promo && (!filtering || visible.length >= 6)
    ? [
        { key: "promo-m", at: promoInsertIndex(visible.length, PROMO_AFTER_ITEMS.mobile), className: "sm:hidden" },
        {
          key: "promo-t",
          at: promoInsertIndex(visible.length, PROMO_AFTER_ITEMS.tablet),
          className: "hidden sm:block lg:hidden",
        },
        {
          key: "promo-d",
          at: promoInsertIndex(visible.length, PROMO_AFTER_ITEMS.desktop),
          className: "hidden lg:block 2xl:hidden",
        },
        { key: "promo-w", at: promoInsertIndex(visible.length, PROMO_AFTER_ITEMS.wide), className: "hidden 2xl:block" },
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
  // Cada largura tem a sua conta (5 colunas de 1024 a 1535px; 6 a partir de 1536px) e a sua
  // cópia do bloco, visível só na sua faixa.
  const gapColumns = fillColumns(visible.length, 5);
  if (fill && !filtering && gapColumns > 0) {
    cells.push(
      <div
        key="fill"
        className="hidden lg:block 2xl:hidden"
        style={{ gridColumn: `span ${gapColumns} / span ${gapColumns}` }}
        data-fill-slot={gapColumns}
      >
        {fill}
      </div>
    );
  }
  const gapColumnsWide = fillColumns(visible.length, 6);
  if (fill && !filtering && gapColumnsWide > 0) {
    cells.push(
      <div
        key="fill-wide"
        className="hidden 2xl:block"
        style={{ gridColumn: `span ${gapColumnsWide} / span ${gapColumnsWide}` }}
        data-fill-slot-wide={gapColumnsWide}
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
          <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
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
      {entries.length > 1 && (categories.length > 0 || PRICE_BANDS.length > 0) ? (
        <div className="mt-4 space-y-2" role="group" aria-label="Filtrar cestas">
          {categories.length > 0 ? (
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
              <Chip active={!filter.category} onClick={() => changeFilter({ ...filter, category: null })}>
                Todas
              </Chip>
              {categories.map((c) => (
                <Chip key={c.slug} active={filter.category === c.slug} onClick={() => changeFilter({ ...filter, category: filter.category === c.slug ? null : c.slug })}>
                  {c.name}
                </Chip>
              ))}
            </div>
          ) : null}
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
            {PRICE_BANDS.map((b) => (
              <Chip key={b.key} active={filter.band === b.key} onClick={() => changeFilter({ ...filter, band: filter.band === b.key ? null : (b.key as PriceBandKey) })}>
                {b.label}
              </Chip>
            ))}
            {filtering ? (
              <button
                type="button"
                onClick={() => changeFilter(NO_FILTER)}
                className="inline-flex h-11 shrink-0 items-center rounded-full px-3 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Limpar filtros
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      <p className="sr-only" aria-live="polite">
        {announce}
        {filtering ? `${sorted.length} ${sorted.length === 1 ? "cesta encontrada" : "cestas encontradas"}` : ""}
      </p>

      {sorted.length === 0 ? (
        <div className="mt-8 rounded-card border border-dashed border-border p-8 text-center">
          <p className="text-foreground">Nenhuma cesta nesse filtro.</p>
          <button
            type="button"
            onClick={() => changeFilter(NO_FILTER)}
            className="mt-3 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 sm:gap-x-7 lg:grid-cols-5 2xl:grid-cols-6">{cells}</div>
      )}

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

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-colors ${
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}
