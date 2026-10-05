"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Foto, brl } from "../../kit";
import { useDemoCart } from "../../demo-cart";
import type { ReactNode } from "react";
import type { DadosLoja, ProdutoLoja } from "../../types";
import type { EncaixesCategoria, EncaixesProduto } from "../../encaixes";
import { AvisoSemCobranca, CaminhoPao, CarrinhoVazio, FAIXAS, NaoEncontrada, ORDENS, Quantidade, itensLimpos, rotuloFinalizar, useCompra, useLista, type Ordem } from "../../internas/comum";
import { Blob, CartaoNuvem, Coracao, IconeDe, Laco, Onda, SOMBRA_NUVEM, forma, wrapA } from "./formas";

/**
 * ACONCHEGO — páginas internas: categoria com filtros em pílulas e cartões nuvem,
 * cesta com foto orgânica e itens em lista com ícone de linha, carrinho em cartões macios.
 */

const titulo = { fontFamily: "var(--t-titulo)", fontWeight: 700 } as const;

export function Categoria({ d, slug, encaixes }: { d: DadosLoja; slug?: string; encaixes?: EncaixesCategoria }) {
  const { cat, titulo: nome, lista, ordem, setOrdem, faixa, setFaixa } = useLista(d, slug);
  return (
    <main className={`${wrapA} py-8 sm:py-12`}>
      <CaminhoPao d={d} cat={cat ? { nome: cat.nome, href: cat.href } : undefined} />
      <header className="relative mt-6 text-center">
        <Blob i={1} className="absolute top-1/2 left-1/2 -z-0 w-56 -translate-x-1/2 -translate-y-1/2 sm:w-72" style={{ color: "color-mix(in srgb, var(--t-accent) 55%, var(--t-bg))" }} />
        <h1 className="relative text-4xl sm:text-5xl" style={titulo}>{nome}</h1>
        <p className="relative mt-2" style={{ color: "var(--t-muted)" }}>Cestas montadas à mão, com carinho.</p>
      </header>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Faixa de preço">
        {FAIXAS.map(([k, l]) => (
          <button key={k} type="button" aria-pressed={faixa === k} onClick={() => setFaixa(k)} className="min-h-11 rounded-full border px-5 text-sm font-semibold" style={{ borderColor: faixa === k ? "var(--t-primary)" : "var(--t-line)", background: faixa === k ? "var(--t-primary)" : "var(--t-surface)", color: faixa === k ? "var(--t-on-primary)" : "var(--t-fg)" }}>{l}</button>
        ))}
        <label className="flex items-center gap-2 text-sm font-semibold sm:ml-3">
          Ordenar
          <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} className="min-h-11 rounded-full border px-4" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)", color: "var(--t-fg)" }}>
            {ORDENS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
      </div>
      {encaixes?.filtrosExtras ? <div className="mt-4 flex min-w-0 flex-wrap justify-center gap-2">{encaixes.filtrosExtras}</div> : null}
      <p className="mt-4 text-center text-sm" style={{ color: "var(--t-muted)" }} aria-live="polite">{lista.length} {lista.length === 1 ? "cesta" : "cestas"}</p>

      {lista.length ? (
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3.5 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
          {lista.map((p, i) => (
            <CartaoNuvem key={p.slug} i={i} c={{ href: p.href, nome: p.nome, preco: p.preco, precoDe: p.precoDe, serve: p.serve, imagem: p.fotos[0] }} />
          ))}
        </div>
      ) : (
        <div className="mx-auto mt-10 max-w-md rounded-[2rem] border border-dashed p-8 text-center" style={{ borderColor: "var(--t-line)" }}>
          <p>Nenhuma cesta nessa faixa por enquanto.</p>
          <button type="button" onClick={() => setFaixa("")} className="mt-3 inline-flex min-h-11 items-center rounded-full border px-5 font-semibold" style={{ borderColor: "var(--t-primary)", color: "var(--t-primary)" }}>Ver todas</button>
        </div>
      )}
      {encaixes?.rodape ? <div className="mt-16 min-w-0">{encaixes.rodape}</div> : null}
    </main>
  );
}

