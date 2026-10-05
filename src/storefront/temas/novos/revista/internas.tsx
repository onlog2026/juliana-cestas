"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Foto, brl } from "../../kit";
import { useDemoCart } from "../../demo-cart";
import type { DadosLoja, ProdutoLoja } from "../../types";
import { AvisoSemCobranca, CaminhoPao, CarrinhoVazio, FAIXAS, NaoEncontrada, ORDENS, Quantidade, descontoPct, itensLimpos, rotuloFinalizar, useCompra, useLista, wrap, type Ordem } from "../../internas/comum";
import { Kicker, Regua } from "./pecas";

/* REVISTA — páginas internas: lista editorial (foto, título, resumo, preço), cesta em formato de artigo e carrinho como "pedido" tipográfico. */

const CAPS = "text-[12px] font-bold tracking-[0.16em] uppercase";

function Linha({ p, categoria }: { p: ProdutoLoja; categoria?: string }) {
  const { comprar, ok } = useCompra(p);
  const itens = itensLimpos(p);
  return (
    <li className="grid grid-cols-[104px_minmax(0,1fr)] gap-x-4 gap-y-3 border-b py-6 sm:grid-cols-[220px_minmax(0,1fr)_auto] sm:gap-x-8" style={{ borderColor: "var(--t-line)" }}>
      <a href={p.href} className="group block min-w-0" aria-label={p.nome} tabIndex={-1}>
        <div className="overflow-hidden">
          <Foto src={p.fotos[0]} alt={p.nome} className="aspect-[4/5] w-full object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.04] sm:aspect-[4/3]" />
        </div>
      </a>
      <div className="min-w-0">
        {categoria ? <Kicker>{categoria}</Kicker> : null}
        <h2 className="mt-1 text-xl leading-snug sm:text-3xl" style={{ fontFamily: "var(--t-titulo)" }}>
          <a href={p.href} className="underline-offset-4 hover:underline [overflow-wrap:anywhere]">{p.nome}</a>
        </h2>
        <p className="mt-2 line-clamp-2 hidden leading-relaxed sm:block" style={{ color: "var(--t-muted)" }}>{p.descricao}</p>
        <p className="mt-2 text-xs" style={{ color: "var(--t-muted)", fontFamily: "var(--t-detalhe)" }}>
          {[p.serve, itens.length ? `${itens.length} ${itens.length === 1 ? "item" : "itens"}` : ""].filter(Boolean).join(" · ")}
        </p>
      </div>
      <div className="col-span-2 flex items-center justify-between gap-4 sm:col-span-1 sm:flex-col sm:items-end sm:justify-between">
        <p className="text-right">
          <span className="block text-2xl font-bold tabular-nums" style={{ fontFamily: "var(--t-titulo)" }}>{brl(p.preco)}</span>
          {p.precoDe ? <s className="text-xs tabular-nums" style={{ color: "var(--t-muted)" }}>{brl(p.precoDe)}</s> : null}
        </p>
        <button type="button" onClick={comprar} className={`inline-flex min-h-11 items-center justify-center gap-2 border-2 px-5 ${CAPS}`} style={{ borderColor: "var(--t-fg)", fontFamily: "var(--t-detalhe)" }}>
          {ok ? <><Check className="size-4" aria-hidden="true" /> Adicionada</> : "Adicionar"}
        </button>
      </div>
    </li>
  );
}

