"use client";

import { useState, type ReactNode } from "react";
import { Check, Tag, Truck } from "lucide-react";
import { Foto, brl } from "../../kit";
import { useDemoCart } from "../../demo-cart";
import type { DadosLoja, ProdutoLoja } from "../../types";
import { AvisoSemCobranca, CaminhoPao, CarrinhoVazio, FAIXAS, NaoEncontrada, ORDENS, Quantidade, descontoPct, itensLimpos, rotuloFinalizar, useCompra, useLista, wrap, type Ordem } from "../../internas/comum";
import Contador from "./contador";

/** PROMO (internas) — categoria com barra lateral de filtros, cesta com "Você economiza", carrinho direto ao ponto. */

const TIT = { fontFamily: "var(--t-titulo)" } as const;

function Selo({ valor }: { valor: number }) {
  return (
    <span className="absolute top-2 left-2 flex size-14 -rotate-6 flex-col items-center justify-center rounded-full text-center leading-none font-bold" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)", ...TIT }}>
      <span className="text-xl">-{valor}%</span>
      <span className="text-[9px] tracking-wider uppercase">off</span>
    </span>
  );
}

function Cartao({ p }: { p: ProdutoLoja }) {
  const desc = descontoPct(p);
  return (
    <a href={p.href} className="group flex min-w-0 flex-col">
      <div className="relative overflow-hidden rounded-md border-2" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>
        <Foto src={p.fotos[0]} alt={p.nome} className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {desc ? <Selo valor={desc} /> : null}
      </div>
      <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-snug font-medium">{p.nome}</p>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
        {p.precoDe ? <s className="text-xs" style={{ color: "var(--t-muted)" }}>{brl(p.precoDe)}</s> : null}
        <span className="text-xl leading-tight font-bold tabular-nums" style={{ ...TIT, color: "var(--t-primary)" }}>{brl(p.preco)}</span>
      </div>
      <span className="mt-2 inline-flex min-h-11 items-center justify-center rounded text-sm font-bold tracking-wide uppercase" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>Adicionar</span>
    </a>
  );
}

function Chip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={ativo} onClick={onClick} className="inline-flex min-h-11 shrink-0 items-center rounded border-2 px-3 text-left text-sm font-semibold whitespace-nowrap" style={ativo ? { background: "var(--t-primary)", color: "var(--t-on-primary)", borderColor: "var(--t-primary)" } : { borderColor: "var(--t-line)" }}>{children}</button>
  );
}

