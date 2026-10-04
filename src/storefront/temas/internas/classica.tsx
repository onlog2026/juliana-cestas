"use client";

import { useState } from "react";
import { Check, Gift, Truck } from "lucide-react";
import { Foto, brl } from "../kit";
import { useDemoCart } from "../demo-cart";
import type { DadosLoja, ProdutoLoja } from "../types";
import { AvisoSemCobranca, CaminhoPao, CarrinhoVazio, FAIXAS, NaoEncontrada, ORDENS, Quantidade, itensLimpos, rotuloFinalizar, useCompra, useLista, wrap, type Faixa, type Ordem } from "./comum";

/** CLÁSSICA — barra lateral de filtros, cartões com moldura branca (passe-partout), abas na cesta. */

const MOLDURA = "rounded-[14px] border bg-white p-1.5 shadow-[0_1px_2px_rgba(60,50,30,.06)]";

function Cartao({ p }: { p: ProdutoLoja }) {
  return (
    <a href={p.href} className="group block min-w-0">
      <div className={MOLDURA} style={{ borderColor: "var(--t-line)" }}>
        <Foto src={p.fotos[0]} alt={p.nome} className="aspect-[4/5] w-full rounded-[10px] object-cover" />
      </div>
      <p className="mt-3 line-clamp-2 leading-snug" style={{ fontFamily: "var(--t-titulo)", fontSize: 17 }}>{p.nome}</p>
      {p.serve ? <p className="text-xs" style={{ color: "var(--t-muted)" }}>{p.serve}</p> : null}
      <p className="mt-1 flex items-baseline gap-2">
        {p.precoDe ? <s className="text-sm" style={{ color: "var(--t-muted)" }}>{brl(p.precoDe)}</s> : null}
        <span className="text-lg font-bold" style={{ color: "var(--t-primary)" }}>{brl(p.preco)}</span>
      </p>
    </a>
  );
}

export function CategoriaClassica({ d, slug }: { d: DadosLoja; slug?: string }) {
  const { cat, titulo, lista, ordem, setOrdem, faixa, setFaixa } = useLista(d, slug);
  const filtros = (
    <div className="grid gap-6 text-[15px]">
      <div>
        <p className="mb-2 text-xs font-bold tracking-[0.14em] uppercase" style={{ color: "var(--t-muted)" }}>Categorias</p>
        <ul className="grid gap-0.5">
          <li><a href={`${d.base}/categoria`} className="flex min-h-11 items-center" style={{ fontWeight: slug ? 400 : 700 }}>Todas as cestas</a></li>
          {d.categorias.map((c) => <li key={c.slug}><a href={c.href} className="flex min-h-11 items-center" style={{ fontWeight: c.slug === slug ? 700 : 400 }}>{c.nome}</a></li>)}
        </ul>
      </div>
      <fieldset>
        <legend className="mb-2 text-xs font-bold tracking-[0.14em] uppercase" style={{ color: "var(--t-muted)" }}>Preço</legend>
        {FAIXAS.map(([k, l]) => (
          <label key={k} className="flex min-h-11 cursor-pointer items-center gap-2"><input type="radio" name="faixa" checked={faixa === k} onChange={() => setFaixa(k as Faixa)} className="size-4" style={{ accentColor: "var(--t-primary)" }} />{l}</label>
        ))}
      </fieldset>
    </div>
  );
  return (
    <main className={`${wrap} py-8 sm:py-12`}>
      <CaminhoPao d={d} cat={cat ? { nome: cat.nome, href: cat.href } : undefined} />
      <h1 className="mt-3 text-4xl sm:text-5xl" style={{ fontFamily: "var(--t-titulo)" }}>{titulo}</h1>
      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-12">
        <aside>
          <details className="rounded-xl border px-4 lg:hidden" style={{ borderColor: "var(--t-line)" }}>
            <summary className="flex min-h-12 cursor-pointer items-center font-semibold">Filtrar cestas</summary>
            <div className="pb-4">{filtros}</div>
          </details>
          <div className="sticky top-24 hidden lg:block">{filtros}</div>
        </aside>
        <section>
          <div className="flex items-center justify-between gap-3 border-b pb-3" style={{ borderColor: "var(--t-line)" }}>
            <p className="text-sm" style={{ color: "var(--t-muted)" }} aria-live="polite">{lista.length} {lista.length === 1 ? "cesta" : "cestas"}</p>
            <label className="flex items-center gap-2 text-sm">Ordenar
              <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} className="h-11 rounded-lg border bg-white px-3" style={{ borderColor: "var(--t-line)" }}>
                {ORDENS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </label>
          </div>
          {lista.length ? (
            <div className="mt-8 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-4 gap-y-9 sm:gap-x-6 md:grid-cols-3">
              {lista.map((p) => <Cartao key={p.slug} p={p} />)}
            </div>
          ) : (
            <p className="mt-10 rounded-xl border border-dashed p-8 text-center" style={{ borderColor: "var(--t-line)" }}>Nenhuma cesta nessa faixa. <button type="button" className="underline" onClick={() => setFaixa("")}>Ver todas</button></p>
          )}
        </section>
      </div>
    </main>
  );
}

