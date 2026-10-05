"use client";

import { useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import { Foto, brl } from "../../kit";
import { useDemoCart } from "../../demo-cart";
import type { DadosLoja } from "../../types";
import type { EncaixesCategoria, EncaixesProduto } from "../../encaixes";
import { AvisoSemCobranca, CaminhoPao, CarrinhoVazio, FAIXAS, NaoEncontrada, ORDENS, Quantidade, descontoPct, itensLimpos, rotuloFinalizar, useCompra, useLista, type Ordem } from "../../internas/comum";
import { CAPS, Cartao, LARG, Titulo } from "./comum";

/** SIMETRIA (internas) — categoria em 3 colunas com filtros centralizados; cesta com foto central e tudo no eixo; carrinho em coluna única. */

/** Cartão do modelo, usado pelos blocos reais da loja ao vivo. */
export { Cartao };

export function Categoria({ d, slug, encaixes }: { d: DadosLoja; slug?: string; encaixes?: EncaixesCategoria }) {
  const { cat, titulo, lista, ordem, setOrdem, faixa, setFaixa } = useLista(d, slug);
  return (
    <main className={`${LARG} py-10 sm:py-14`}>
      <div className="flex justify-center"><CaminhoPao d={d} cat={cat ? { nome: cat.nome, href: cat.href } : undefined} /></div>
      <h1 className="mt-5 text-center text-[clamp(2rem,5vw,3.5rem)] leading-tight" style={{ fontFamily: "var(--t-titulo)" }}>{titulo}</h1>
      <span className="mx-auto mt-5 block h-px w-20" style={{ background: "var(--t-primary)" }} />

      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        {FAIXAS.map(([k, l]) => (
          <button key={k} type="button" aria-pressed={faixa === k} onClick={() => setFaixa(k)} className={`min-h-11 px-4 ${CAPS}`} style={{ color: faixa === k ? "var(--t-primary)" : "var(--t-muted)", fontWeight: faixa === k ? 700 : 500, textDecoration: faixa === k ? "underline" : "none", textUnderlineOffset: 8 }}>{l}</button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
        <label className={`flex items-center gap-2 ${CAPS}`} style={{ color: "var(--t-muted)" }}>
          <span>Ordenar</span>
          <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} aria-label="Ordenar" className="min-h-11 border bg-transparent px-3 tracking-normal normal-case" style={{ borderColor: "var(--t-line)", color: "var(--t-fg)" }}>
            {ORDENS.map(([k, l]) => <option key={k} value={k} style={{ color: "#111" }}>{l}</option>)}
          </select>
        </label>
        <p className="text-sm" style={{ color: "var(--t-muted)" }} aria-live="polite">{lista.length} {lista.length === 1 ? "cesta" : "cestas"}</p>
      </div>
      {encaixes?.filtrosExtras ? <div className="mx-auto mt-4 flex min-w-0 max-w-3xl justify-center">{encaixes.filtrosExtras}</div> : null}

      {lista.length ? (
        <div className="mt-10 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3">
          {lista.map((p) => <Cartao key={p.slug} p={{ nome: p.nome, preco: p.preco, precoDe: p.precoDe, imagem: p.fotos[0] ?? "", serve: p.serve, href: p.href }} />)}
        </div>
      ) : (
        <p className="mt-16 text-center" style={{ color: "var(--t-muted)" }}>Nenhuma cesta nessa faixa de preço. <button type="button" className="underline" onClick={() => setFaixa("")}>Ver todas</button></p>
      )}

      {encaixes?.rodape ? <div className="mt-20 min-w-0">{encaixes.rodape}</div> : null}
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
    <main className={`${LARG} py-8 pb-32 sm:py-12 sm:pb-16`}>
      <div className="flex justify-center"><CaminhoPao d={d} p={p} cat={cat ? { nome: cat.nome, href: cat.href } : undefined} /></div>

      <div className="mx-auto mt-6 max-w-[640px]">
        <div className="overflow-hidden border" style={{ borderColor: "var(--t-line)" }}>
          <Foto src={fotos[Math.min(foto, fotos.length - 1)]} alt={p.nome} className="aspect-[4/5] w-full object-cover transition-transform duration-700 hover:scale-[1.03] motion-reduce:transition-none" />
        </div>
        {fotos.length > 1 ? (
          <div className="mt-3 flex justify-center gap-2" role="group" aria-label="Fotos da cesta">
            {fotos.slice(0, 5).map((f, i) => (
              <button key={i} type="button" aria-label={`Ver foto ${i + 1}`} aria-pressed={i === foto} onClick={() => setFoto(i)} className="size-16 overflow-hidden border p-0" style={{ borderColor: i === foto ? "var(--t-primary)" : "var(--t-line)", opacity: i === foto ? 1 : 0.75 }}>
                <Foto src={f} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mx-auto mt-10 max-w-2xl text-center">
        <h1 className="text-[clamp(2rem,4.4vw,3.25rem)] leading-tight" style={{ fontFamily: "var(--t-titulo)" }}>{p.nome}</h1>
        <p className="mt-4 text-3xl tabular-nums" style={{ fontFamily: "var(--t-titulo)", color: "var(--t-primary)" }}>
          {p.precoDe ? <s className="mr-3 text-lg" style={{ color: "var(--t-muted)" }}>{brl(p.precoDe)}</s> : null}
          {brl(p.preco)}
        </p>
        {pct ? <p className={`mt-1 ${CAPS}`} style={{ color: "var(--t-primary)" }}>{pct}% de desconto</p> : null}
        {p.serve ? <p className="mt-2 text-sm" style={{ color: "var(--t-muted)" }}>{p.serve}</p> : null}
        <p className="mt-6 leading-[1.85]" style={{ color: "var(--t-muted)" }}>{p.descricao}</p>

        {encaixes?.compra ? (
          <>
            {/* Loja ao vivo: a compra real fica no corpo; no celular a barra fixa leva até ela. */}
            <div id="compra" className="mx-auto mt-8 min-w-0 max-w-xl scroll-mt-20 text-left">{encaixes.compra}</div>
            {encaixes.entrega ? <div className="mt-4 min-w-0">{encaixes.entrega}</div> : null}
            <div className="fixed inset-x-0 z-30 flex items-center gap-3 border-t px-4 py-2 sm:hidden" style={{ bottom: "var(--demo-barra-baixo, 0px)", background: "var(--t-bg)", borderColor: "var(--t-line)" }}>
              <p className="min-w-0 flex-1 text-left text-xl tabular-nums" style={{ fontFamily: "var(--t-titulo)" }}>{brl(p.preco)}</p>
              <a href="#compra" className={`inline-flex min-h-12 shrink-0 items-center justify-center border px-10 ${CAPS}`} style={{ borderColor: "var(--t-primary)", background: "var(--t-primary)", color: "var(--t-on-primary)" }}>Comprar</a>
            </div>
          </>
        ) : (
        <>
        {/* Um só botão de compra: barra fixa no celular, bloco centralizado no computador. */}
        <div className="max-sm:fixed max-sm:inset-x-0 max-sm:z-30 max-sm:flex max-sm:items-center max-sm:gap-3 max-sm:border-t max-sm:px-4 max-sm:py-2 sm:mt-8" style={{ bottom: "var(--demo-barra-baixo, 0px)", background: "var(--t-bg)", borderColor: "var(--t-line)" }}>
          <p className="min-w-0 flex-1 text-left text-xl tabular-nums sm:hidden" style={{ fontFamily: "var(--t-titulo)" }}>{brl(p.preco)}</p>
          <button type="button" data-acao="comprar" onClick={comprar} className={`inline-flex min-h-12 items-center justify-center gap-2 border px-10 ${CAPS} max-sm:shrink-0 sm:min-w-72`} style={{ borderColor: "var(--t-primary)", background: "var(--t-primary)", color: "var(--t-on-primary)" }}>
            {ok ? <><Check className="size-4" aria-hidden="true" /> Adicionada</> : "Adicionar ao carrinho"}
          </button>
        </div>
        <p className="mt-4"><a href={`${d.base}/carrinho`} className={`inline-flex min-h-11 items-center underline underline-offset-4 ${CAPS}`}>Ver carrinho</a></p>
        </>
        )}
        <p className="mt-2 text-sm" style={{ color: "var(--t-muted)" }}>Dia e horário de entrega escolhidos no pedido. Cartão de mensagem incluso.</p>
      </div>

      {itens.length ? (
        <section className="mx-auto mt-14 max-w-3xl" aria-labelledby="dentro">
          <Titulo id="dentro">O que vem na cesta</Titulo>
          <ul className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-x-10 sm:grid-cols-2">
            {itens.map((i) => <li key={i} className="min-w-0 border-b py-3 text-center" style={{ borderColor: "var(--t-line)" }}>{i}</li>)}
          </ul>
        </section>
      ) : null}

      <section className="mt-20" aria-labelledby="outras">
        <Titulo id="outras">Você também pode gostar</Titulo>
        <div className="mt-10 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
          {d.produtos.filter((x) => x.slug !== p.slug).slice(0, 4).map((x) => <Cartao key={x.slug} p={{ nome: x.nome, preco: x.preco, precoDe: x.precoDe, imagem: x.fotos[0] ?? "", serve: x.serve, href: x.href }} />)}
        </div>
      </section>

      {[
        ["Avaliações", encaixes?.avaliacoes],
        ["Quem comprou também levou", encaixes?.quemComprou],
        ["Embalagem e cartãozinho", encaixes?.extras],
        ["Vistos recentemente", encaixes?.vistos],
      ].map(([rotulo, no]) => (no ? <section key={rotulo as string} aria-label={rotulo as string} className="mt-20 min-w-0">{no as ReactNode}</section> : null))}
    </main>
  );
}

export function Carrinho({ d, conteudo }: { d: DadosLoja; conteudo?: ReactNode }) {
  const { itens, total } = useDemoCart();
  if (conteudo) {
    return (
      <main className={`${LARG} py-10 sm:py-14`}>
        <h1 className="text-center text-[clamp(2rem,5vw,3.5rem)] leading-tight" style={{ fontFamily: "var(--t-titulo)" }}>Carrinho</h1>
        <span className="mx-auto mt-5 block h-px w-20" style={{ background: "var(--t-primary)" }} />
        <div className="mx-auto mt-10 min-w-0 max-w-3xl">{conteudo}</div>
      </main>
    );
  }
  return (
    <main className={`${LARG} py-10 sm:py-14`}>
      <h1 className="text-center text-[clamp(2rem,5vw,3.5rem)] leading-tight" style={{ fontFamily: "var(--t-titulo)" }}>Carrinho</h1>
      <span className="mx-auto mt-5 block h-px w-20" style={{ background: "var(--t-primary)" }} />
      <div className="mx-auto mt-10 max-w-3xl">
        {itens.length === 0 ? (
          <CarrinhoVazio d={d} className="border border-dashed p-12 text-center" botao={`mt-6 inline-flex min-h-12 items-center border px-9 ${CAPS}`} />
        ) : (
          <>
            <ul className="border-t" style={{ borderColor: "var(--t-line)" }}>
              {itens.map((i) => (
                <li key={i.slug} className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-x-5 border-b py-5 sm:grid-cols-[104px_minmax(0,1fr)_auto]" style={{ borderColor: "var(--t-line)" }}>
                  <Foto src={i.foto} alt="" className="aspect-[4/5] w-full object-cover" />
                  <div className="min-w-0">
                    <p className="text-xl leading-tight" style={{ fontFamily: "var(--t-titulo)" }}>{i.nome}</p>
                    <p className="mt-1 text-sm tabular-nums" style={{ color: "var(--t-muted)" }}>{brl(i.preco)} cada</p>
                    <Quantidade slug={i.slug} nome={i.nome} qtd={i.qtd} redondo={false} className="mt-2" />
                  </div>
                  <p className="col-span-2 mt-2 text-right tabular-nums sm:col-span-1 sm:mt-0" style={{ fontFamily: "var(--t-titulo)", color: "var(--t-primary)" }}>{brl(i.preco * i.qtd)}</p>
                </li>
              ))}
            </ul>
            <section className="mt-10 text-center" aria-label="Resumo do pedido">
              <Titulo>Total</Titulo>
              <p className="mt-5 text-5xl tabular-nums" style={{ fontFamily: "var(--t-titulo)" }}>{brl(total)}</p>
              <p className="mt-2 text-sm" style={{ color: "var(--t-muted)" }}>Entrega e cartão de mensagem no pedido.</p>
              <AvisoSemCobranca d={d} className="mx-auto mt-6 max-w-md border p-4 text-sm" />
              <button type="button" aria-disabled={d.demo} className={`mt-6 inline-flex min-h-14 w-full max-w-md items-center justify-center border px-10 ${CAPS} aria-disabled:cursor-not-allowed`} style={{ borderColor: "var(--t-primary)", background: "var(--t-primary)", color: "var(--t-on-primary)" }}>{rotuloFinalizar(d)}</button>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
