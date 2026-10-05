"use client";

import { Check } from "lucide-react";
import { Foto, brl } from "../kit";
import { useDemoCart } from "../demo-cart";
import type { DadosLoja, ProdutoLoja } from "../types";
import { AvisoSemCobranca, CaminhoPao, CarrinhoVazio, FAIXAS, NaoEncontrada, ORDENS, Quantidade, itensLimpos, rotuloFinalizar, useCompra, useLista, wrap, type Ordem } from "./comum";

/** NOIR — fundo escuro, fio dourado, tipografia serifada em caixa-alta, foto grande presa na tela, itens em numeração romana. */

const CAPS = "text-[11px] tracking-[0.25em] uppercase";
const ROMANO = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"];

function Cartao({ p }: { p: ProdutoLoja }) {
  return (
    <a href={p.href} className="group block min-w-0">
      <div className="overflow-hidden border" style={{ borderColor: "var(--t-line)" }}>
        <Foto src={p.fotos[0]} alt={p.nome} className="aspect-[3/4] w-full object-cover opacity-95 transition-all duration-500 group-hover:scale-[1.03] group-hover:opacity-100" />
      </div>
      <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--t-accent)" }}>
        <p className="line-clamp-2 text-lg leading-snug" style={{ fontFamily: "var(--t-titulo)" }}>{p.nome}</p>
        <p className={`mt-1 ${CAPS}`} style={{ color: "var(--t-accent)" }}>{brl(p.preco)}</p>
      </div>
    </a>
  );
}

export function CategoriaNoir({ d, slug }: { d: DadosLoja; slug?: string }) {
  const { cat, titulo, lista, ordem, setOrdem, faixa, setFaixa } = useLista(d, slug);
  return (
    <main className={`${wrap} py-10 sm:py-16`}>
      <CaminhoPao d={d} cat={cat ? { nome: cat.nome, href: cat.href } : undefined} />
      <h1 className="mt-4 text-4xl tracking-wide uppercase sm:text-6xl" style={{ fontFamily: "var(--t-titulo)" }}>{titulo}</h1>
      <div className="mt-4 h-px w-24" style={{ background: "var(--t-accent)" }} />
      <div className="mt-8 flex flex-wrap items-center gap-x-6 border-y" style={{ borderColor: "var(--t-line)" }}>
        {FAIXAS.map(([k, l]) => (
          <button key={k} type="button" aria-pressed={faixa === k} onClick={() => setFaixa(k)} className={`min-h-12 ${CAPS}`} style={{ color: faixa === k ? "var(--t-accent)" : "var(--t-muted)" }}>{l}</button>
        ))}
        <label className={`ml-auto flex items-center gap-2 ${CAPS}`} style={{ color: "var(--t-muted)" }}>
          <span className="sr-only">Ordenar</span>
          <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} aria-label="Ordenar" className="h-12 bg-transparent tracking-[0.2em] uppercase" style={{ color: "var(--t-fg)" }}>
            {ORDENS.map(([k, l]) => <option key={k} value={k} style={{ color: "#111" }}>{l}</option>)}
          </select>
        </label>
      </div>
      <p className={`mt-4 ${CAPS}`} style={{ color: "var(--t-muted)" }} aria-live="polite">{lista.length} {lista.length === 1 ? "seleção" : "seleções"}</p>
      {lista.length ? (
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-4 gap-y-12 sm:gap-x-8 lg:grid-cols-3 xl:grid-cols-4">
          {lista.map((p) => <Cartao key={p.slug} p={p} />)}
        </div>
      ) : (
        <p className="mt-12 text-center" style={{ color: "var(--t-muted)" }}>Nenhuma seleção nessa faixa. <button type="button" className="underline" style={{ color: "var(--t-accent)" }} onClick={() => setFaixa("")}>Ver todas</button></p>
      )}
    </main>
  );
}