export function Categoria({ d, slug }: { d: DadosLoja; slug?: string }) {
  const { cat, titulo, lista, ordem, setOrdem, faixa, setFaixa } = useLista(d, slug);
  return (
    <main className={`${wrap} py-6 sm:py-10`}>
      <CaminhoPao d={d} cat={cat ? { nome: cat.nome, href: cat.href } : undefined} />
      <header className="mt-4">
        <Kicker>Seção</Kicker>
        <h1 className="mt-1 text-[clamp(2.2rem,7vw,4.5rem)] leading-none [overflow-wrap:anywhere]" style={{ fontFamily: "var(--t-titulo)" }}>{titulo}</h1>
        <Regua className="mt-5" />
      </header>

      <div className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-0 border-b pb-1" style={{ borderColor: "var(--t-line)" }}>
        <a href={`${d.base}/categoria`} className={`inline-flex min-h-11 items-center px-2 ${CAPS} ${slug ? "" : "underline decoration-2 underline-offset-8"}`} style={{ fontFamily: "var(--t-detalhe)" }}>Todas</a>
        {d.categorias.map((c) => (
          <a key={c.slug} href={c.href} className={`inline-flex min-h-11 items-center px-2 ${CAPS} ${c.slug === slug ? "underline decoration-2 underline-offset-8" : ""}`} style={{ fontFamily: "var(--t-detalhe)", color: c.slug === slug ? "var(--t-fg)" : "var(--t-muted)" }}>{c.nome}</a>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-1">
        <span className="px-2 text-xs" style={{ color: "var(--t-muted)", fontFamily: "var(--t-detalhe)" }}>Preço:</span>
        {FAIXAS.map(([k, l]) => (
          <button key={k} type="button" aria-pressed={faixa === k} onClick={() => setFaixa(k)} className={`min-h-11 px-2 text-sm ${faixa === k ? "font-bold underline decoration-2 underline-offset-8" : ""}`} style={{ color: faixa === k ? "var(--t-fg)" : "var(--t-muted)" }}>{l}</button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-sm">
          <span style={{ color: "var(--t-muted)" }}>Ordenar</span>
          <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} className="h-11 border px-2" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)", color: "var(--t-fg)" }}>
            {ORDENS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
      </div>
      <p className="mt-3 text-sm" style={{ color: "var(--t-muted)" }} aria-live="polite">{lista.length} {lista.length === 1 ? "cesta nesta seção" : "cestas nesta seção"}</p>

      {lista.length ? (
        <ul className="mt-2 border-t" style={{ borderColor: "var(--t-line)" }}>
          {lista.map((p) => <Linha key={p.slug} p={p} categoria={d.categorias.find((c) => c.slug === p.categoria)?.nome} />)}
        </ul>
      ) : (
        <p className="mt-8 border-y py-8 text-center" style={{ borderColor: "var(--t-line)" }}>Nenhuma cesta nessa faixa. <button type="button" className="min-h-11 underline" onClick={() => setFaixa("")}>Limpar filtro</button></p>
      )}
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
  const off = descontoPct(p);
  return (
    <main className={`${wrap} py-6 sm:py-10`}>
      <CaminhoPao d={d} p={p} cat={cat ? { nome: cat.nome, href: cat.href } : undefined} />
      <article className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-8 pb-16 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14 lg:pb-0">
        <div className="min-w-0">
          <header>
            <Kicker>{cat?.nome ?? "Cesta"}{p.serve ? ` · ${p.serve}` : ""}</Kicker>
            <h1 className="mt-2 text-[clamp(2.2rem,6.5vw,4.6rem)] leading-[1.02] tracking-tight [overflow-wrap:anywhere]" style={{ fontFamily: "var(--t-titulo)" }}>{p.nome}</h1>
            <p className="mt-4 max-w-3xl text-xl leading-relaxed italic sm:text-2xl" style={{ color: "var(--t-muted)" }}>{p.descricao}</p>
          </header>

          <figure className="mt-6">
            <div className="overflow-hidden">
              <Foto src={p.fotos[foto] ?? p.fotos[0]} alt={p.nome} className="aspect-[4/3] w-full object-cover sm:aspect-[16/10]" />
            </div>
            <figcaption className="mt-2 flex flex-wrap items-center gap-x-3 border-b pb-2 text-xs" style={{ borderColor: "var(--t-line)", color: "var(--t-muted)", fontFamily: "var(--t-detalhe)" }}>
              <span>Foto {Math.min(foto, p.fotos.length - 1) + 1} de {p.fotos.length}</span>
              {p.fotos.length > 1 ? (
                <span className="flex flex-wrap gap-x-1" role="group" aria-label="Fotos da cesta">
                  {p.fotos.map((f, i) => (
                    <button key={f + i} type="button" onClick={() => setFoto(i)} aria-label={`Ver foto ${i + 1}`} aria-pressed={i === foto} className={`min-h-11 min-w-11 tabular-nums ${i === foto ? "font-bold underline decoration-2 underline-offset-4" : ""}`} style={{ color: i === foto ? "var(--t-fg)" : "var(--t-muted)" }}>{i + 1}</button>
                  ))}
                </span>
              ) : null}
            </figcaption>
          </figure>

          <div className="mt-8 max-w-4xl text-[17px] leading-[1.75] sm:columns-2 sm:gap-10">
            <p className="first-letter:float-left first-letter:mr-2 first-letter:text-[4.2rem] first-letter:leading-[0.8] first-letter:font-bold first-letter:[font-family:var(--t-titulo)]">
              Esta cesta foi montada para quem quer presentear com atenção aos detalhes. Cada item foi escolhido para combinar com os demais, e o conjunto chega embalado para ser aberto na hora.
            </p>
            <p className="mt-4">A entrega acontece na data e no horário que você marcar no pedido, e o cartão é escrito do jeito que você pedir. Para ver tudo o que vem na cesta, consulte a lista ao lado.</p>
            <p className="mt-4">Quer comparar com outras opções? Volte à seção e veja as cestas parecidas, lado a lado.</p>
          </div>
        </div>

        <aside className="h-fit min-w-0 border-2 p-5 lg:sticky lg:top-6" style={{ borderColor: "var(--t-fg)", background: "var(--t-surface)" }} aria-label="Compra">
          {itens.length ? (
            <section aria-labelledby="itens-cesta">
              <h2 id="itens-cesta" className="border-b-[3px] pb-2 text-[11px] font-bold tracking-[0.22em] uppercase" style={{ fontFamily: "var(--t-detalhe)", borderColor: "var(--t-fg)" }}>O que vem na cesta</h2>
              <ol className="mt-1">
                {itens.map((i, n) => (
                  <li key={i + n} className="flex gap-3 border-b py-2 text-sm" style={{ borderColor: "var(--t-line)" }}>
                    <span className="w-5 shrink-0 tabular-nums" style={{ fontFamily: "var(--t-titulo)", color: "var(--t-accent)" }}>{n + 1}</span>
                    <span className="min-w-0">{i}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
          <div className="mt-5">
            {off ? <p className="text-sm"><s className="tabular-nums" style={{ color: "var(--t-muted)" }}>{brl(p.precoDe ?? 0)}</s> <b style={{ color: "var(--t-accent)" }}>{off}% de desconto</b></p> : null}
            <p className="text-4xl tabular-nums" style={{ fontFamily: "var(--t-titulo)" }}>{brl(p.preco)}</p>
            <p className="mt-1 text-xs" style={{ color: "var(--t-muted)" }}>Entrega com data e horário marcados; o frete é calculado no pedido.</p>
          </div>
          <button type="button" data-acao="comprar" onClick={comprar} className={`mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 px-4 ${CAPS}`} style={{ background: "var(--t-primary)", color: "var(--t-on-primary)", fontFamily: "var(--t-detalhe)" }}>
            {ok ? <><Check className="size-4" aria-hidden="true" /> Adicionada ao carrinho</> : "Adicionar ao carrinho"}
          </button>
          <a href={`${d.base}/carrinho`} className={`mt-2 inline-flex min-h-11 w-full items-center justify-center border-2 px-4 ${CAPS}`} style={{ borderColor: "var(--t-fg)", fontFamily: "var(--t-detalhe)" }}>Ver carrinho</a>
        </aside>
      </article>

      <div className="fixed inset-x-0 z-30 flex items-center gap-3 border-t-2 px-4 py-2 lg:hidden" style={{ bottom: "var(--demo-barra-baixo, 0px)", borderColor: "var(--t-fg)", background: "var(--t-bg)" }}>
        <p className="min-w-0 flex-1 text-2xl tabular-nums" style={{ fontFamily: "var(--t-titulo)" }}>{brl(p.preco)}</p>
        <button type="button" onClick={comprar} className={`min-h-11 px-5 ${CAPS}`} style={{ background: "var(--t-primary)", color: "var(--t-on-primary)", fontFamily: "var(--t-detalhe)" }}>{ok ? "Adicionada" : "Adicionar"}</button>
      </div>
    </main>
  );
}

export function Carrinho({ d }: { d: DadosLoja }) {
  const { itens, total, quantidade } = useDemoCart();
  return (
    <main className={`${wrap} py-6 sm:py-10`}>
      <header>
        <Kicker>Seu pedido</Kicker>
        <h1 className="mt-1 text-[clamp(2.2rem,7vw,4.5rem)] leading-none" style={{ fontFamily: "var(--t-titulo)" }}>Carrinho</h1>
        <Regua className="mt-5" />
      </header>
      {itens.length === 0 ? (
        <CarrinhoVazio d={d} className="mt-8 border-y py-12 text-center" botao={`mt-4 inline-flex min-h-12 items-center px-6 ${CAPS}`} />
      ) : (
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14">
          <ul className="min-w-0">
            {itens.map((i, n) => (
              <li key={i.slug} className="grid grid-cols-[28px_72px_minmax(0,1fr)] items-start gap-3 border-b py-5 sm:grid-cols-[28px_96px_minmax(0,1fr)_auto]" style={{ borderColor: "var(--t-line)" }}>
                <span className="text-2xl tabular-nums" style={{ fontFamily: "var(--t-titulo)", color: "var(--t-accent)" }}>{n + 1}</span>
                <Foto src={i.foto} alt={i.nome} className="aspect-square w-full object-cover" />
                <div className="min-w-0">
                  <p className="line-clamp-2 text-lg leading-snug" style={{ fontFamily: "var(--t-titulo)" }}>{i.nome}</p>
                  <p className="mt-1 text-sm tabular-nums" style={{ color: "var(--t-muted)" }}>{brl(i.preco)} cada</p>
                </div>
                <div className="col-span-3 flex min-w-0 flex-col gap-1 sm:col-span-1 sm:items-end">
                  <Quantidade slug={i.slug} nome={i.nome} qtd={i.qtd} redondo={false} />
                  <p className="text-xl font-bold tabular-nums sm:text-right" style={{ fontFamily: "var(--t-titulo)" }}>{brl(i.preco * i.qtd)}</p>
                </div>
              </li>
            ))}
          </ul>
          <aside className="h-fit min-w-0 border-2 p-5 lg:sticky lg:top-6" style={{ borderColor: "var(--t-fg)", background: "var(--t-surface)" }}>
            <h2 className="border-b-[3px] pb-2 text-[11px] font-bold tracking-[0.22em] uppercase" style={{ fontFamily: "var(--t-detalhe)", borderColor: "var(--t-fg)" }}>Resumo</h2>
            <p className="mt-3 flex justify-between text-sm"><span>Cestas ({quantidade})</span><span className="tabular-nums">{brl(total)}</span></p>
            <p className="mt-1 flex justify-between text-sm" style={{ color: "var(--t-muted)" }}><span>Entrega</span><span>calculada no pedido</span></p>
            <p className="mt-3 flex items-baseline justify-between border-t-2 pt-3 text-2xl" style={{ borderColor: "var(--t-fg)", fontFamily: "var(--t-titulo)" }}><span>Total</span><span className="tabular-nums">{brl(total)}</span></p>
            <AvisoSemCobranca d={d} className="mt-3 border p-3 text-sm" />
            <button type="button" aria-disabled={d.demo} className={`mt-4 inline-flex min-h-12 w-full items-center justify-center px-4 text-center ${CAPS} aria-disabled:cursor-not-allowed`} style={{ background: "var(--t-primary)", color: "var(--t-on-primary)", fontFamily: "var(--t-detalhe)" }}>{rotuloFinalizar(d)}</button>
            <a href={`${d.base}/categoria`} className={`mt-2 inline-flex min-h-11 w-full items-center justify-center border-2 px-4 ${CAPS}`} style={{ borderColor: "var(--t-fg)", fontFamily: "var(--t-detalhe)" }}>Continuar escolhendo</a>
          </aside>
        </div>
      )}
    </main>
  );
}
