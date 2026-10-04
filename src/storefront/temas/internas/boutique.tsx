"use client";

import { Check } from "lucide-react";
import { Foto, brl } from "../kit";
import { useDemoCart } from "../demo-cart";
import type { DadosLoja, ProdutoLoja } from "../types";
import { AvisoSemCobranca, CaminhoPao, CarrinhoVazio, FAIXAS, NaoEncontrada, ORDENS, Quantidade, itensLimpos, rotuloFinalizar, useCompra, useLista, wrap, type Ordem } from "./comum";

/** BOUTIQUE — muito respiro, fotos altas sem borda, filtros em texto, galeria empilhada e compra fixa ao lado. */

const CAPS = "text-[11px] tracking-[0.22em] uppercase";

function Cartao({ p }: { p: ProdutoLoja }) {
  return (
    <a href={p.href} className="group block min-w-0">
      <div className="overflow-hidden" style={{ background: "var(--t-surface)" }}>
        <Foto src={p.fotos[0]} alt={p.nome} className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
      </div>
      <p className={`mt-4 line-clamp-1 text-center ${CAPS}`}>{p.nome}</p>
      <p className="mt-1 text-center text-sm" style={{ color: "var(--t-muted)" }}>{brl(p.preco)}</p>
    </a>
  );
}

export function CategoriaBoutique({ d, slug }: { d: DadosLoja; slug?: string }) {
  const { titulo, lista, ordem, setOrdem, faixa, setFaixa } = useLista(d, slug);
  return (
    <main className={`${wrap} py-12 sm:py-20`}>
      <p className={`text-center ${CAPS}`} style={{ color: "var(--t-muted)" }}>Coleção</p>
      <h1 className="mt-3 text-center text-4xl sm:text-6xl" style={{ fontFamily: "var(--t-titulo)", fontWeight: 400 }}>{titulo}</h1>

      <nav aria-label="Categorias" className="mt-8 flex flex-wrap justify-center gap-x-6">
        <a href={`${d.base}/categoria`} className={CAPS} style={{ borderBottom: slug ? "1px solid transparent" : "1px solid var(--t-fg)" }}>Todas</a>
        {d.categorias.map((c) => <a key={c.slug} href={c.href} className={CAPS} style={{ borderBottom: c.slug === slug ? "1px solid var(--t-fg)" : "1px solid transparent" }}>{c.nome}</a>)}
      </nav>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 border-y py-1" style={{ borderColor: "var(--t-line)" }}>
        {FAIXAS.map(([k, l]) => (
          <button key={k} type="button" aria-pressed={faixa === k} onClick={() => setFaixa(k)} className="min-h-11 text-sm" style={{ textDecoration: faixa === k ? "underline" : "none", textUnderlineOffset: 6, color: faixa === k ? "var(--t-fg)" : "var(--t-muted)" }}>{l}</button>
        ))}
        <label className="flex items-center gap-2 text-sm" style={{ color: "var(--t-muted)" }}>
          <span className="sr-only">Ordenar</span>
          <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} className="h-11 bg-transparent" aria-label="Ordenar">
            {ORDENS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
      </div>

      {lista.length ? (
        <div className="mt-12 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-4 gap-y-14 sm:gap-x-8 lg:grid-cols-3">
          {lista.map((p) => <Cartao key={p.slug} p={p} />)}
        </div>
      ) : (
        <p className="mt-16 text-center" style={{ color: "var(--t-muted)" }}>Nada nessa faixa. <button type="button" className="underline" onClick={() => setFaixa("")}>Ver tudo</button></p>
      )}
    </main>
  );
}

