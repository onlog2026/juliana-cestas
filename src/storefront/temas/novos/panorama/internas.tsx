"use client";

import { useState, type ReactNode } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Foto, brl } from "../../kit";
import { useDemoCart } from "../../demo-cart";
import type { DadosLoja } from "../../types";
import type { EncaixesCategoria, EncaixesProduto } from "../../encaixes";
import { AvisoSemCobranca, CaminhoPao, CarrinhoVazio, FAIXAS, NaoEncontrada, ORDENS, Quantidade, descontoPct, itensLimpos, rotuloFinalizar, useCompra, useLista, type Ordem } from "../../internas/comum";
import { ALTURA_TELA } from "./estilo";
import { Cartao } from "./cartao";

/** PANORAMA (internas) — categoria em painéis grandes alternados; cesta com foto presa à esquerda e texto rolando à direita; carrinho em duas metades. */

/** Cartão do modelo, usado pelos blocos reais da loja ao vivo. */
export { Cartao };

const EYEBROW = "text-xs font-semibold tracking-[0.25em] uppercase";
const LARG = "mx-auto w-full max-w-[2000px] px-5 sm:px-8";

export function Categoria({ d, slug, encaixes }: { d: DadosLoja; slug?: string; encaixes?: EncaixesCategoria }) {
  const { cat, titulo, lista, ordem, setOrdem, faixa, setFaixa } = useLista(d, slug);
  return (
    <main>
      <section className="border-b py-10 sm:py-14" style={{ borderColor: "var(--t-line)" }}>
        <div className={LARG}>
          <CaminhoPao d={d} cat={cat ? { nome: cat.nome, href: cat.href } : undefined} />
          <h1 className="mt-5 text-[clamp(2.5rem,7vw,6rem)] leading-[0.98] tracking-tight" style={{ fontFamily: "var(--t-titulo)" }}>{titulo}</h1>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-1">
            {FAIXAS.map(([k, l]) => (
              <button key={k} type="button" aria-pressed={faixa === k} onClick={() => setFaixa(k)} className="min-h-11 text-sm" style={{ color: faixa === k ? "var(--t-primary)" : "var(--t-muted)", fontWeight: faixa === k ? 700 : 400, textDecoration: faixa === k ? "underline" : "none", textUnderlineOffset: 6 }}>{l}</button>
            ))}
            <label className="ml-auto flex items-center gap-2 text-sm" style={{ color: "var(--t-muted)" }}>
              <span className="sr-only">Ordenar</span>
              <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} aria-label="Ordenar" className="min-h-11 rounded-full border bg-transparent px-4" style={{ borderColor: "var(--t-line)", color: "var(--t-fg)" }}>
                {ORDENS.map(([k, l]) => <option key={k} value={k} style={{ color: "#111" }}>{l}</option>)}
              </select>
            </label>
          </div>
          {encaixes?.filtrosExtras ? <div className="mt-4 min-w-0">{encaixes.filtrosExtras}</div> : null}
          <p className="mt-2 text-sm" style={{ color: "var(--t-muted)" }} aria-live="polite">{lista.length} {lista.length === 1 ? "cesta" : "cestas"}</p>
        </div>
      </section>

      {lista.length ? lista.map((p, n) => {
        const par = n % 2 === 0;
        const pct = descontoPct(p);
        return (
          <article key={p.slug} className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-2" style={{ background: par ? "var(--t-bg)" : "var(--t-surface)" }}>
            <a href={p.href} aria-label={p.nome} className={`group relative block aspect-[4/3] min-w-0 lg:aspect-auto ${ALTURA_TELA} ${par ? "" : "lg:order-2"}`}>
              <div className="absolute inset-0 overflow-hidden">
                <Foto src={p.fotos[0] ?? ""} alt={p.nome} className="pn-foto size-full object-cover transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transition-none" />
              </div>
            </a>
            <div className={`flex min-w-0 items-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24 ${par ? "" : "lg:order-1"}`}>
              <div className="pn-rev w-full max-w-xl min-w-0">
                <p className="text-sm tracking-[0.2em] tabular-nums" style={{ color: "var(--t-muted)" }}>{String(n + 1).padStart(2, "0")}</p>
                <h2 className="mt-4 text-[clamp(1.9rem,3.6vw,3.25rem)] leading-[1.05] tracking-tight" style={{ fontFamily: "var(--t-titulo)" }}><a href={p.href}>{p.nome}</a></h2>
                {p.serve ? <p className="mt-3" style={{ color: "var(--t-muted)" }}>{p.serve}</p> : null}
                <p className="mt-5 text-2xl tabular-nums" style={{ fontFamily: "var(--t-titulo)" }}>
                  {p.precoDe ? <s className="mr-3 text-base" style={{ color: "var(--t-muted)" }}>{brl(p.precoDe)}</s> : null}
                  {brl(p.preco)}
                  {pct ? <span className="ml-3 align-middle text-xs font-semibold tracking-wider" style={{ color: "var(--t-primary)" }}>-{pct}%</span> : null}
                </p>
                <a href={p.href} className="pn-link mt-7 inline-flex min-h-11 items-center gap-2 font-medium">Ver a cesta <ArrowRight className="size-4" aria-hidden="true" /></a>
              </div>
            </div>
          </article>
        );
      }) : (
        <p className="px-6 py-24 text-center" style={{ color: "var(--t-muted)" }}>Nenhuma cesta nessa faixa de preço. <button type="button" className="underline" onClick={() => setFaixa("")}>Ver todas</button></p>
      )}

      {encaixes?.rodape ? <div className={`${LARG} min-w-0 py-16`}>{encaixes.rodape}</div> : null}
    </main>
  );
}

