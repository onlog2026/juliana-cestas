"use client";

import { useRef, useState } from "react";
import { Check } from "lucide-react";
import { CartIcon } from "../../cart-icon";
import { Foto, brl } from "../../kit";
import { useDemoCart } from "../../demo-cart";
import type { DadosLoja } from "../../types";
import { AvisoSemCobranca, CaminhoPao, CarrinhoVazio, FAIXAS, NaoEncontrada, ORDENS, Quantidade, descontoPct, itensLimpos, rotuloFinalizar, useCompra, useLista, type Ordem } from "../../internas/comum";
import { COL, COL_STYLE, Post } from "./post";

/** STORIES (internas) — categoria = feed; cesta = galeria que desliza + folha de compra fixa; carrinho = lista de app. */

const CHIP = "inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-semibold whitespace-nowrap";
const ROLA = { scrollbarWidth: "none" } as const;

export function Categoria({ d, slug }: { d: DadosLoja; slug?: string }) {
  const { cat, titulo, lista, ordem, setOrdem, faixa, setFaixa } = useLista(d, slug);
  const avatar = d.heroImagem;
  return (
    <main className={`${COL} pb-8`} style={COL_STYLE}>
      <div className="px-4 pt-4">
        <CaminhoPao d={d} cat={cat ? { nome: cat.nome, href: cat.href } : undefined} />
        <h1 className="mt-2 text-3xl leading-tight font-bold" style={{ fontFamily: "var(--t-titulo)" }}>{titulo}</h1>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto px-4 pb-1" style={ROLA} aria-label="Ocasiões">
        <a href={`${d.base}/categoria`} className={CHIP} style={{ borderColor: cat ? "var(--t-line)" : "var(--t-primary)", background: cat ? "transparent" : "var(--t-primary)", color: cat ? "var(--t-fg)" : "var(--t-on-primary)" }}>Todas</a>
        {d.categorias.map((c) => {
          const ativa = c.slug === slug;
          return <a key={c.slug} href={c.href} aria-current={ativa ? "page" : undefined} className={CHIP} style={{ borderColor: ativa ? "var(--t-primary)" : "var(--t-line)", background: ativa ? "var(--t-primary)" : "transparent", color: ativa ? "var(--t-on-primary)" : "var(--t-fg)" }}>{c.nome}</a>;
        })}
      </div>

      <div className="relative mt-2 flex items-center gap-2 overflow-x-auto px-4 pb-2" style={ROLA}>
        {FAIXAS.map(([k, l]) => (
          <button key={k} type="button" aria-pressed={faixa === k} onClick={() => setFaixa(k)} className={`${CHIP} text-xs`} style={{ borderColor: faixa === k ? "var(--t-fg)" : "var(--t-line)", fontWeight: faixa === k ? 700 : 500 }}>{l}</button>
        ))}
        <label className="ml-auto shrink-0">
          <span className="sr-only">Ordenar</span>
          <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} aria-label="Ordenar" className="min-h-11 rounded-full border bg-transparent px-3 text-xs font-semibold" style={{ borderColor: "var(--t-line)", color: "var(--t-fg)" }}>
            {ORDENS.map(([k, l]) => <option key={k} value={k} style={{ color: "#111" }}>{l}</option>)}
          </select>
        </label>
      </div>

      <p className="px-4 pb-2 text-xs" style={{ color: "var(--t-muted)" }} aria-live="polite">{lista.length} {lista.length === 1 ? "cesta" : "cestas"}</p>

      {lista.length ? (
        <div className="border-t" style={{ borderColor: "var(--t-line)" }}>
          {lista.map((p) => <Post key={p.slug} p={{ nome: p.nome, preco: p.preco, precoDe: p.precoDe, imagem: p.fotos[0] ?? "", serve: p.serve, href: p.href }} loja={d.loja} avatar={avatar} />)}
        </div>
      ) : (
        <p className="px-4 py-12 text-center" style={{ color: "var(--t-muted)" }}>Nenhuma cesta nessa faixa de preço. <button type="button" className="underline" onClick={() => setFaixa("")}>Ver todas</button></p>
      )}
    </main>
  );
}