export function Categoria({ d, slug }: { d: DadosLoja; slug?: string }) {
  const { cat, titulo, lista, ordem, setOrdem, faixa, setFaixa } = useLista(d, slug);
  const [soPromo, setSoPromo] = useState(false);
  const mostrar = soPromo ? lista.filter((p) => descontoPct(p)) : lista;
  return (
    <main className={`${wrap} py-6 sm:py-10`}>
      <CaminhoPao d={d} cat={cat ? { nome: cat.nome, href: cat.href } : undefined} />
      <div className="mt-3 flex items-end justify-between gap-4 border-b-4 pb-2" style={{ borderColor: "var(--t-primary)" }}>
        <h1 className="text-3xl leading-none font-bold uppercase sm:text-5xl" style={TIT}>{titulo}</h1>
        <p className="shrink-0 text-sm" style={{ color: "var(--t-muted)" }} aria-live="polite">{mostrar.length} {mostrar.length === 1 ? "oferta" : "ofertas"}</p>
      </div>
      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside aria-label="Filtros" className="min-w-0 lg:rounded-lg lg:border-2 lg:p-4" style={{ borderColor: "var(--t-line)" }}>
          <p className="hidden text-sm font-bold tracking-wide uppercase lg:block" style={TIT}>Em promoção</p>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:mt-2 lg:flex-col lg:overflow-visible lg:pb-0">
            <Chip ativo={soPromo} onClick={() => setSoPromo((v) => !v)}><Tag className="mr-1.5 size-4" aria-hidden="true" /> Só com desconto</Chip>
          </div>
          <p className="mt-4 hidden text-sm font-bold tracking-wide uppercase lg:block" style={TIT}>Faixa de preço</p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0" role="group" aria-label="Faixa de preço">
            {FAIXAS.map(([k, l]) => <Chip key={k} ativo={faixa === k} onClick={() => setFaixa(k)}>{l}</Chip>)}
          </div>
          <label className="mt-4 block text-sm font-bold tracking-wide uppercase">
            <span style={TIT}>Ordenar</span>
            <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} aria-label="Ordenar" className="mt-2 block min-h-11 w-full rounded border-2 px-3 text-sm font-normal normal-case" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)", color: "var(--t-fg)" }}>
              {ORDENS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
        </aside>
        <section className="min-w-0" aria-label="Cestas">
          {mostrar.length ? (
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-3 gap-y-6 sm:grid-cols-3 xl:grid-cols-4">
              {mostrar.map((p) => <Cartao key={p.slug} p={p} />)}
            </div>
          ) : (
            <p className="rounded-lg border-2 border-dashed p-10 text-center" style={{ borderColor: "var(--t-line)" }}>
              Nenhuma oferta com esses filtros.{" "}
              <button type="button" className="min-h-11 font-bold underline" onClick={() => { setFaixa(""); setSoPromo(false); }}>Limpar filtros</button>
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

export function Produto({ d, slug }: { d: DadosLoja; slug: string }) {
  const p = d.produtos.find((x) => x.slug === slug);
  const { comprar, ok } = useCompra(p);
  const [foto, setFoto] = useState(0);
  if (!p) return <NaoEncontrada d={d} />;
  const cat = d.categorias.find((c) => c.slug === p.categoria);
  const itens = itensLimpos(p);
  const pct = descontoPct(p);
  const economia = p.precoDe && p.precoDe > p.preco ? p.precoDe - p.preco : 0;
  const outras = d.produtos.filter((x) => x.slug !== p.slug).slice(0, 5);
  const fotos = p.fotos.length ? p.fotos : [""];
  return (
    <main className={`${wrap} py-6 pb-28 sm:py-10 lg:pb-10`}>
      <CaminhoPao d={d} p={p} cat={cat ? { nome: cat.nome, href: cat.href } : undefined} />
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="min-w-0">
          <div className="relative overflow-hidden rounded-lg border-2" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>
            <Foto src={fotos[foto] ?? fotos[0]} alt={p.nome} className="aspect-square w-full object-cover" />
            {pct ? <Selo valor={pct} /> : null}
          </div>
          {fotos.length > 1 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto" role="group" aria-label="Fotos da cesta">
              {fotos.map((f, i) => (
                <button key={f + i} type="button" aria-label={`Ver foto ${i + 1}`} aria-pressed={foto === i} onClick={() => setFoto(i)} className="size-16 shrink-0 overflow-hidden rounded border-2" style={{ borderColor: foto === i ? "var(--t-primary)" : "var(--t-line)" }}>
                  <Foto src={f} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="min-w-0">
          <h1 className="text-3xl leading-[1.05] font-bold uppercase sm:text-5xl" style={TIT}>{p.nome}</h1>
          {p.serve ? <p className="mt-2 text-sm" style={{ color: "var(--t-muted)" }}>{p.serve}</p> : null}
          <div className="mt-5 rounded-lg border-2 p-4 sm:p-5" style={{ borderColor: "var(--t-primary)", background: "var(--t-surface)" }}>
            {p.precoDe ? <p className="text-sm" style={{ color: "var(--t-muted)" }}>De <s>{brl(p.precoDe)}</s> por</p> : null}
            <p className="text-5xl leading-none font-bold tabular-nums" style={{ ...TIT, color: "var(--t-primary)" }}>{brl(p.preco)}</p>
            {economia ? (
              <p className="mt-3 inline-flex items-center gap-2 rounded px-3 py-1.5 text-sm font-bold uppercase" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>
                <Tag className="size-4" aria-hidden="true" /> Você economiza {brl(economia)}
              </p>
            ) : null}
          </div>
          {economia ? (
            <div className="mt-4 rounded-lg p-4" style={{ background: "var(--t-fg)", color: "var(--t-bg)" }}>
              <Contador />
            </div>
          ) : null}
          <button type="button" data-acao="comprar" onClick={comprar} className="mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded text-base font-bold tracking-wide uppercase" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>
            {ok ? <><Check className="size-5" aria-hidden="true" /> Adicionada</> : "Adicionar ao carrinho"}
          </button>
          <a href={`${d.base}/carrinho`} className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded border-2 text-sm font-bold tracking-wide uppercase" style={{ borderColor: "var(--t-line)" }}>Ver carrinho</a>
          <p className="mt-4 flex items-start gap-2 text-sm" style={{ color: "var(--t-muted)" }}><Truck className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> Entrega com dia e horário marcados no pedido. Cartão de mensagem incluso.</p>
          <p className="mt-6 leading-relaxed" style={{ color: "var(--t-muted)" }}>{p.descricao}</p>
          {itens.length ? (
            <section className="mt-6" aria-labelledby="inclui">
              <h2 id="inclui" className="text-lg font-bold uppercase" style={TIT}>O que vem na cesta</h2>
              <ul className="mt-2">
                {itens.map((i) => <li key={i} className="flex min-w-0 items-start gap-2 border-b py-2 text-sm" style={{ borderColor: "var(--t-line)" }}><Check className="mt-0.5 size-4 shrink-0" style={{ color: "var(--t-primary)" }} aria-hidden="true" /><span className="min-w-0">{i}</span></li>)}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
      {outras.length ? (
        <section className="mt-14" aria-labelledby="mais">
          <h2 id="mais" className="border-b-4 pb-2 text-2xl font-bold uppercase" style={{ ...TIT, borderColor: "var(--t-primary)" }}>Aproveite também</h2>
          <div className="mt-5 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
            {outras.map((x) => <Cartao key={x.slug} p={x} />)}
          </div>
        </section>
      ) : null}
      <div className="fixed inset-x-0 z-30 flex items-center gap-3 border-t-2 px-4 py-2 lg:hidden" style={{ bottom: "var(--demo-barra-baixo, 0px)", background: "var(--t-bg)", borderColor: "var(--t-primary)" }}>
        <p className="min-w-0 flex-1 text-2xl font-bold tabular-nums" style={{ ...TIT, color: "var(--t-primary)" }}>{brl(p.preco)}</p>
        <button type="button" onClick={comprar} className="min-h-11 rounded px-6 text-sm font-bold tracking-wide uppercase" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>{ok ? "Adicionada" : "Adicionar"}</button>
      </div>
    </main>
  );
}

export function Carrinho({ d }: { d: DadosLoja }) {
  const { itens, total } = useDemoCart();
  return (
    <main className={`${wrap} py-6 sm:py-10`}>
      <h1 className="border-b-4 pb-2 text-3xl font-bold uppercase sm:text-5xl" style={{ ...TIT, borderColor: "var(--t-primary)" }}>Meu carrinho</h1>
      {itens.length === 0 ? (
        <CarrinhoVazio d={d} className="mt-8 rounded-lg border-2 border-dashed p-10 text-center" botao="mt-5 inline-flex min-h-12 items-center rounded px-8 text-sm font-bold tracking-wide uppercase" />
      ) : (
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <ul className="min-w-0">
            {itens.map((i) => (
              <li key={i.slug} className="flex gap-3 border-b-2 py-4 sm:gap-5" style={{ borderColor: "var(--t-line)" }}>
                <Foto src={i.foto} alt={i.nome} className="size-24 shrink-0 rounded-md object-cover sm:size-28" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold uppercase" style={TIT}>{i.nome}</p>
                  <p className="mt-1 text-sm tabular-nums" style={{ color: "var(--t-muted)" }}>{brl(i.preco)} cada</p>
                  <Quantidade slug={i.slug} nome={i.nome} qtd={i.qtd} redondo={false} className="mt-2" />
                </div>
                <p className="shrink-0 text-lg font-bold tabular-nums" style={{ ...TIT, color: "var(--t-primary)" }}>{brl(i.preco * i.qtd)}</p>
              </li>
            ))}
          </ul>
          <aside className="h-fit min-w-0 rounded-lg border-2 p-5" style={{ borderColor: "var(--t-primary)", background: "var(--t-surface)" }}>
            <p className="text-sm font-bold tracking-wide uppercase">Total</p>
            <p className="mt-1 text-5xl leading-none font-bold tabular-nums" style={{ ...TIT, color: "var(--t-primary)" }}>{brl(total)}</p>
            <p className="mt-2 text-sm" style={{ color: "var(--t-muted)" }}>Entrega e cartão de mensagem definidos no pedido.</p>
            <AvisoSemCobranca d={d} className="mt-4 rounded p-3 text-sm" />
            <button type="button" aria-disabled={d.demo} className="mt-5 inline-flex min-h-14 w-full items-center justify-center rounded text-base font-bold tracking-wide uppercase aria-disabled:cursor-not-allowed" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>{rotuloFinalizar(d)}</button>
            <a href={`${d.base}/categoria`} className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded border-2 text-sm font-bold tracking-wide uppercase" style={{ borderColor: "var(--t-line)" }}>Continuar comprando</a>
          </aside>
        </div>
      )}
    </main>
  );
}
