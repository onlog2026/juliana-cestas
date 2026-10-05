"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  NO_FILTER,
  PRICE_BANDS,
  availableSortOptions,
  filterEntries,
  isSortKey,
  parseFilterHash,
  serializeFilter,
  sortEntries,
  type GridFilter,
  type SortKey,
  type SortableMeta,
} from "@/modules/catalog/sort-products";
import { events } from "@/modules/analytics/events";

export type EntradaGrade = SortableMeta & {
  id: string;
  categoryId?: string;
  /** O cartão (do modelo) já renderizado no servidor. */
  node: ReactNode;
};
export type CategoriaGrade = { slug: string; name: string; ids: string[] };

const CHIP = "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium";

/**
 * Grade com ordenação, filtro por categoria e por faixa de preço, feita no navegador
 * (mesma lógica de `sort-products.ts` da loja original; só a aparência é do modelo).
 * `classeGrade` = colunas da grade (o modelo decide). A escolha fica na URL como `#ordem=…&filtro=…`.
 */
export function GradeCliente({
  entradas,
  categorias = [],
  classeGrade = "grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4",
  limite = 30,
}: {
  entradas: EntradaGrade[];
  categorias?: CategoriaGrade[];
  classeGrade?: string;
  limite?: number;
}) {
  const [ordem, setOrdem] = useState<SortKey>("destaques");
  const [filtro, setFiltro] = useState<GridFilter>(NO_FILTER);
  const [mostrarTudo, setMostrarTudo] = useState(false);
  const [aviso, setAviso] = useState("");
  const idsPorCategoria = useMemo(() => new Map(categorias.map((c) => [c.slug, c.ids] as const)), [categorias]);
  const opcoes = useMemo(() => availableSortOptions(entradas), [entradas]);

  useEffect(() => {
    const m = /(?:^#|&)ordem=([a-z-]+)/.exec(window.location.hash);
    if (m && isSortKey(m[1]) && opcoes.some((o) => o.key === m[1])) setOrdem(m[1]);
    const doHash = parseFilterHash(window.location.hash, new Set(categorias.map((c) => c.slug)));
    if (doHash.category || doHash.band) setFiltro(doHash);
  }, [opcoes, categorias]);

  function gravarHash(o: SortKey, f: GridFilter) {
    const base = window.location.pathname + window.location.search;
    const partes: string[] = [];
    if (o !== "destaques") partes.push(`ordem=${o}`);
    const s = serializeFilter(f);
    if (s) partes.push(`filtro=${s}`);
    window.history.replaceState(null, "", partes.length ? `${base}#${partes.join("&")}` : base);
  }
  function mudarFiltro(next: GridFilter) {
    setFiltro(next);
    setMostrarTudo(false);
    gravarHash(ordem, next);
    if (next.category && next.category !== filtro.category) events.filterProducts("categoria", next.category);
    if (next.band && next.band !== filtro.band) events.filterProducts("preco", next.band);
  }
  function mudarOrdem(valor: string) {
    if (!isSortKey(valor)) return;
    setOrdem(valor);
    setAviso(`Ordenado por: ${opcoes.find((o) => o.key === valor)?.label ?? valor}`);
    gravarHash(valor, filtro);
  }

  const lista = useMemo(() => sortEntries(filterEntries(entradas, filtro, idsPorCategoria), ordem), [entradas, filtro, idsPorCategoria, ordem]);
  const visiveis = mostrarTudo ? lista : lista.slice(0, limite);
  const escondidos = lista.length - visiveis.length;
  const filtrando = Boolean(filtro.category || filtro.band);

  const chip = (ativo: boolean) => ({
    borderColor: ativo ? "var(--t-primary)" : "var(--t-line)",
    background: ativo ? "var(--t-primary)" : "transparent",
    color: ativo ? "var(--t-on-primary)" : "var(--t-fg)",
  });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {categorias.length > 0 ? (
          <>
            <button type="button" aria-pressed={!filtro.category} onClick={() => mudarFiltro({ ...filtro, category: null })} className={CHIP} style={chip(!filtro.category)}>Todas</button>
            {categorias.map((c) => (
              <button key={c.slug} type="button" aria-pressed={filtro.category === c.slug} onClick={() => mudarFiltro({ ...filtro, category: filtro.category === c.slug ? null : c.slug })} className={CHIP} style={chip(filtro.category === c.slug)}>
                {c.name}
              </button>
            ))}
          </>
        ) : null}
        {PRICE_BANDS.map((b) => (
          <button key={b.key} type="button" aria-pressed={filtro.band === b.key} onClick={() => mudarFiltro({ ...filtro, band: filtro.band === b.key ? null : b.key })} className={CHIP} style={chip(filtro.band === b.key)}>
            {b.label}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-sm" style={{ color: "var(--t-muted)" }}>
          <span>Ordenar</span>
          <select value={ordem} onChange={(e) => mudarOrdem(e.target.value)} className="min-h-11 rounded-md border bg-transparent px-3" style={{ borderColor: "var(--t-line)", color: "var(--t-fg)" }}>
            {opcoes.map((o) => (
              <option key={o.key} value={o.key} style={{ color: "#111111", background: "#ffffff" }}>{o.label}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="sr-only" aria-live="polite">{aviso}</p>

      {visiveis.length > 0 ? (
        <div className={`mt-8 ${classeGrade}`}>
          {visiveis.map((e) => (
            <div key={e.id} className="min-w-0">{e.node}</div>
          ))}
        </div>
      ) : (
        <p className="mt-10 text-center" style={{ color: "var(--t-muted)" }}>
          Nenhuma cesta com esses filtros.{" "}
          {filtrando ? (
            <button type="button" className="min-h-11 underline" style={{ color: "var(--t-primary)" }} onClick={() => mudarFiltro(NO_FILTER)}>Limpar filtros</button>
          ) : null}
        </p>
      )}
      {escondidos > 0 ? (
        <div className="mt-10 text-center">
          <button type="button" onClick={() => setMostrarTudo(true)} className={`${CHIP} px-6`} style={{ borderColor: "var(--t-line)", color: "var(--t-fg)" }}>
            Ver mais {escondidos}
          </button>
        </div>
      ) : null}
    </div>
  );
}
