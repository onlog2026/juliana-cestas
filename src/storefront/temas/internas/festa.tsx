"use client";

import { Check, PartyPopper, Sparkles } from "lucide-react";
import { Foto, brl } from "../kit";
import { useDemoCart } from "../demo-cart";
import type { DadosLoja, ProdutoLoja } from "../types";
import { AvisoSemCobranca, CaminhoPao, CarrinhoVazio, FAIXAS, NaoEncontrada, ORDENS, Quantidade, itensLimpos, rotuloFinalizar, useCompra, useLista, wrap, type Ordem } from "./comum";

/** FESTA — cores vivas, cantos bem redondos, etiquetas de preço, itens como balões. */

const CORES = ["var(--t-primary)", "var(--t-accent)", "#2fb5a3", "#f2b705"];
const cor = (i: number) => CORES[i % CORES.length];
/** Texto legível sobre cada cor da lista acima. */
const TXT = ["var(--t-on-primary)", "var(--t-on-accent)", "#0b2b27", "#1f1700"];
const txt = (i: number) => TXT[i % TXT.length];

function Cartao({ p, i }: { p: ProdutoLoja; i: number }) {
  return (
    <a href={p.href} className="group relative block min-w-0 rounded-[28px] p-2.5 transition-transform hover:-translate-y-1" style={{ background: "color-mix(in srgb, " + cor(i) + " 14%, var(--t-bg))" }}>
      <Foto src={p.fotos[0]} alt={p.nome} className="aspect-square w-full rounded-[22px] object-cover" />
      <span className="absolute top-5 right-4 rotate-6 rounded-full px-3 py-1 text-sm font-extrabold shadow-md" style={{ background: cor(i), color: txt(i) }}>{brl(p.preco)}</span>
      <p className="mt-3 line-clamp-2 px-1.5 pb-2 text-center text-base leading-tight font-extrabold" style={{ fontFamily: "var(--t-titulo)" }}>{p.nome}</p>
    </a>
  );
}