export function ProdutoClassica({ d, slug }: { d: DadosLoja; slug: string }) {
  const p = d.produtos.find((x) => x.slug === slug);
  const { comprar, ok } = useCompra(p);
  const [foto, setFoto] = useState(0);
  const [aba, setAba] = useState<"itens" | "entrega" | "cartao">("itens");
  if (!p) return <NaoEncontrada d={d} />;
  const cat = d.categorias.find((c) => c.slug === p.categoria);
  const itens = itensLimpos(p);
  const abas = [["itens", "O que vem"], ["entrega", "Entrega"], ["cartao", "Cartão"]] as const;
  return (
    <main className={`${wrap} py-8 sm:py-12`}>
      <CaminhoPao d={d} p={p} cat={cat ? { nome: cat.nome, href: cat.href } : undefined} />
      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-14">
        <div className="grid min-w-0 gap-3 lg:grid-cols-[72px_minmax(0,1fr)]">
          <div className="order-2 flex gap-2 overflow-x-auto lg:order-1 lg:flex-col" role="group" aria-label="Fotos da cesta">
            {p.fotos.map((f, i) => (
              <button key={f} type="button" onClick={() => setFoto(i)} aria-label={`Foto ${i + 1}`} aria-pressed={i === foto} className="size-[72px] shrink-0 overflow-hidden rounded-lg border-2 bg-white p-0.5" style={{ borderColor: i === foto ? "var(--t-primary)" : "var(--t-line)" }}>
                <Foto src={f} alt="" className="size-full rounded-md object-cover" />
              </button>
            ))}
          </div>
          <div className={`order-1 min-w-0 lg:order-2 ${MOLDURA}`} style={{ borderColor: "var(--t-line)" }}>
            <Foto src={p.fotos[foto]} alt={p.nome} className="aspect-[4/5] w-full rounded-[10px] object-cover sm:aspect-square" />
          </div>
        </div>
        <div className="min-w-0">
          <h1 className="text-4xl leading-tight sm:text-5xl" style={{ fontFamily: "var(--t-titulo)" }}>{p.nome}</h1>
          {p.serve ? <p className="mt-1" style={{ color: "var(--t-muted)" }}>{p.serve}</p> : null}
          <p className="mt-4 flex items-baseline gap-3">
            {p.precoDe ? <s style={{ color: "var(--t-muted)" }}>{brl(p.precoDe)}</s> : null}
            <span className="text-3xl font-bold" style={{ color: "var(--t-primary)" }}>{brl(p.preco)}</span>
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--t-muted)" }}>ou 3x de {brl(p.preco / 3)} no cartão</p>
          <p className="mt-5 leading-relaxed" style={{ color: "var(--t-muted)" }}>{p.descricao}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={comprar} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-8 font-semibold" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>
              {ok ? <><Check className="size-5" /> Adicionada</> : "Adicionar ao carrinho"}
            </button>
            <a href={`${d.base}/carrinho`} className="inline-flex min-h-12 items-center justify-center rounded-full border px-8 font-semibold" style={{ borderColor: "var(--t-primary)", color: "var(--t-primary)" }}>Ver carrinho</a>
          </div>
          <p className="mt-4 flex items-center gap-2 text-sm" style={{ color: "var(--t-muted)" }}><Truck className="size-4" /> Entrega com data e horário marcados</p>

          <div className="mt-8" role="tablist" aria-label="Detalhes da cesta">
            <div className="flex gap-1 border-b" style={{ borderColor: "var(--t-line)" }}>
              {abas.map(([k, l]) => (
                <button key={k} type="button" role="tab" aria-selected={aba === k} onClick={() => setAba(k)} className="min-h-11 px-4 text-sm font-semibold" style={{ borderBottom: `2px solid ${aba === k ? "var(--t-primary)" : "transparent"}`, color: aba === k ? "var(--t-primary)" : "var(--t-muted)" }}>{l}</button>
              ))}
            </div>
            <div role="tabpanel" className="pt-4 text-sm">
              {aba === "itens" ? (itens.length ? (
                <ul className="grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2">{itens.map((i) => <li key={i} className="flex min-w-0 gap-2"><Check className="mt-0.5 size-4 shrink-0" style={{ color: "var(--t-primary)" }} /><span className="min-w-0">{i}</span></li>)}</ul>
              ) : <p style={{ color: "var(--t-muted)" }}>A lista de itens desta cesta ainda não foi cadastrada.</p>) : null}
              {aba === "entrega" ? <p className="leading-relaxed" style={{ color: "var(--t-muted)" }}>Você escolhe o dia e o horário no pedido. A cesta chega montada, fresquinha e embalada para presente.</p> : null}
              {aba === "cartao" ? <p className="flex gap-2 leading-relaxed" style={{ color: "var(--t-muted)" }}><Gift className="mt-0.5 size-4 shrink-0" /> Cartão de mensagem incluso: escreva o recado e nós entregamos junto com a cesta.</p> : null}
            </div>
          </div>
        </div>
      </div>
      <section className="mt-16" aria-labelledby="outras">
        <h2 id="outras" className="text-2xl sm:text-3xl" style={{ fontFamily: "var(--t-titulo)" }}>Outras cestas</h2>
        <div className="mt-5 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-4 gap-y-9 sm:grid-cols-4 sm:gap-x-6">
          {d.produtos.filter((x) => x.slug !== p.slug).slice(0, 4).map((x) => <Cartao key={x.slug} p={x} />)}
        </div>
      </section>
      <div className="fixed inset-x-0 z-30 flex items-center gap-3 border-t px-4 py-2 lg:hidden" style={{ bottom: "var(--demo-barra-baixo, 0px)", background: "var(--t-bg)", borderColor: "var(--t-line)" }}>
        <p className="min-w-0 flex-1 text-lg font-bold">{brl(p.preco)}</p>
        <button type="button" onClick={comprar} className="min-h-11 rounded-full px-6 font-semibold" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>{ok ? "Adicionada" : "Adicionar"}</button>
      </div>
    </main>
  );
}

