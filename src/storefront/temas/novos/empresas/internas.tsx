"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Minus, Plus } from "lucide-react";
import { Foto, brl } from "../../kit";
import { useDemoCart } from "../../demo-cart";
import type { DadosLoja, ProdutoLoja } from "../../types";
import { AvisoSemCobranca, CaminhoPao, CarrinhoVazio, FAIXAS, NaoEncontrada, ORDENS, Quantidade, itensLimpos, rotuloFinalizar, useCompra, useLista, type Ordem } from "../../internas/comum";
import { Rotulo, SELOS, wrapE } from "./pecas";

/**
 * EMPRESAS — páginas internas: categoria em lista densa com filtro lateral,
 * cesta com seletor de quantidade grande e "Adicionar ao orçamento", carrinho
 * apresentado como "Orçamento" (com Total).
 */

const h = { fontFamily: "var(--t-titulo)", fontWeight: 700, letterSpacing: "-0.02em" } as const;
const MAX_QTD = 20; // limite do carrinho local por item

function Linha({ p }: { p: ProdutoLoja }) {
  return (
    <a href={p.href} className="group block min-w-0">
      <div className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-x-3 gap-y-2 overflow-hidden rounded-md border p-2.5 sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:gap-x-5 sm:p-3" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>
        <Foto src={p.fotos[0]} alt={p.nome} className="aspect-square w-full rounded-sm object-cover" />
        <div className="min-w-0">
          <p className="line-clamp-2 text-base leading-snug font-bold">{p.nome}</p>
          {p.serve ? <p className="mt-0.5 text-sm" style={{ color: "var(--t-muted)" }}>{p.serve}</p> : null}
          <p className="mt-1 hidden text-xs sm:block" style={{ color: "var(--t-muted)" }}>Entrega agendada · nota fiscal</p>
        </div>
        <div className="col-span-2 flex items-center justify-between gap-3 border-t pt-2.5 sm:col-span-1 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0" style={{ borderColor: "var(--t-line)" }}>
          <p className="flex items-baseline gap-1.5">
            <span className="text-xs" style={{ color: "var(--t-muted)" }}>a partir de</span>
            <span className="text-lg font-bold tabular-nums" style={{ color: "var(--t-primary)" }}>{brl(p.preco)}</span>
          </p>
          <span className="inline-flex min-h-11 items-center gap-1.5 rounded-md border px-4 text-sm font-semibold" style={{ borderColor: "var(--t-primary)", color: "var(--t-primary)" }}>Ver e orçar <ArrowRight className="size-4" aria-hidden="true" /></span>
        </div>
      </div>
    </a>
  );
}