export function CategoriaFesta({ d, slug }: { d: DadosLoja; slug?: string }) {
  const { cat, titulo, lista, ordem, setOrdem, faixa, setFaixa } = useLista(d, slug);
  return (
    <main className={`${wrap} py-8 sm:py-12`}>
      <CaminhoPao d={d} cat={cat ? { nome: cat.nome, href: cat.href } : undefined} />
      <h1 className="mt-3 flex items-center gap-3 text-4xl font-extrabold sm:text-6xl" style={{ fontFamily: "var(--t-titulo)", color: "var(--t-primary)" }}><PartyPopper className="size-9 sm:size-12" aria-hidden="true" />{titulo}</h1>
      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Faixa de preço">
        {FAIXAS.map(([k, l], i) => (
          <button key={k} type="button" aria-pressed={faixa === k} onClick={() => setFaixa(k)} className="min-h-11 rounded-full border-2 px-5 text-sm font-bold" style={{ borderColor: cor(i), background: faixa === k ? cor(i) : "transparent", color: faixa === k ? txt(i) : "var(--t-fg)" }}>{l}</button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-sm font-bold">Ordenar
          <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} className="h-11 rounded-full border-2 bg-transparent px-4" style={{ borderColor: "var(--t-line)" }}>
            {ORDENS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
      </div>
      <p className="mt-3 text-sm font-semibold" style={{ color: "var(--t-muted)" }} aria-live="polite">{lista.length} {lista.length === 1 ? "cesta" : "cestas"} para a sua festa</p>
      {lista.length ? (
        <div className="mt-6 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {lista.map((p, i) => <Cartao key={p.slug} p={p} i={i} />)}
        </div>
      ) : (
        <p className="mt-8 rounded-[28px] border-2 border-dashed p-8 text-center font-semibold" style={{ borderColor: "var(--t-line)" }}>Nenhuma cesta nessa faixa. <button type="button" className="underline" onClick={() => setFaixa("")}>Ver todas</button></p>
      )}
    </main>
  );
}

export function ProdutoFesta({ d, slug }: { d: DadosLoja; slug: string }) {
  const p = d.produtos.find((x) => x.slug === slug);
  const { comprar, ok } = useCompra(p);
  if (!p) return <NaoEncontrada d={d} />;
  const cat = d.categorias.find((c) => c.slug === p.categoria);
  const itens = itensLimpos(p);
  return (
    <main className={`${wrap} py-8 sm:py-12`}>
      <CaminhoPao d={d} p={p} cat={cat ? { nome: cat.nome, href: cat.href } : undefined} />
      <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="min-w-0">
          <div className="relative rounded-[36px] p-3" style={{ background: "color-mix(in srgb, var(--t-primary) 14%, var(--t-bg))" }}>
            <Foto src={p.fotos[0]} alt={p.nome} className="aspect-square w-full rounded-[28px] object-cover" />
            <span className="absolute -top-3 -left-2 flex size-20 -rotate-12 items-center justify-center rounded-full text-center text-xs leading-tight font-extrabold shadow-lg" style={{ background: "var(--t-accent)", color: "var(--t-on-accent)" }}>entrega<br />marcada!</span>
          </div>
          {p.fotos.length > 1 ? (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {p.fotos.slice(1, 5).map((f) => <Foto key={f} src={f} alt="" className="aspect-square w-full rounded-2xl object-cover" />)}
            </div>
          ) : null}
        </div>
        <div className="min-w-0">
          <h1 className="text-4xl leading-tight font-extrabold sm:text-5xl" style={{ fontFamily: "var(--t-titulo)" }}>{p.nome}</h1>
          {p.serve ? <p className="mt-1 font-semibold" style={{ color: "var(--t-muted)" }}>{p.serve}</p> : null}
          <p className="mt-4 inline-flex rotate-[-2deg] items-baseline gap-3 rounded-2xl px-5 py-2 shadow-md" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>
            {p.precoDe ? <s className="text-sm opacity-80">{brl(p.precoDe)}</s> : null}
            <span className="text-3xl font-extrabold">{brl(p.preco)}</span>
          </p>
          <p className="mt-5 leading-relaxed" style={{ color: "var(--t-muted)" }}>{p.descricao}</p>
          {itens.length ? (
            <section className="mt-6" aria-labelledby="o-que-vem">
              <h2 id="o-que-vem" className="flex items-center gap-2 text-xl font-extrabold" style={{ fontFamily: "var(--t-titulo)" }}><Sparkles className="size-5" aria-hidden="true" /> O que vem na cesta</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {itens.map((i, n) => <li key={i} className="rounded-full px-4 py-2 text-sm font-bold" style={{ background: "color-mix(in srgb, " + cor(n) + " 18%, var(--t-bg))", color: "var(--t-fg)" }}>{i}</li>)}
              </ul>
            </section>
          ) : null}
          <button type="button" data-acao="comprar" onClick={comprar} className="mt-8 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full text-lg font-extrabold shadow-lg" style={{ background: "var(--t-accent)", color: "var(--t-on-accent)" }}>
            {ok ? <><Check className="size-5" /> Adicionada!</> : "Quero essa festa!"}
          </button>
          <a href={`${d.base}/carrinho`} className="mt-3 flex min-h-12 w-full items-center justify-center rounded-full border-2 font-bold" style={{ borderColor: "var(--t-primary)", color: "var(--t-primary)" }}>Ver carrinho</a>
          <p className="mt-3 text-center text-sm" style={{ color: "var(--t-muted)" }}>Dia e horário marcados no pedido · cartão de mensagem incluso</p>
        </div>
      </div>
      <section className="mt-14" aria-labelledby="outras">
        <h2 id="outras" className="text-3xl font-extrabold" style={{ fontFamily: "var(--t-titulo)" }}>Tem mais festa por aqui</h2>
        <div className="mt-5 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 sm:grid-cols-4 sm:gap-5">
          {d.produtos.filter((x) => x.slug !== p.slug).slice(0, 4).map((x, i) => <Cartao key={x.slug} p={x} i={i + 1} />)}
        </div>
      </section>
      <div className="fixed inset-x-0 z-30 flex items-center gap-3 rounded-t-3xl px-4 py-2.5 lg:hidden" style={{ bottom: "var(--demo-barra-baixo, 0px)", background: "var(--t-primary)", color: "var(--t-on-primary)" }}>
        <p className="min-w-0 flex-1 text-lg font-extrabold">{brl(p.preco)}</p>
        <button type="button" onClick={comprar} className="min-h-11 rounded-full px-6 font-extrabold" style={{ background: "var(--t-accent)", color: "var(--t-on-accent)" }}>{ok ? "Adicionada!" : "Quero!"}</button>
      </div>
    </main>
  );
}

export function CarrinhoFesta({ d }: { d: DadosLoja }) {
  const { itens, total } = useDemoCart();
  return (
    <main className={`${wrap} py-8 sm:py-12`}>
      <h1 className="text-4xl font-extrabold sm:text-5xl" style={{ fontFamily: "var(--t-titulo)", color: "var(--t-primary)" }}>Seu carrinho de festa</h1>
      {itens.length === 0 ? <CarrinhoVazio d={d} className="mt-8 rounded-[32px] border-2 border-dashed p-10 text-center" botao="mt-4 inline-flex min-h-12 items-center rounded-full px-8 font-extrabold" /> : (
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <ul className="grid gap-4">
            {itens.map((i, n) => (
              <li key={i.slug} className="flex gap-4 rounded-[28px] p-3" style={{ background: "color-mix(in srgb, " + cor(n) + " 14%, var(--t-bg))" }}>
                <Foto src={i.foto} alt="" className="size-24 shrink-0 rounded-[20px] object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold" style={{ fontFamily: "var(--t-titulo)" }}>{i.nome}</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--t-muted)" }}>{brl(i.preco)} cada</p>
                  <Quantidade slug={i.slug} nome={i.nome} qtd={i.qtd} className="mt-2" />
                </div>
                <p className="shrink-0 pr-2 font-extrabold">{brl(i.preco * i.qtd)}</p>
              </li>
            ))}
          </ul>
          <aside className="h-fit rounded-[32px] p-6" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>
            <p className="flex justify-between text-2xl font-extrabold"><span>Total</span><span>{brl(total)}</span></p>
            <p className="mt-1 text-sm opacity-90">Entrega e cartão de mensagem no pedido.</p>
            <AvisoSemCobranca d={d} className="mt-4 rounded-2xl p-3 text-sm" />
            <button type="button" aria-disabled={d.demo} className="mt-4 inline-flex min-h-14 w-full items-center justify-center rounded-full text-lg font-extrabold aria-disabled:cursor-not-allowed" style={{ background: "var(--t-accent)", color: "var(--t-on-accent)" }}>{rotuloFinalizar(d)}</button>
          </aside>
        </div>
      )}
    </main>
  );
}