export function CarrinhoClassica({ d }: { d: DadosLoja }) {
  const { itens, total } = useDemoCart();
  return (
    <main className={`${wrap} py-8 sm:py-12`}>
      <h1 className="text-4xl sm:text-5xl" style={{ fontFamily: "var(--t-titulo)" }}>Seu carrinho</h1>
      {itens.length === 0 ? <CarrinhoVazio d={d} botao="mt-4 inline-flex min-h-12 items-center rounded-full px-7 font-semibold" /> : (
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <ul className="grid gap-4">
            {itens.map((i) => (
              <li key={i.slug} className={`flex gap-4 ${MOLDURA}`} style={{ borderColor: "var(--t-line)" }}>
                <Foto src={i.foto} alt="" className="size-24 shrink-0 rounded-[10px] object-cover" />
                <div className="min-w-0 flex-1 py-1">
                  <p style={{ fontFamily: "var(--t-titulo)", fontSize: 18 }}>{i.nome}</p>
                  <p className="text-sm" style={{ color: "var(--t-muted)" }}>{brl(i.preco)} cada</p>
                  <Quantidade slug={i.slug} nome={i.nome} qtd={i.qtd} className="mt-2" />
                </div>
                <p className="shrink-0 py-1 pr-2 font-bold" style={{ color: "var(--t-primary)" }}>{brl(i.preco * i.qtd)}</p>
              </li>
            ))}
          </ul>
          <aside className="h-fit rounded-2xl border bg-white p-6" style={{ borderColor: "var(--t-line)" }}>
            <h2 className="text-xl" style={{ fontFamily: "var(--t-titulo)" }}>Resumo</h2>
            <p className="mt-3 flex justify-between text-sm"><span>Subtotal</span><span>{brl(total)}</span></p>
            <p className="mt-1 flex justify-between text-sm" style={{ color: "var(--t-muted)" }}><span>Entrega</span><span>no pedido</span></p>
            <p className="mt-3 flex justify-between border-t pt-3 text-xl" style={{ borderColor: "var(--t-line)" }}><span>Total</span><b>{brl(total)}</b></p>
            <AvisoSemCobranca d={d} className="mt-4 rounded-lg p-3 text-sm" />
            <button type="button" disabled={d.demo} className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-full px-6 font-semibold disabled:opacity-50" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>{rotuloFinalizar(d)}</button>
          </aside>
        </div>
      )}
    </main>
  );
}