export function Produto({ d, slug, encaixes }: { d: DadosLoja; slug: string; encaixes?: EncaixesProduto }) {
  const p = d.produtos.find((x) => x.slug === slug);
  const { comprar, ok } = useCompra(p);
  const [foto, setFoto] = useState(0);
  if (!p) return <NaoEncontrada d={d} />;
  const cat = d.categorias.find((c) => c.slug === p.categoria);
  const itens = itensLimpos(p);
  const fotos = p.fotos.length ? p.fotos : [""];
  const pct = descontoPct(p);
  return (
    <main>
      <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-2">
        <div className="relative min-w-0 lg:sticky lg:top-16 lg:h-[calc(100dvh-4rem)]">
          <Foto src={fotos[Math.min(foto, fotos.length - 1)]} alt={p.nome} className="aspect-[4/5] w-full object-cover lg:aspect-auto lg:h-full" />
          {fotos.length > 1 ? (
            <div className="absolute bottom-4 left-4 flex gap-2" role="group" aria-label="Fotos da cesta">
              {fotos.slice(0, 5).map((f, i) => (
                <button key={i} type="button" aria-label={`Ver foto ${i + 1}`} aria-pressed={i === foto} onClick={() => setFoto(i)} className="size-14 overflow-hidden rounded-md border-2 p-0" style={{ borderColor: i === foto ? "var(--t-bg)" : "transparent", opacity: i === foto ? 1 : 0.8 }}>
                  <Foto src={f} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="min-w-0 px-6 py-10 pb-32 sm:px-12 lg:px-16 lg:py-20 lg:pb-20 xl:px-24">
          <CaminhoPao d={d} p={p} cat={cat ? { nome: cat.nome, href: cat.href } : undefined} />
          <h1 className="mt-8 text-[clamp(2.2rem,4.6vw,4.25rem)] leading-[1.02] tracking-tight" style={{ fontFamily: "var(--t-titulo)" }}>{p.nome}</h1>
          <p className="mt-6 text-3xl tabular-nums" style={{ fontFamily: "var(--t-titulo)" }}>
            {p.precoDe ? <s className="mr-3 text-lg" style={{ color: "var(--t-muted)" }}>{brl(p.precoDe)}</s> : null}
            {brl(p.preco)}
            {pct ? <span className="ml-3 align-middle text-xs font-semibold tracking-wider" style={{ color: "var(--t-primary)" }}>-{pct}%</span> : null}
          </p>
          {p.serve ? <p className="mt-2" style={{ color: "var(--t-muted)" }}>{p.serve}</p> : null}
          <p className="mt-8 max-w-xl text-lg leading-[1.8]" style={{ color: "var(--t-muted)" }}>{p.descricao}</p>

          {itens.length ? (
            <section className="mt-10" aria-labelledby="dentro">
              <h2 id="dentro" className={EYEBROW} style={{ color: "var(--t-primary)" }}>O que vem na cesta</h2>
              <ul className="mt-4 border-t" style={{ borderColor: "var(--t-line)" }}>
                {itens.map((i, n) => (
                  <li key={i} className="flex min-w-0 gap-5 border-b py-3" style={{ borderColor: "var(--t-line)" }}>
                    <span className="w-6 shrink-0 text-sm tabular-nums" style={{ color: "var(--t-muted)" }}>{String(n + 1).padStart(2, "0")}</span>
                    <span className="min-w-0">{i}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {encaixes?.compra ? (
            <>
              {/* Loja ao vivo: a compra real fica no corpo; no celular a barra fixa leva até ela. */}
              <div id="compra" className="mt-10 min-w-0 scroll-mt-20">{encaixes.compra}</div>
              {encaixes.entrega ? <div className="mt-5 min-w-0">{encaixes.entrega}</div> : null}
              <div className="fixed inset-x-0 z-30 flex items-center gap-3 border-t px-4 py-2 lg:hidden" style={{ bottom: "var(--demo-barra-baixo, 0px)", background: "var(--t-bg)", borderColor: "var(--t-line)" }}>
                <p className="min-w-0 flex-1 text-xl tabular-nums" style={{ fontFamily: "var(--t-titulo)" }}>{brl(p.preco)}</p>
                <a href="#compra" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full px-8 font-medium" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>Comprar</a>
              </div>
            </>
          ) : (
          <>
          {/* Um só botão de compra: barra fixa no celular, bloco comum no computador. */}
          <div className="max-lg:fixed max-lg:inset-x-0 max-lg:z-30 max-lg:flex max-lg:items-center max-lg:gap-3 max-lg:border-t max-lg:px-4 max-lg:py-2 lg:mt-10" style={{ bottom: "var(--demo-barra-baixo, 0px)", background: "var(--t-bg)", borderColor: "var(--t-line)" }}>
            <p className="min-w-0 flex-1 text-xl tabular-nums lg:hidden" style={{ fontFamily: "var(--t-titulo)" }}>{brl(p.preco)}</p>
            <button type="button" data-acao="comprar" onClick={comprar} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-8 font-medium max-lg:shrink-0 lg:w-full lg:min-h-14" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>
              {ok ? <><Check className="size-4" aria-hidden="true" /> Adicionada</> : "Adicionar ao carrinho"}
            </button>
          </div>
          <a href={`${d.base}/carrinho`} className="pn-link mt-6 inline-flex min-h-11 items-center gap-2 font-medium max-lg:mb-0">Ver carrinho <ArrowRight className="size-4" aria-hidden="true" /></a>
          </>
          )}
          <p className="mt-6 text-sm" style={{ color: "var(--t-muted)" }}>Dia e horário de entrega escolhidos no pedido. Cartão de mensagem incluso.</p>
        </div>
      </div>

      <section className="border-t py-16" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }} aria-labelledby="outras">
        <div className={LARG}>
          <h2 id="outras" className={EYEBROW} style={{ color: "var(--t-primary)" }}>Continue olhando</h2>
          <div className="mt-6 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 lg:grid-cols-4 lg:gap-6">
            {d.produtos.filter((x) => x.slug !== p.slug).slice(0, 4).map((x) => (
              <a key={x.slug} href={x.href} className="group block min-w-0">
                <div className="overflow-hidden rounded-md border" style={{ borderColor: "var(--t-line)" }}>
                  <Foto src={x.fotos[0] ?? ""} alt={x.nome} className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:transition-none" />
                </div>
                <p className="mt-3 line-clamp-2 text-lg leading-snug" style={{ fontFamily: "var(--t-titulo)" }}>{x.nome}</p>
                <p className="text-sm tabular-nums" style={{ color: "var(--t-muted)" }}>{brl(x.preco)}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {[
        ["Avaliações", encaixes?.avaliacoes],
        ["Quem comprou também levou", encaixes?.quemComprou],
        ["Embalagem e cartãozinho", encaixes?.extras],
        ["Vistos recentemente", encaixes?.vistos],
      ].map(([rotulo, no]) => (no ? <section key={rotulo as string} aria-label={rotulo as string} className="border-t py-14" style={{ borderColor: "var(--t-line)" }}><div className={`${LARG} min-w-0`}>{no as ReactNode}</div></section> : null))}
    </main>
  );
}

export function Carrinho({ d, conteudo }: { d: DadosLoja; conteudo?: ReactNode }) {
  const { itens, total } = useDemoCart();
  if (conteudo) {
    return (
      <main className={`${LARG} min-w-0 py-12 lg:py-20 ${ALTURA_TELA}`}>
        <p className={EYEBROW} style={{ color: "var(--t-primary)" }}>Seu pedido</p>
        <h1 className="mt-4 text-[clamp(2.5rem,6vw,5rem)] leading-[0.98] tracking-tight" style={{ fontFamily: "var(--t-titulo)" }}>Carrinho</h1>
        <div className="mt-10 min-w-0">{conteudo}</div>
      </main>
    );
  }
  return (
    <main className={`grid grid-cols-[minmax(0,1fr)] lg:grid-cols-2 ${ALTURA_TELA}`}>
      <section className="min-w-0 px-6 py-12 sm:px-12 lg:px-16 lg:py-20 xl:px-24" style={{ background: "var(--t-surface)" }}>
        <div className="lg:sticky lg:top-28">
          <p className={EYEBROW} style={{ color: "var(--t-primary)" }}>Seu pedido</p>
          <h1 className="mt-4 text-[clamp(2.5rem,6vw,5rem)] leading-[0.98] tracking-tight" style={{ fontFamily: "var(--t-titulo)" }}>Carrinho</h1>
          {itens.length ? (
            <div className="mt-10 max-w-md">
              <div className="flex items-baseline justify-between border-t pt-5" style={{ borderColor: "var(--t-line)" }}>
                <p className={EYEBROW}>Total</p>
                <p className="text-4xl tabular-nums" style={{ fontFamily: "var(--t-titulo)" }}>{brl(total)}</p>
              </div>
              <p className="mt-2 text-sm" style={{ color: "var(--t-muted)" }}>Entrega e cartão de mensagem no pedido.</p>
              <AvisoSemCobranca d={d} className="mt-5 rounded-xl p-4 text-sm" />
              <button type="button" aria-disabled={d.demo} className="mt-5 inline-flex min-h-14 w-full items-center justify-center rounded-full font-medium aria-disabled:cursor-not-allowed" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>{rotuloFinalizar(d)}</button>
            </div>
          ) : null}
        </div>
      </section>
      <section className="min-w-0 px-6 py-12 sm:px-12 lg:px-16 lg:py-20 xl:px-24">
        {itens.length === 0 ? (
          <CarrinhoVazio d={d} className="rounded-2xl border border-dashed p-10 text-center" botao="mt-5 inline-flex min-h-12 items-center rounded-full px-8 font-medium" />
        ) : (
          <ul className="border-t" style={{ borderColor: "var(--t-line)" }}>
            {itens.map((i) => (
              <li key={i.slug} className="flex min-w-0 gap-5 border-b py-6" style={{ borderColor: "var(--t-line)" }}>
                <Foto src={i.foto} alt="" className="aspect-[4/5] w-24 shrink-0 rounded-md object-cover sm:w-32" />
                <div className="min-w-0 flex-1">
                  <p className="text-2xl leading-tight" style={{ fontFamily: "var(--t-titulo)" }}>{i.nome}</p>
                  <p className="mt-1 text-sm tabular-nums" style={{ color: "var(--t-muted)" }}>{brl(i.preco)} cada</p>
                  <p className="mt-2 text-lg tabular-nums">{brl(i.preco * i.qtd)}</p>
                  <Quantidade slug={i.slug} nome={i.nome} qtd={i.qtd} className="mt-2" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