export function Produto({ d, slug }: { d: DadosLoja; slug: string }) {
  const p = d.produtos.find((x) => x.slug === slug);
  const { comprar, ok } = useCompra(p);
  const trilho = useRef<HTMLDivElement | null>(null);
  const [n, setN] = useState(0);
  if (!p) return <NaoEncontrada d={d} />;
  const cat = d.categorias.find((c) => c.slug === p.categoria);
  const itens = itensLimpos(p);
  const fotos = p.fotos.length ? p.fotos : [""];
  const pct = descontoPct(p);
  const outras = d.produtos.filter((x) => x.slug !== p.slug).slice(0, 6);

  function ao_rolar() {
    const el = trilho.current;
    if (el && el.clientWidth) setN(Math.round(el.scrollLeft / el.clientWidth));
  }

  return (
    <main className={`${COL} pb-36`} style={COL_STYLE}>
      <div className="px-4 py-3"><CaminhoPao d={d} p={p} cat={cat ? { nome: cat.nome, href: cat.href } : undefined} /></div>

      <div className="relative border-y" style={{ borderColor: "var(--t-line)" }}>
        <div ref={trilho} onScroll={ao_rolar} className="flex snap-x snap-mandatory overflow-x-auto" style={ROLA} aria-label="Fotos da cesta" role="group">
          {fotos.map((f, i) => (
            <div key={i} className="aspect-square min-w-0 basis-full shrink-0 snap-center">
              <Foto src={f} alt={i === 0 ? p.nome : `${p.nome}, foto ${i + 1}`} className="size-full object-cover" />
            </div>
          ))}
        </div>
        {fotos.length > 1 ? (
          <div className="absolute inset-x-0 bottom-3 flex justify-center" aria-hidden="true">
            <span className="flex gap-1.5 rounded-full px-2.5 py-1.5" style={{ background: "var(--t-bg)" }}>
              {fotos.map((_, i) => <span key={i} className="size-1.5 rounded-full" style={{ background: i === n ? "var(--t-primary)" : "var(--t-line)" }} />)}
            </span>
          </div>
        ) : null}
        {pct ? <span className="absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-bold" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>-{pct}%</span> : null}
      </div>

      <div className="px-4 pt-5">
        <h1 className="text-3xl leading-tight font-bold" style={{ fontFamily: "var(--t-titulo)" }}>{p.nome}</h1>
        <p className="mt-2 text-2xl font-bold tabular-nums">
          {p.precoDe ? <s className="mr-2 text-base font-normal" style={{ color: "var(--t-muted)" }}>{brl(p.precoDe)}</s> : null}
          {brl(p.preco)}
        </p>
        {p.serve ? <p className="mt-1 text-sm" style={{ color: "var(--t-muted)" }}>{p.serve}</p> : null}
        <p className="mt-4 leading-relaxed" style={{ color: "var(--t-muted)" }}>{p.descricao}</p>

        {itens.length ? (
          <section className="mt-6" aria-labelledby="dentro">
            <h2 id="dentro" className="text-sm font-bold">O que vem na cesta</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {itens.map((i) => <li key={i} className="max-w-full rounded-full border px-3 py-1.5 text-sm" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>{i}</li>)}
            </ul>
          </section>
        ) : null}
        <p className="mt-6 rounded-2xl p-4 text-sm" style={{ background: "var(--t-surface)", color: "var(--t-muted)" }}>Dia e horário de entrega escolhidos no pedido. Cartão de mensagem incluso.</p>
      </div>

      {outras.length ? (
        <section className="mt-8" aria-labelledby="mais">
          <h2 id="mais" className="px-4 text-lg font-bold" style={{ fontFamily: "var(--t-titulo)" }}>Veja também</h2>
          <div className="mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-2" style={ROLA}>
            {outras.map((x) => (
              <a key={x.slug} href={x.href} className="group block w-40 shrink-0 snap-start">
                <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--t-line)" }}>
                  <Foto src={x.fotos[0] ?? ""} alt={x.nome} className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-[1.05] motion-reduce:transition-none" />
                </div>
                <p className="mt-2 line-clamp-2 text-sm font-semibold">{x.nome}</p>
                <p className="text-sm tabular-nums" style={{ color: "var(--t-muted)" }}>{brl(x.preco)}</p>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {/* Folha de compra: fica no lugar da barra de app e acompanha a rolagem. */}
      <div data-stories-sheet className="fixed inset-x-0 z-50 mx-auto flex w-full max-w-[560px] items-center gap-3 rounded-t-3xl border-t px-4 pt-3" style={{ bottom: "var(--demo-barra-baixo, 0px)", paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))", background: "var(--t-surface)", borderColor: "var(--t-line)" }}>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs" style={{ color: "var(--t-muted)" }}>{p.nome}</p>
          <p className="text-xl font-bold tabular-nums">{brl(p.preco)}</p>
        </div>
        <button type="button" data-acao="comprar" onClick={comprar} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 font-semibold" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>
          {ok ? <><Check className="size-4" aria-hidden="true" /> Adicionada</> : "Adicionar"}
        </button>
        <CartIcon base={d.base} icone="sacola" className="size-6" />
      </div>
    </main>
  );
}

export function Carrinho({ d }: { d: DadosLoja }) {
  const { itens, total } = useDemoCart();
  return (
    <main className={`${COL} px-4 pt-5 pb-8`} style={COL_STYLE}>
      <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--t-titulo)" }}>Carrinho</h1>
      {itens.length === 0 ? (
        <CarrinhoVazio d={d} className="mt-6 rounded-3xl border border-dashed p-10 text-center" botao="mt-5 inline-flex min-h-12 items-center rounded-full px-7 font-semibold" />
      ) : (
        <>
          <ul className="mt-4">
            {itens.map((i) => (
              <li key={i.slug} className="flex min-w-0 gap-3 border-b py-4" style={{ borderColor: "var(--t-line)" }}>
                <Foto src={i.foto} alt="" className="size-20 shrink-0 rounded-2xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="line-clamp-2 min-w-0 font-semibold">{i.nome}</p>
                    <p className="shrink-0 font-bold tabular-nums">{brl(i.preco * i.qtd)}</p>
                  </div>
                  <p className="text-xs tabular-nums" style={{ color: "var(--t-muted)" }}>{brl(i.preco)} cada</p>
                  <Quantidade slug={i.slug} nome={i.nome} qtd={i.qtd} className="mt-1" />
                </div>
              </li>
            ))}
          </ul>
          <section className="mt-6 rounded-3xl p-5" style={{ background: "var(--t-surface)" }} aria-label="Resumo do pedido">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-semibold">Total</p>
              <p className="text-3xl font-bold tabular-nums" style={{ fontFamily: "var(--t-titulo)" }}>{brl(total)}</p>
            </div>
            <p className="mt-1 text-xs" style={{ color: "var(--t-muted)" }}>Entrega e cartão de mensagem no pedido.</p>
            <AvisoSemCobranca d={d} className="mt-4 rounded-2xl p-3 text-sm" />
            <button type="button" aria-disabled={d.demo} className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-full font-semibold aria-disabled:cursor-not-allowed" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>{rotuloFinalizar(d)}</button>
          </section>
        </>
      )}
    </main>
  );
}