export function ProdutoNoir({ d, slug }: { d: DadosLoja; slug: string }) {
  const p = d.produtos.find((x) => x.slug === slug);
  const { comprar, ok } = useCompra(p);
  if (!p) return <NaoEncontrada d={d} />;
  const cat = d.categorias.find((c) => c.slug === p.categoria);
  const itens = itensLimpos(p);
  return (
    <main>
      <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-2">
        <div className="min-w-0 lg:sticky lg:top-0 lg:h-[100dvh]">
          <Foto src={p.fotos[0]} alt={p.nome} className="aspect-[4/5] w-full object-cover lg:aspect-auto lg:h-full" />
        </div>
        <div className="min-w-0 px-5 py-10 sm:px-10 lg:px-16 lg:py-20">
          <CaminhoPao d={d} p={p} cat={cat ? { nome: cat.nome, href: cat.href } : undefined} />
          <h1 className="mt-6 text-4xl leading-tight uppercase sm:text-5xl" style={{ fontFamily: "var(--t-titulo)" }}>{p.nome}</h1>
          <div className="mt-5 h-px w-20" style={{ background: "var(--t-accent)" }} />
          <p className="mt-5 text-3xl" style={{ fontFamily: "var(--t-titulo)", color: "var(--t-accent)" }}>{p.precoDe ? <s className="mr-3 text-lg" style={{ color: "var(--t-muted)" }}>{brl(p.precoDe)}</s> : null}{brl(p.preco)}</p>
          {p.serve ? <p className={`mt-2 ${CAPS}`} style={{ color: "var(--t-muted)" }}>{p.serve}</p> : null}
          <p className="mt-6 leading-[1.85]" style={{ color: "var(--t-muted)" }}>{p.descricao}</p>
          {itens.length ? (
            <section className="mt-8" aria-labelledby="composicao">
              <h2 id="composicao" className={CAPS} style={{ color: "var(--t-accent)" }}>Composição</h2>
              <ol className="mt-3 border-t" style={{ borderColor: "var(--t-line)" }}>
                {itens.map((i, n) => <li key={i} className="flex min-w-0 gap-4 border-b py-3" style={{ borderColor: "var(--t-line)" }}><span className="w-8 shrink-0 text-sm" style={{ fontFamily: "var(--t-titulo)", color: "var(--t-accent)" }}>{ROMANO[n] ?? n + 1}</span><span className="min-w-0">{i}</span></li>)}
              </ol>
            </section>
          ) : null}
          <button type="button" onClick={comprar} className={`mt-10 inline-flex min-h-14 w-full items-center justify-center gap-2 border ${CAPS} font-semibold`} style={{ borderColor: "var(--t-accent)", background: "var(--t-accent)", color: "var(--t-bg)" }}>
            {ok ? <><Check className="size-4" /> Adicionada</> : "Adicionar ao carrinho"}
          </button>
          <a href={`${d.base}/carrinho`} className={`mt-3 flex min-h-12 w-full items-center justify-center border ${CAPS}`} style={{ borderColor: "var(--t-line)" }}>Ver carrinho</a>
          <p className="mt-4 text-sm" style={{ color: "var(--t-muted)" }}>Dia e horário de entrega escolhidos no pedido. Cartão de mensagem incluso.</p>
        </div>
      </div>
      <section className={`${wrap} py-16`} aria-labelledby="outras">
        <h2 id="outras" className={CAPS} style={{ color: "var(--t-accent)" }}>Outras seleções</h2>
        <div className="mt-6 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-4 gap-y-12 sm:grid-cols-4 sm:gap-x-8">
          {d.produtos.filter((x) => x.slug !== p.slug).slice(0, 4).map((x) => <Cartao key={x.slug} p={x} />)}
        </div>
      </section>
      <div className="fixed inset-x-0 z-30 flex items-center gap-3 border-t px-4 py-2 lg:hidden" style={{ bottom: "var(--demo-barra-baixo, 0px)", background: "var(--t-bg)", borderColor: "var(--t-accent)" }}>
        <p className="min-w-0 flex-1 text-lg" style={{ fontFamily: "var(--t-titulo)", color: "var(--t-accent)" }}>{brl(p.preco)}</p>
        <button type="button" onClick={comprar} className={`min-h-11 px-6 ${CAPS} font-semibold`} style={{ background: "var(--t-accent)", color: "var(--t-bg)" }}>{ok ? "Adicionada" : "Adicionar"}</button>
      </div>
    </main>
  );
}

export function CarrinhoNoir({ d }: { d: DadosLoja }) {
  const { itens, total } = useDemoCart();
  return (
    <main className={`${wrap} py-10 sm:py-16`}>
      <h1 className="text-4xl tracking-wide uppercase sm:text-5xl" style={{ fontFamily: "var(--t-titulo)" }}>Sua seleção</h1>
      <div className="mt-4 h-px w-24" style={{ background: "var(--t-accent)" }} />
      {itens.length === 0 ? <CarrinhoVazio d={d} className="mt-10 border p-12 text-center" botao={`mt-6 inline-flex min-h-12 items-center px-8 ${CAPS} font-semibold`} /> : (
        <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <ul className="border-t" style={{ borderColor: "var(--t-line)" }}>
            {itens.map((i) => (
              <li key={i.slug} className="flex gap-4 border-b py-5" style={{ borderColor: "var(--t-line)" }}>
                <Foto src={i.foto} alt="" className="aspect-[3/4] w-24 shrink-0 object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="text-xl" style={{ fontFamily: "var(--t-titulo)" }}>{i.nome}</p>
                  <p className={`mt-1 ${CAPS}`} style={{ color: "var(--t-muted)" }}>{brl(i.preco)} cada</p>
                  <Quantidade slug={i.slug} nome={i.nome} qtd={i.qtd} redondo={false} className="mt-3" />
                </div>
                <p className="shrink-0" style={{ fontFamily: "var(--t-titulo)", color: "var(--t-accent)" }}>{brl(i.preco * i.qtd)}</p>
              </li>
            ))}
          </ul>
          <aside className="h-fit border p-6" style={{ borderColor: "var(--t-accent)" }}>
            <p className={CAPS} style={{ color: "var(--t-accent)" }}>Total</p>
            <p className="mt-2 text-4xl" style={{ fontFamily: "var(--t-titulo)" }}>{brl(total)}</p>
            <p className="mt-2 text-sm" style={{ color: "var(--t-muted)" }}>Entrega e cartão de mensagem no pedido.</p>
            <AvisoSemCobranca d={d} className="mt-4 border p-3 text-sm" />
            <button type="button" aria-disabled={d.demo} className={`mt-5 inline-flex min-h-14 w-full items-center justify-center ${CAPS} font-semibold aria-disabled:cursor-not-allowed`} style={{ background: "var(--t-accent)", color: "var(--t-bg)" }}>{rotuloFinalizar(d)}</button>
          </aside>
        </div>
      )}
    </main>
  );
}
