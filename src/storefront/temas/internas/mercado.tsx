"use client";

import { useState, type ReactNode } from "react";
import { Check, ShieldCheck, ShoppingCart, Truck } from "lucide-react";
import { Foto, brl } from "../kit";
import { useDemoCart } from "../demo-cart";
import type { EncaixesCategoria, EncaixesProduto } from "../encaixes";
import type { DadosLoja, ProdutoLoja } from "../types";
import { AvisoSemCobranca, CaminhoPao, CarrinhoVazio, FAIXAS, NaoEncontrada, ORDENS, Quantidade, descontoPct, itensLimpos, rotuloFinalizar, useCompra, useLista, wrap, type Ordem } from "./comum";

/** MERCADO — denso, cartões compactos com botão "Adicionar", barra de filtros, página da cesta em 3 colunas com caixa de compra. */

/**
 * Cartão para a LOJA AO VIVO (blocos e páginas reais): mesmo visual, mas o botão é um link "Ver cesta"
 * (a compra real acontece na página da cesta; o botão "Adicionar" do cartão de demonstração usa o carrinho de mentira).
 */
export function Cartao({ p }: { p: ProdutoLoja }) {
  const off = descontoPct(p);
  return (
    <div className="relative flex min-w-0 flex-col rounded-lg border bg-white p-2.5" style={{ borderColor: "var(--t-line)" }}>
      {off ? <span className="absolute top-3 left-3 z-10 rounded px-1.5 py-0.5 text-xs font-bold" style={{ background: "var(--t-accent)", color: "var(--t-on-accent)" }}>-{off}%</span> : null}
      <a href={p.href} className="block">
        <Foto src={p.fotos[0]} alt={p.nome} className="aspect-square w-full rounded-md object-cover" />
        <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-[13px] leading-snug font-medium">{p.nome}</p>
      </a>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-lg font-bold">{brl(p.preco)}</span>
        {p.precoDe ? <s className="text-xs" style={{ color: "var(--t-muted)" }}>{brl(p.precoDe)}</s> : null}
      </div>
      <a href={p.href} className="mt-2 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md text-sm font-bold" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>
        <ShoppingCart className="size-4" aria-hidden="true" /> Ver cesta
      </a>
    </div>
  );
}

function CartaoCompra({ p }: { p: ProdutoLoja }) {
  const { comprar, ok } = useCompra(p);
  const off = descontoPct(p);
  return (
    <div className="relative flex min-w-0 flex-col rounded-lg border bg-white p-2.5" style={{ borderColor: "var(--t-line)" }}>
      {off ? <span className="absolute top-3 left-3 z-10 rounded px-1.5 py-0.5 text-xs font-bold" style={{ background: "var(--t-accent)", color: "var(--t-on-accent)" }}>-{off}%</span> : null}
      <a href={p.href} className="block">
        <Foto src={p.fotos[0]} alt={p.nome} className="aspect-square w-full rounded-md object-cover" />
        <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-[13px] leading-snug font-medium">{p.nome}</p>
      </a>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-lg font-bold">{brl(p.preco)}</span>
        {p.precoDe ? <s className="text-xs" style={{ color: "var(--t-muted)" }}>{brl(p.precoDe)}</s> : null}
      </div>
      <button type="button" onClick={comprar} className="mt-2 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md text-sm font-bold" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>
        {ok ? <><Check className="size-4" /> Adicionada</> : <><ShoppingCart className="size-4" /> Adicionar</>}
      </button>
    </div>
  );
}