export function ProdutoBoutique({ d, slug }: { d: DadosLoja; slug: string }) {
  const p = d.produtos.find((x) => x.slug === slug);
  const { comprar, ok } = useCompra(p);
  if (!p) return <NaoEncontrada d={d} />;
  const cat = d.categorias.find((c) => c.slug === p.categoria);
  const itens = itensLimpos(p);
  return (
    <main className={`${wrap} py-8 sm:py-12`}>
      <CaminhoPao d={d} p={p} cat={cat ? { nome: cat.nome, href: cat.href } : undefined} />
      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-20">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {p.fotos.map((f, i) => (
            <div key={f} className={i === 0 ? "sm:col-span-2 lg:col-span-1" : ""} style={{ background: "var(--t-surface)" }}>
              <Foto src={f} alt={i === 0 ? p.nome : ""} className="aspect-[4/5] w-full object-cover" />
            </div>
          ))}
        </div>
        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <p className={CAPS} style={{ color: "var(--t-muted)" }}>{cat?.nome ?? "Cesta"}</p>
          <h1 className="mt-3 text-4xl leading-tight sm:text-5xl" style={{ fontFamily: "var(--t-titulo)", fontWeight: 400 }}>{p.nome}</h1>
          <p className="mt-4 text-xl">{p.precoDe ? <s className="mr-3 text-base" style={{ color: "var(--t-muted)" }}>{brl(p.precoDe)}</s> : null}{brl(p.preco)}</p>
          {p.serve ? <p className="mt-1 text-sm" style={{ color: "var(--t-muted)" }}>{p.serve}</p> : null}
          <p className="mt-6 leading-[1.8]" style={{ color: "var(--t-muted)" }}>{p.descricao}</p>
          <button type="button" onClick={comprar} className={`mt-8 inline-flex min-h-14 w-full items-center justify-center gap-2 ${CAPS} font-semibold`} style={{ background: "var(--t-fg)", color: "var(--t-bg)" }}>
            {ok ? <><Check className="size-4" /> Adicionada</> : "Adicionar ao carrinho"}
          </button>
          <a href={`${d.base}/carrinho`} className={`mt-3 flex min-h-12 w-full items-center justify-center border ${CAPS}`} style={{ borderColor: "var(--t-fg)" }}>Ver carrinho</a>
          {itens.length ? (
            <details className="mt-8 border-t" style={{ borderColor: "var(--t-line)" }} open>
              <summary className={`flex min-h-12 cursor-pointer items-center ${CAPS}`}>O que vem na cesta</summary>
              <ul className="grid gap-2 pb-4 text-sm" style={{ color: "var(--t-muted)" }}>{itens.map((i) => <li key={i}>— {i}</li>)}</ul>
            </details>
          ) : null}
          <details className="border-t border-b" style={{ borderColor: "var(--t-line)" }}>
            <summary className={`flex min-h-12 cursor-pointer items-center ${CAPS}`}>Entrega e cartão</summary>
            <p className="pb-4 text-sm leading-relaxed" style={{ color: "var(--t-muted)" }}>Dia e horário escolhidos no pedido. Cartão de mensagem incluso, escrito por você.</p>
          </details>
        </div>
      </div>
      <section className="mt-24" aria-labelledby="outras">
        <h2 id="outras" className={`text-center ${CAPS}`}>Você também pode gostar</h2>
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-4 gap-y-12 sm:grid-cols-4 sm:gap-x-8">
          {d.produtos.filter((x) => x.slug !== p.slug).slice(0, 4).map((x) => <Cartao key={x.slug} p={x} />)}
        </div>
      </section>
      <div className="fixed inset-x-0 z-30 flex items-center gap-3 border-t px-4 py-2 lg:hidden" style={{ bottom: "var(--demo-barra-baixo, 0px)", background: "var(--t-bg)", borderColor: "var(--t-line)" }}>
        <p className="min-w-0 flex-1">{brl(p.preco)}</p>
        <button type="button" onClick={comprar} className={`min-h-11 px-6 ${CAPS} font-semibold`} style={{ background: "var(--t-fg)", color: "var(--t-bg)" }}>{ok ? "Adicionada" : "Adicionar"}</button>
      </div>
    </main>
  );
}

export function CarrinhoBoutique({ d }: { d: DadosLoja }) {
  const { itens, total } = useDemoCart();
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-20">
      <h1 className="text-center text-4xl sm:text-5xl" style={{ fontFamily: "var(--t-titulo)", fontWeight: 400 }}>Sacola</h1>
      {itens.length === 0 ? <CarrinhoVazio d={d} className="mt-10 border-y py-12 text-center" botao={`mt-6 inline-flex min-h-12 items-center px-8 ${CAPS} font-semibold`} /> : (
        <>
          <ul className="mt-10 border-t" style={{ borderColor: "var(--t-line)" }}>
            {itens.map((i) => (
              <li key={i.slug} className="flex gap-4 border-b py-5" style={{ borderColor: "var(--t-line)" }}>
                <Foto src={i.foto} alt="" className="aspect-[3/4] w-24 shrink-0 object-cover" />
                <div className="min-w-0 flex-1">
                  <p className={CAPS}>{i.nome}</p>
                  <p className="mt-1 text-sm" style={{ color: "var(--t-muted)" }}>{brl(i.preco)}</p>
                  <Quantidade slug={i.slug} nome={i.nome} qtd={i.qtd} redondo={false} className="mt-3" />
                </div>
                <p className="shrink-0 text-sm">{brl(i.preco * i.qtd)}</p>
              </li>
            ))}
          </ul>
          <p className={`mt-8 flex justify-between ${CAPS}`}><span>Total</span><span className="text-base tracking-normal normal-case">{brl(total)}</span></p>
          <p className="mt-1 text-xs" style={{ color: "var(--t-muted)" }}>Entrega e cartão de mensagem são escolhidos no pedido.</p>
          <AvisoSemCobranca d={d} className="mt-6 border p-4 text-sm" />
          <button type="button" disabled={d.demo} className={`mt-6 inline-flex min-h-14 w-full items-center justify-center ${CAPS} font-semibold disabled:opacity-50`} style={{ background: "var(--t-fg)", color: "var(--t-bg)" }}>{rotuloFinalizar(d)}</button>
        </>
      )}
    </main>
  );
}