export function Categoria({ d, slug }: { d: DadosLoja; slug?: string }) {
  const { cat, titulo, lista, ordem, setOrdem, faixa, setFaixa } = useLista(d, slug);
  return (
    <main className={`${wrapE} py-8 sm:py-12`}>
      <CaminhoPao d={d} cat={cat ? { nome: cat.nome, href: cat.href } : undefined} />
      <Rotulo className="mt-6">Catálogo para empresas</Rotulo>
      <h1 className="mt-2 text-4xl sm:text-5xl" style={h}>{titulo}</h1>
      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-10">
        <aside className="min-w-0 lg:sticky lg:top-4" aria-label="Filtros">
          <p className="text-xs font-semibold tracking-[0.16em] uppercase" style={{ fontFamily: "var(--t-detalhe)", color: "var(--t-muted)" }}>Faixa de preço</p>
          <div className="mt-2 flex flex-wrap gap-2 lg:flex-col lg:gap-1.5" role="group" aria-label="Faixa de preço">
            {FAIXAS.map(([k, l]) => (
              <button key={k} type="button" aria-pressed={faixa === k} onClick={() => setFaixa(k)} className="min-h-11 rounded-md border px-4 text-left text-sm font-semibold" style={{ borderColor: faixa === k ? "var(--t-primary)" : "var(--t-line)", background: faixa === k ? "var(--t-primary)" : "var(--t-surface)", color: faixa === k ? "var(--t-on-primary)" : "var(--t-fg)" }}>{l}</button>
            ))}
          </div>
          <label className="mt-5 block text-xs font-semibold tracking-[0.16em] uppercase" style={{ fontFamily: "var(--t-detalhe)", color: "var(--t-muted)" }}>Ordenar
            <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} className="mt-2 block min-h-11 w-full rounded-md border px-3 text-sm font-semibold tracking-normal normal-case" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)", color: "var(--t-fg)", fontFamily: "var(--t-texto)" }}>
              {ORDENS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
        </aside>
        <section className="min-w-0" aria-label="Cestas">
          <p className="text-sm" style={{ color: "var(--t-muted)" }} aria-live="polite">{lista.length} {lista.length === 1 ? "cesta" : "cestas"} · valores unitários, quantidade no orçamento</p>
          {lista.length ? (
            <div className="mt-3 grid gap-2.5">
              {lista.map((p) => <Linha key={p.slug} p={p} />)}
            </div>
          ) : (
            <div className="mt-3 rounded-md border border-dashed p-8 text-center" style={{ borderColor: "var(--t-line)" }}>
              <p>Nenhuma cesta nessa faixa.</p>
              <button type="button" onClick={() => setFaixa("")} className="mt-3 inline-flex min-h-11 items-center rounded-md border px-5 font-semibold" style={{ borderColor: "var(--t-primary)", color: "var(--t-primary)" }}>Ver todas</button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export function Produto({ d, slug }: { d: DadosLoja; slug: string }) {
  const p = d.produtos.find((x) => x.slug === slug);
  const { comprar, ok } = useCompra(p);
  const { mudar } = useDemoCart();
  const [qtd, setQtd] = useState(1);
  const [sel, setSel] = useState(0);
  // A compra adiciona 1 unidade; o restante da quantidade escolhida entra logo depois,
  // já com o carrinho atualizado (evita duas gravações simultâneas sobre a mesma lista).
  const [resto, setResto] = useState(0);
  useEffect(() => {
    if (resto > 0 && p) {
      mudar(p.slug, resto);
      setResto(0);
    }
  }, [resto, mudar, p]);

  if (!p) return <NaoEncontrada d={d} />;
  const cat = d.categorias.find((c) => c.slug === p.categoria);
  const itens = itensLimpos(p);
  const foto = p.fotos[sel] ?? p.fotos[0];
  const ajustar = (n: number) => setQtd(Math.max(1, Math.min(MAX_QTD, Number.isFinite(n) ? Math.round(n) : 1)));
  const adicionar = () => {
    comprar();
    if (qtd > 1) setResto(qtd - 1);
  };
  return (
    <main className={`${wrapE} pt-8 pb-32 sm:pt-12 lg:pb-16`}>
      <CaminhoPao d={d} p={p} cat={cat ? { nome: cat.nome, href: cat.href } : undefined} />
      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12">
        <div className="min-w-0">
          <div className="overflow-hidden rounded-md border" style={{ borderColor: "var(--t-line)" }}>
            <Foto src={foto} alt={p.nome} className="aspect-[4/3] w-full object-cover" />
          </div>
          {p.fotos.length > 1 ? (
            <div className="mt-2 grid grid-cols-5 gap-2" role="group" aria-label="Fotos da cesta">
              {p.fotos.slice(0, 5).map((f, i) => (
                <button key={f + i} type="button" aria-label={`Ver foto ${i + 1}`} aria-pressed={sel === i} onClick={() => setSel(i)} className="min-h-11 overflow-hidden rounded-sm border-2" style={{ borderColor: sel === i ? "var(--t-primary)" : "var(--t-line)" }}>
                  <Foto src={f} alt="" className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="min-w-0">
          <Rotulo>{cat?.nome ?? "Catálogo para empresas"}</Rotulo>
          <h1 className="mt-2 text-3xl leading-tight sm:text-4xl" style={h}>{p.nome}</h1>
          {p.serve ? <p className="mt-1" style={{ color: "var(--t-muted)" }}>{p.serve}</p> : null}
          <p className="mt-5 flex flex-wrap items-baseline gap-x-2">
            <span className="text-sm" style={{ color: "var(--t-muted)" }}>a partir de</span>
            <span className="text-4xl font-bold tabular-nums" style={{ color: "var(--t-primary)", fontFamily: "var(--t-titulo)" }}>{brl(p.preco)}</span>
            <span className="text-sm" style={{ color: "var(--t-muted)" }}>por unidade</span>
          </p>
          <p className="mt-4 leading-relaxed" style={{ color: "var(--t-muted)" }}>{p.descricao}</p>

          <div className="mt-6 rounded-md border p-4 sm:p-5" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>
            <p className="text-sm font-bold" id="emp-qtd-rotulo">Quantidade de cestas</p>
            <div className="mt-2 flex items-center gap-2" role="group" aria-labelledby="emp-qtd-rotulo">
              <button type="button" aria-label="Menos uma" onClick={() => ajustar(qtd - 1)} className="flex size-12 items-center justify-center rounded-md border" style={{ borderColor: "var(--t-line)" }}><Minus className="size-5" /></button>
              <input aria-label="Quantidade" type="number" inputMode="numeric" min={1} max={MAX_QTD} value={qtd} onChange={(e) => ajustar(Number(e.target.value))} className="h-12 min-w-0 flex-1 rounded-md border text-center text-2xl font-bold tabular-nums" style={{ borderColor: "var(--t-line)", background: "var(--t-bg)", color: "var(--t-fg)" }} />
              <button type="button" aria-label="Mais uma" onClick={() => ajustar(qtd + 1)} className="flex size-12 items-center justify-center rounded-md border" style={{ borderColor: "var(--t-line)" }}><Plus className="size-5" /></button>
            </div>
            <p className="mt-3 flex items-baseline justify-between gap-3 border-t pt-3 text-sm" style={{ borderColor: "var(--t-line)" }}>
              <span style={{ color: "var(--t-muted)" }}>Subtotal estimado</span>
              <span className="text-lg font-bold tabular-nums">{brl(p.preco * qtd)}</span>
            </p>
            <button type="button" data-acao="comprar" onClick={adicionar} className="mt-4 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-md border text-base font-bold" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)", borderColor: "var(--t-primary)" }}>
              {ok ? <><Check className="size-5" /> Adicionado ao orçamento</> : "Adicionar ao orçamento"}
            </button>
            <a href={`${d.base}/carrinho`} className="mt-2 flex min-h-11 items-center justify-center rounded-md border text-sm font-semibold" style={{ borderColor: "var(--t-line)" }}>Ver meu orçamento</a>
            <p className="mt-3 text-xs leading-relaxed" style={{ color: "var(--t-muted)" }}>Até {MAX_QTD} por item neste orçamento. Para lotes maiores, peça pelo formulário da página inicial.</p>
          </div>

          <ul className="mt-5 grid gap-2 sm:grid-cols-3">
            {SELOS.slice(0, 3).map(({ Icone, titulo }) => (
              <li key={titulo} className="flex min-w-0 items-center gap-2 rounded-md border px-3 py-2.5 text-sm font-semibold" style={{ borderColor: "var(--t-line)" }}>
                <Icone className="size-4 shrink-0" style={{ color: "var(--t-primary)" }} aria-hidden="true" /><span className="min-w-0">{titulo}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {itens.length ? (
        <section className="mt-12 min-w-0" aria-labelledby="emp-itens">
          <Rotulo>Composição</Rotulo>
          <h2 id="emp-itens" className="mt-2 text-2xl" style={h}>O que vem na cesta</h2>
          <div className="mt-4 overflow-hidden rounded-md border" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>
            <table className="w-full text-left text-sm sm:text-base">
              <caption className="sr-only">Itens da cesta</caption>
              <thead>
                <tr style={{ color: "var(--t-muted)" }}>
                  <th scope="col" className="w-14 px-4 py-2.5 text-xs font-semibold tracking-wide uppercase">Nº</th>
                  <th scope="col" className="px-2 py-2.5 text-xs font-semibold tracking-wide uppercase">Item</th>
                  <th scope="col" className="px-4 py-2.5 text-right text-xs font-semibold tracking-wide uppercase">Qtd</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((it, n) => (
                  <tr key={it + n} className="border-t" style={{ borderColor: "var(--t-line)" }}>
                    <td className="px-4 py-3 tabular-nums" style={{ color: "var(--t-muted)" }}>{String(n + 1).padStart(2, "0")}</td>
                    <td className="px-2 py-3 font-medium">{it}</td>
                    <td className="px-4 py-3 text-right tabular-nums">1</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="mt-14" aria-labelledby="emp-outras">
        <h2 id="emp-outras" className="text-2xl" style={h}>Outras cestas do catálogo</h2>
        <div className="mt-4 grid gap-2.5">
          {d.produtos.filter((x) => x.slug !== p.slug).slice(0, 3).map((x) => <Linha key={x.slug} p={x} />)}
        </div>
      </section>

      <div className="fixed inset-x-0 z-30 flex items-center gap-3 border-t px-4 pt-2.5 lg:hidden" style={{ bottom: "var(--demo-barra-baixo, 0px)", paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))", background: "var(--t-surface)", borderColor: "var(--t-line)" }}>
        <div className="min-w-0 flex-1">
          <p className="text-xs" style={{ color: "var(--t-muted)" }}>{qtd} {qtd === 1 ? "cesta" : "cestas"}</p>
          <p className="text-lg font-bold tabular-nums">{brl(p.preco * qtd)}</p>
        </div>
        <button type="button" onClick={adicionar} className="min-h-11 rounded-md border px-5 font-bold" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)", borderColor: "var(--t-primary)" }}>{ok ? "Adicionado" : "Adicionar ao orçamento"}</button>
      </div>
    </main>
  );
}

export function Carrinho({ d }: { d: DadosLoja }) {
  const { itens, total, quantidade } = useDemoCart();
  return (
    <main className={`${wrapE} py-8 sm:py-12`}>
      <Rotulo>Seu pedido</Rotulo>
      <h1 className="mt-2 text-4xl sm:text-5xl" style={h}>Orçamento</h1>
      {itens.length === 0 ? (
        <CarrinhoVazio d={d} className="mt-8 rounded-md border border-dashed p-10 text-center" botao="mt-4 inline-flex min-h-12 items-center rounded-md border px-8 font-bold" />
      ) : (
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <ul className="min-w-0 overflow-hidden rounded-md border" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>
            {itens.map((i, n) => (
              <li key={i.slug} className={`grid min-w-0 grid-cols-[72px_minmax(0,1fr)] gap-x-4 gap-y-2 p-3 sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:p-4 ${n ? "border-t" : ""}`} style={{ borderColor: "var(--t-line)" }}>
                <Foto src={i.foto} alt={i.nome} className="aspect-square w-full rounded-sm object-cover" />
                <div className="min-w-0">
                  <p className="line-clamp-2 font-bold">{i.nome}</p>
                  <p className="text-sm tabular-nums" style={{ color: "var(--t-muted)" }}>{brl(i.preco)} por unidade</p>
                  <Quantidade slug={i.slug} nome={i.nome} qtd={i.qtd} redondo={false} className="mt-2" />
                </div>
                <p className="col-span-2 text-right text-lg font-bold tabular-nums sm:col-span-1 sm:text-base">{brl(i.preco * i.qtd)}</p>
              </li>
            ))}
          </ul>
          <aside className="min-w-0 rounded-md border p-5 sm:p-6" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>
            <p className="text-xs font-semibold tracking-[0.16em] uppercase" style={{ fontFamily: "var(--t-detalhe)", color: "var(--t-primary)" }}>Resumo</p>
            <dl className="mt-3 text-sm">
              <div className="flex justify-between border-b py-2.5" style={{ borderColor: "var(--t-line)" }}><dt style={{ color: "var(--t-muted)" }}>Cestas</dt><dd className="font-semibold tabular-nums">{quantidade}</dd></div>
              <div className="flex items-baseline justify-between pt-3 text-xl font-bold"><dt>Total</dt><dd className="tabular-nums" style={{ color: "var(--t-primary)" }}>{brl(total)}</dd></div>
            </dl>
            <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--t-muted)" }}>Data de entrega, endereço e mensagem do cartão são definidos ao finalizar. Nota fiscal no pedido.</p>
            <AvisoSemCobranca d={d} className="mt-4 rounded-md p-3 text-sm" />
            <button type="button" aria-disabled={d.demo} className="mt-4 inline-flex min-h-14 w-full items-center justify-center rounded-md border text-base font-bold aria-disabled:cursor-not-allowed aria-disabled:opacity-80" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)", borderColor: "var(--t-primary)" }}>{rotuloFinalizar(d)}</button>
            <a href={`${d.base}/categoria`} className="mt-2 flex min-h-11 items-center justify-center text-sm font-semibold underline">Adicionar mais cestas</a>
          </aside>
        </div>
      )}
    </main>
  );
}