/** Cartão do modelo (usado pelos blocos reais da loja ao vivo). */
export function Cartao({ p }: { p: ProdutoLoja }) {
  return <CartaoNuvem i={0} c={{ href: p.href, nome: p.nome, preco: p.preco, precoDe: p.precoDe, serve: p.serve, imagem: p.fotos[0] }} />;
}

export function Produto({ d, slug, encaixes }: { d: DadosLoja; slug: string; encaixes?: EncaixesProduto }) {
  const p = d.produtos.find((x) => x.slug === slug);
  const { comprar, ok } = useCompra(p);
  const [sel, setSel] = useState(0);
  if (!p) return <NaoEncontrada d={d} />;
  const cat = d.categorias.find((c) => c.slug === p.categoria);
  const itens = itensLimpos(p);
  const foto = p.fotos[sel] ?? p.fotos[0];
  const pct = p.precoDe && p.precoDe > p.preco ? Math.round((1 - p.preco / p.precoDe) * 100) : null;
  return (
    <main className={`${wrapA} pt-8 pb-32 sm:pt-12 lg:pb-16`}>
      <CaminhoPao d={d} p={p} cat={cat ? { nome: cat.nome, href: cat.href } : undefined} />
      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
        <div className="min-w-0">
          <div className="relative mx-auto max-w-[520px] px-3">
            <Blob i={0} className="absolute -top-6 -right-3 w-[85%]" style={{ color: "var(--t-accent)" }} />
            <Blob i={2} className="absolute -bottom-6 -left-3 w-[45%]" style={{ color: "color-mix(in srgb, var(--t-primary) 16%, var(--t-bg))" }} />
            <div className="relative overflow-hidden border-[6px]" style={{ borderRadius: forma(sel), aspectRatio: "1 / 1", borderColor: "var(--t-surface)", boxShadow: "0 30px 60px -34px color-mix(in srgb, var(--t-primary) 55%, transparent)" }}>
              <Foto src={foto} alt={p.nome} className="size-full object-cover" />
            </div>
          </div>
          {p.fotos.length > 1 ? (
            <div className="mt-6 flex flex-wrap justify-center gap-3" role="group" aria-label="Fotos da cesta">
              {p.fotos.slice(0, 5).map((f, i) => (
                <button key={f + i} type="button" aria-label={`Ver foto ${i + 1}`} aria-pressed={sel === i} onClick={() => setSel(i)} className="size-16 overflow-hidden border-2" style={{ borderRadius: forma(i + 2), borderColor: sel === i ? "var(--t-primary)" : "var(--t-line)" }}>
                  <Foto src={f} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--t-primary)" }}><Coracao className="size-4" /> {cat?.nome ?? "Cesta"}</p>
          <h1 className="mt-2 text-4xl leading-tight sm:text-5xl" style={titulo}>{p.nome}</h1>
          {p.serve ? <p className="mt-1" style={{ color: "var(--t-muted)" }}>{p.serve}</p> : null}
          <p className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="text-4xl font-bold" style={{ color: "var(--t-primary)", fontFamily: "var(--t-titulo)" }}>{brl(p.preco)}</span>
            {p.precoDe ? <s className="text-base" style={{ color: "var(--t-muted)" }}>{brl(p.precoDe)}</s> : null}
            {pct ? <span className="rounded-full px-3 py-1 text-sm font-bold" style={{ background: "var(--t-accent)", color: "var(--t-fg)" }}>-{pct}%</span> : null}
          </p>
          <p className="mt-5 text-lg leading-relaxed" style={{ color: "var(--t-muted)" }}>{p.descricao}</p>

          {itens.length ? (
            <section className="mt-8" aria-labelledby="aco-itens">
              <h2 id="aco-itens" className="text-2xl" style={{ fontFamily: "var(--t-titulo)", fontWeight: 600 }}>O que vem na cesta</h2>
              <ul className="mt-4 grid gap-2.5">
                {itens.map((it, n) => (
                  <li key={it + n} className="flex items-center gap-3 text-[17px]">
                    <span className="grid size-10 shrink-0 place-items-center" style={{ background: "color-mix(in srgb, var(--t-accent) 60%, var(--t-bg))", color: "var(--t-primary)", borderRadius: forma(n) }}>
                      <IconeDe i={n} className="size-5" />
                    </span>
                    <span className="min-w-0">{it}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {encaixes?.compra ? (
            <>
              <div id="compra" className="mt-9 min-w-0 scroll-mt-4">{encaixes.compra}</div>
              {encaixes.entrega ? <div className="mt-4 min-w-0">{encaixes.entrega}</div> : null}
            </>
          ) : (
            <>
              <button type="button" data-acao="comprar" onClick={comprar} className="mt-9 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full border text-lg font-bold shadow-md" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)", borderColor: "var(--t-primary)" }}>
                {ok ? <><Check className="size-5" /> Na cestinha!</> : "Colocar no carrinho"}
              </button>
              <a href={`${d.base}/carrinho`} className="mt-3 flex min-h-12 w-full items-center justify-center rounded-full border font-semibold" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>Ver carrinho</a>
            </>
          )}

          <div className="mt-8 flex items-start gap-4 rounded-[2rem] border p-5" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)", boxShadow: SOMBRA_NUVEM }}>
            <Laco className="mt-0.5 size-9 shrink-0" style={{ color: "var(--t-primary)" }} />
            <div>
              <p className="font-bold" style={{ fontFamily: "var(--t-titulo)" }}>Feito com carinho</p>
              <p className="mt-0.5 text-sm leading-relaxed" style={{ color: "var(--t-muted)" }}>Montada à mão, com entrega em data e horário marcados e um cartão escrito do seu jeito.</p>
            </div>
          </div>
        </div>
      </div>

      {encaixes?.extras ? <section className="mt-16 min-w-0" aria-labelledby="aco-extras"><h2 id="aco-extras" className="mb-5 text-center text-3xl" style={titulo}>Para deixar ainda mais especial</h2>{encaixes.extras}</section> : null}
      {encaixes?.avaliacoes ? <section className="mt-16 min-w-0" aria-labelledby="aco-aval"><h2 id="aco-aval" className="sr-only">Avaliações</h2>{encaixes.avaliacoes}</section> : null}
      {encaixes?.quemComprou ? <section className="mt-16 min-w-0" aria-label="Quem comprou também levou">{encaixes.quemComprou}</section> : null}
      {encaixes?.vistos ? <section className="mt-16 min-w-0" aria-label="Vistos recentemente">{encaixes.vistos}</section> : null}

      <section className="mt-20" aria-labelledby="aco-mais">
        <div className="text-center">
          <h2 id="aco-mais" className="text-3xl" style={titulo}>Mais cestas para você</h2>
          <Onda className="mx-auto mt-3 h-3 w-24" style={{ color: "var(--t-primary)" }} />
        </div>
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3.5 sm:gap-6 lg:grid-cols-4">
          {d.produtos.filter((x) => x.slug !== p.slug).slice(0, 4).map((x, i) => (
            <CartaoNuvem key={x.slug} i={i + 1} c={{ href: x.href, nome: x.nome, preco: x.preco, precoDe: x.precoDe, serve: x.serve, imagem: x.fotos[0] }} />
          ))}
        </div>
      </section>

      <div className="fixed inset-x-0 z-30 flex items-center gap-3 rounded-t-[1.75rem] border-t px-5 pt-3 pb-3 lg:hidden" style={{ bottom: "var(--demo-barra-baixo, 0px)", paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))", background: "var(--t-surface)", borderColor: "var(--t-line)", boxShadow: "0 -10px 30px -18px color-mix(in srgb, var(--t-primary) 45%, transparent)" }}>
        <p className="min-w-0 flex-1 text-xl font-bold" style={{ color: "var(--t-primary)", fontFamily: "var(--t-titulo)" }}>{brl(p.preco)}</p>
        {encaixes?.compra ? (
          <a href="#compra" className="inline-flex min-h-11 items-center rounded-full border px-6 font-bold" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)", borderColor: "var(--t-primary)" }}>Comprar</a>
        ) : (
          <button type="button" onClick={comprar} className="min-h-11 rounded-full border px-6 font-bold" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)", borderColor: "var(--t-primary)" }}>{ok ? "Adicionada!" : "Colocar no carrinho"}</button>
        )}
      </div>
    </main>
  );
}

export function Carrinho({ d, conteudo }: { d: DadosLoja; conteudo?: ReactNode }) {
  const { itens, total } = useDemoCart();
  return (
    <main className={`${wrapA} py-8 sm:py-12`}>
      <header className="text-center">
        <Laco className="mx-auto size-10" style={{ color: "var(--t-primary)" }} />
        <h1 className="mt-2 text-4xl sm:text-5xl" style={titulo}>Seu carrinho</h1>
      </header>
      {conteudo ? (
        <div className="mx-auto mt-10 min-w-0 max-w-5xl">{conteudo}</div>
      ) : itens.length === 0 ? (
        <CarrinhoVazio d={d} className="mx-auto mt-10 max-w-lg rounded-[2rem] border border-dashed p-10 text-center" botao="mt-5 inline-flex min-h-12 items-center rounded-full border px-8 font-bold" />
      ) : (
        <div className="mt-10 grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <ul className="grid gap-4">
            {itens.map((i, n) => (
              <li key={i.slug} className="flex min-w-0 gap-4 rounded-[2rem] border p-3" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)", boxShadow: SOMBRA_NUVEM }}>
                <Foto src={i.foto} alt={i.nome} className="size-24 shrink-0 object-cover sm:size-28" style={{ borderRadius: forma(n) }} />
                <div className="min-w-0 flex-1">
                  <p className="text-lg leading-snug" style={{ fontFamily: "var(--t-titulo)", fontWeight: 600 }}>{i.nome}</p>
                  <p className="text-sm" style={{ color: "var(--t-muted)" }}>{brl(i.preco)} cada</p>
                  <Quantidade slug={i.slug} nome={i.nome} qtd={i.qtd} className="mt-2" />
                </div>
                <p className="shrink-0 pr-2 font-bold" style={{ color: "var(--t-primary)" }}>{brl(i.preco * i.qtd)}</p>
              </li>
            ))}
          </ul>
          <aside className="relative overflow-hidden rounded-[2.5rem] border p-6" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)", boxShadow: SOMBRA_NUVEM }}>
            <Blob i={0} className="absolute -top-14 -right-12 w-44" style={{ color: "color-mix(in srgb, var(--t-accent) 50%, var(--t-surface))" }} />
            <p className="relative flex items-baseline justify-between text-2xl font-bold" style={{ fontFamily: "var(--t-titulo)" }}><span>Total</span><span style={{ color: "var(--t-primary)" }}>{brl(total)}</span></p>
            <p className="relative mt-1 flex items-center gap-1.5 text-sm" style={{ color: "var(--t-muted)" }}><Coracao className="size-4" /> Data, horário e cartão você escolhe ao finalizar.</p>
            <AvisoSemCobranca d={d} className="relative mt-4 rounded-2xl p-3 text-sm" />
            <button type="button" aria-disabled={d.demo} className="relative mt-5 inline-flex min-h-14 w-full items-center justify-center rounded-full border text-lg font-bold aria-disabled:cursor-not-allowed aria-disabled:opacity-80" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)", borderColor: "var(--t-primary)" }}>{rotuloFinalizar(d)}</button>
            <a href={`${d.base}/categoria`} className="relative mt-3 flex min-h-11 items-center justify-center rounded-full text-sm font-semibold underline">Continuar escolhendo</a>
          </aside>
        </div>
      )}
    </main>
  );
}