export function CategoriaMercado({ d, slug, encaixes }: { d: DadosLoja; slug?: string; encaixes?: EncaixesCategoria }) {
  const { cat, titulo, lista, ordem, setOrdem, faixa, setFaixa } = useLista(d, slug);
  // Com encaixes (loja ao vivo) o cartão não tem o "Adicionar" do carrinho de demonstração.
  const Card = encaixes ? Cartao : CartaoCompra;
  return (
    <main className={`${wrap} py-5 sm:py-8`}>
      <CaminhoPao d={d} cat={cat ? { nome: cat.nome, href: cat.href } : undefined} />
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold sm:text-3xl" style={{ fontFamily: "var(--t-titulo)" }}>{titulo}</h1>
        <p className="text-sm" style={{ color: "var(--t-muted)" }} aria-live="polite">{lista.length} {lista.length === 1 ? "resultado" : "resultados"}</p>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Categorias">
        <a href={`${d.base}/categoria`} className="flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium" style={{ background: slug ? "#fff" : "var(--t-primary)", color: slug ? "var(--t-fg)" : "var(--t-on-primary)", borderColor: "var(--t-line)" }}>Todas</a>
        {d.categorias.map((c) => <a key={c.slug} href={c.href} className="flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium whitespace-nowrap" style={{ background: c.slug === slug ? "var(--t-primary)" : "#fff", color: c.slug === slug ? "var(--t-on-primary)" : "var(--t-fg)", borderColor: "var(--t-line)" }}>{c.nome}</a>)}
      </div>
      {encaixes?.filtrosExtras ? <div className="mt-3">{encaixes.filtrosExtras}</div> : null}
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border bg-white p-2" style={{ borderColor: "var(--t-line)" }}>
        <span className="px-2 text-sm font-semibold">Preço:</span>
        {FAIXAS.map(([k, l]) => (
          <button key={k} type="button" aria-pressed={faixa === k} onClick={() => setFaixa(k)} className="min-h-11 rounded-md px-3 text-sm" style={{ background: faixa === k ? "var(--t-fg)" : "transparent", color: faixa === k ? "#fff" : "var(--t-fg)" }}>{l}</button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-sm">Ordenar
          <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} className="h-11 rounded-md border bg-white px-2" style={{ borderColor: "var(--t-line)" }}>
            {ORDENS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
      </div>
      {lista.length ? (
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
          {lista.map((p) => <Card key={p.slug} p={p} />)}
        </div>
      ) : (
        <p className="mt-6 rounded-lg border border-dashed bg-white p-8 text-center" style={{ borderColor: "var(--t-line)" }}>Nenhuma cesta nessa faixa. <button type="button" className="underline" onClick={() => setFaixa("")}>Limpar filtro</button></p>
      )}
      {encaixes?.rodape ? <div className="mt-10 grid gap-8">{encaixes.rodape}</div> : null}
    </main>
  );
}

function SecaoEncaixe({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mt-8 min-w-0 rounded-lg border bg-white p-4" style={{ borderColor: "var(--t-line)" }} aria-label={titulo}>
      <h2 className="mb-3 text-xl font-bold" style={{ fontFamily: "var(--t-titulo)" }}>{titulo}</h2>
      {children}
    </section>
  );
}

export function ProdutoMercado({ d, slug, encaixes }: { d: DadosLoja; slug: string; encaixes?: EncaixesProduto }) {
  const p = d.produtos.find((x) => x.slug === slug);
  const { comprar, ok } = useCompra(p);
  const [foto, setFoto] = useState(0);
  if (!p) return <NaoEncontrada d={d} />;
  const cat = d.categorias.find((c) => c.slug === p.categoria);
  const itens = itensLimpos(p);
  const off = descontoPct(p);
  return (
    <main className={`${wrap} py-5 sm:py-8`}>
      <CaminhoPao d={d} p={p} cat={cat ? { nome: cat.nome, href: cat.href } : undefined} />
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_320px]">
        <div className="grid min-w-0 gap-2 sm:grid-cols-[64px_minmax(0,1fr)]">
          <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:flex-col" role="group" aria-label="Fotos da cesta">
            {p.fotos.map((f, i) => (
              <button key={f} type="button" onClick={() => setFoto(i)} aria-label={`Foto ${i + 1}`} aria-pressed={i === foto} className="size-16 shrink-0 overflow-hidden rounded-md border-2 bg-white" style={{ borderColor: i === foto ? "var(--t-primary)" : "var(--t-line)" }}>
                <Foto src={f} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
          <div className="order-1 min-w-0 overflow-hidden rounded-lg border bg-white sm:order-2" style={{ borderColor: "var(--t-line)" }}>
            <Foto src={p.fotos[foto]} alt={p.nome} className="aspect-square w-full object-cover" />
          </div>
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl leading-tight font-bold sm:text-3xl" style={{ fontFamily: "var(--t-titulo)" }}>{p.nome}</h1>
          {p.serve ? <p className="mt-1 text-sm" style={{ color: "var(--t-muted)" }}>{p.serve}</p> : null}
          <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--t-muted)" }}>{p.descricao}</p>
          {itens.length ? (
            <table className="mt-5 w-full text-sm">
              <caption className="pb-2 text-left font-bold">O que vem na cesta</caption>
              <tbody>
                {itens.map((i, n) => <tr key={i} style={{ background: n % 2 ? "transparent" : "color-mix(in srgb, var(--t-fg) 5%, transparent)" }}><td className="w-10 px-2 py-2 tabular-nums" style={{ color: "var(--t-muted)" }}>{n + 1}</td><td className="px-2 py-2">{i}</td></tr>)}
              </tbody>
            </table>
          ) : null}
        </div>
        <aside className="h-fit min-w-0 rounded-lg border bg-white p-4 lg:sticky lg:top-24" style={{ borderColor: "var(--t-line)" }}>
          {off ? <p className="text-sm"><s style={{ color: "var(--t-muted)" }}>{brl(p.precoDe ?? 0)}</s> <b style={{ color: "var(--t-accent)" }}>{off}% OFF</b></p> : null}
          <p className="text-3xl font-bold">{brl(p.preco)}</p>
          {encaixes?.compra ? null : <p className="text-sm" style={{ color: "var(--t-muted)" }}>em até 3x de {brl(p.preco / 3)}</p>}
          {encaixes ? (
            encaixes.entrega ? <div className="mt-4 flex items-start gap-2 text-sm"><Truck className="mt-0.5 size-4 shrink-0" style={{ color: "var(--t-primary)" }} />{encaixes.entrega}</div> : null
          ) : (
            <p className="mt-4 flex items-start gap-2 text-sm"><Truck className="mt-0.5 size-4 shrink-0" style={{ color: "var(--t-primary)" }} /> Entrega com data e horário marcados; o frete é calculado no pedido.</p>
          )}
          {encaixes?.compra ? (
            <div id="compra" className="mt-4 min-w-0 scroll-mt-24">{encaixes.compra}</div>
          ) : (
            <>
              <button type="button" onClick={comprar} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md font-bold" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>
                {ok ? <><Check className="size-5" /> Adicionada</> : "Adicionar ao carrinho"}
              </button>
              <a href={`${d.base}/carrinho`} className="mt-2 flex min-h-11 w-full items-center justify-center rounded-md border font-semibold" style={{ borderColor: "var(--t-line)" }}>Ver carrinho</a>
              <p className="mt-4 flex items-center gap-2 text-xs" style={{ color: "var(--t-muted)" }}><ShieldCheck className="size-4" /> Compra segura · PIX e cartão</p>
            </>
          )}
        </aside>
      </div>
      {encaixes?.extras ? <SecaoEncaixe titulo="Embalagem e cartãozinho">{encaixes.extras}</SecaoEncaixe> : null}
      {encaixes?.avaliacoes ? <section className="mt-8 min-w-0">{encaixes.avaliacoes}</section> : null}
      {encaixes?.quemComprou ? <section className="mt-8 min-w-0">{encaixes.quemComprou}</section> : null}
      {encaixes?.vistos ? <section className="mt-8 min-w-0">{encaixes.vistos}</section> : null}
      <section className="mt-8" aria-labelledby="outras">
        <h2 id="outras" className="text-xl font-bold" style={{ fontFamily: "var(--t-titulo)" }}>{encaixes ? "Outras cestas" : "Quem viu também levou"}</h2>
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2.5 sm:grid-cols-4 lg:grid-cols-5">
          {d.produtos.filter((x) => x.slug !== p.slug).slice(0, 5).map((x) => (encaixes ? <Cartao key={x.slug} p={x} /> : <CartaoCompra key={x.slug} p={x} />))}
        </div>
      </section>
      <div className="fixed inset-x-0 z-30 flex items-center gap-3 border-t bg-white px-4 py-2 lg:hidden" style={{ bottom: "var(--demo-barra-baixo, 0px)", borderColor: "var(--t-line)" }}>
        <p className="min-w-0 flex-1 text-lg font-bold">{brl(p.preco)}</p>
        {encaixes?.compra ? (
          <a href="#compra" className="inline-flex min-h-11 items-center rounded-md px-6 font-bold" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>Comprar</a>
        ) : (
          <button type="button" onClick={comprar} className="min-h-11 rounded-md px-6 font-bold" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>{ok ? "Adicionada" : "Adicionar"}</button>
        )}
      </div>
    </main>
  );
}

export function CarrinhoMercado({ d, conteudo }: { d: DadosLoja; conteudo?: ReactNode }) {
  const { itens, total, quantidade } = useDemoCart();
  return (
    <main className={`${wrap} py-5 sm:py-8`}>
      <h1 className="text-2xl font-bold sm:text-3xl" style={{ fontFamily: "var(--t-titulo)" }}>Carrinho{conteudo ? null : <> <span className="text-base font-normal" style={{ color: "var(--t-muted)" }}>({quantidade} {quantidade === 1 ? "item" : "itens"})</span></>}</h1>
      {conteudo ? <div className="mt-4">{conteudo}</div> : itens.length === 0 ? <CarrinhoVazio d={d} className="mt-5 rounded-lg border bg-white p-10 text-center" botao="mt-4 inline-flex min-h-12 items-center rounded-md px-6 font-bold" /> : (
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 overflow-hidden rounded-lg border bg-white" style={{ borderColor: "var(--t-line)" }}>
            <div className="hidden grid-cols-[minmax(0,1fr)_150px_110px] border-b px-4 py-2 text-xs font-bold uppercase sm:grid" style={{ borderColor: "var(--t-line)", color: "var(--t-muted)" }}><span>Produto</span><span>Quantidade</span><span className="text-right">Subtotal</span></div>
            <ul>
              {itens.map((i) => (
                <li key={i.slug} className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-3 border-b p-3 last:border-b-0 sm:grid-cols-[72px_minmax(0,1fr)_150px_110px] sm:px-4" style={{ borderColor: "var(--t-line)" }}>
                  <Foto src={i.foto} alt="" className="size-[72px] rounded-md object-cover" />
                  <div className="min-w-0"><p className="line-clamp-2 text-sm font-medium">{i.nome}</p><p className="text-xs" style={{ color: "var(--t-muted)" }}>{brl(i.preco)} cada</p></div>
                  <Quantidade slug={i.slug} nome={i.nome} qtd={i.qtd} redondo={false} className="col-span-2 sm:col-span-1" />
                  <p className="col-span-2 text-right font-bold sm:col-span-1">{brl(i.preco * i.qtd)}</p>
                </li>
              ))}
            </ul>
          </div>
          <aside className="h-fit rounded-lg border bg-white p-4" style={{ borderColor: "var(--t-line)" }}>
            <h2 className="font-bold">Resumo do pedido</h2>
            <p className="mt-3 flex justify-between text-sm"><span>Produtos ({quantidade})</span><span>{brl(total)}</span></p>
            <p className="mt-1 flex justify-between text-sm" style={{ color: "var(--t-muted)" }}><span>Frete</span><span>calculado no pedido</span></p>
            <p className="mt-3 flex justify-between border-t pt-3 text-xl font-bold" style={{ borderColor: "var(--t-line)" }}><span>Total</span><span>{brl(total)}</span></p>
            <AvisoSemCobranca d={d} className="mt-3 rounded-md bg-[color-mix(in_srgb,var(--t-fg)_5%,transparent)] p-3 text-sm" />
            <button type="button" aria-disabled={d.demo} className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-md font-bold aria-disabled:cursor-not-allowed" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>{rotuloFinalizar(d)}</button>
          </aside>
        </div>
      )}
    </main>
  );
}
