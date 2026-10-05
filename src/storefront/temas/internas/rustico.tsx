"use client";

import { Check } from "lucide-react";
import { Foto, brl } from "../kit";
import { useDemoCart } from "../demo-cart";
import type { DadosLoja, ProdutoLoja } from "../types";
import { AvisoSemCobranca, CaminhoPao, CarrinhoVazio, FAIXAS, NaoEncontrada, ORDENS, Quantidade, itensLimpos, rotuloFinalizar, useCompra, useLista, wrap, type Ordem } from "./comum";

/** RÚSTICO — papel kraft, polaroids inclinadas, títulos e bilhetes escritos à mão, carrinho em forma de nota. */

const PAPEL = {
  backgroundImage:
    "radial-gradient(color-mix(in srgb, var(--t-fg) 7%, transparent) 1px, transparent 1px), radial-gradient(color-mix(in srgb, var(--t-fg) 5%, transparent) 1px, transparent 1px)",
  backgroundSize: "18px 18px, 27px 27px",
  backgroundPosition: "0 0, 9px 13px",
};
const MAO = { fontFamily: "var(--t-detalhe)" } as const;
const SOMBRA = "shadow-[0_12px_28px_-16px_rgba(60,40,20,.55)]";

function Cartao({ p, i }: { p: ProdutoLoja; i: number }) {
  return (
    <a href={p.href} className={`block min-w-0 bg-white p-2.5 pb-4 ${SOMBRA} ${i % 2 ? "rotate-[1.4deg]" : "-rotate-[1.4deg]"} transition-transform hover:rotate-0`}>
      <Foto src={p.fotos[0]} alt={p.nome} className="aspect-square w-full object-cover" />
      <p className="mt-3 line-clamp-2 text-center text-2xl leading-none" style={MAO}>{p.nome}</p>
      <p className="mt-1 text-center font-semibold" style={{ fontFamily: "var(--t-titulo)", color: "var(--t-accent)" }}>{brl(p.preco)}</p>
    </a>
  );
}

export function CategoriaRustico({ d, slug }: { d: DadosLoja; slug?: string }) {
  const { cat, titulo, lista, ordem, setOrdem, faixa, setFaixa } = useLista(d, slug);
  return (
    <div style={PAPEL}>
      <main className={`${wrap} py-10 sm:py-14`}>
        <CaminhoPao d={d} cat={cat ? { nome: cat.nome, href: cat.href } : undefined} />
        <h1 className="mt-3 text-5xl sm:text-7xl" style={{ ...MAO, color: "var(--t-primary)" }}>{titulo}</h1>
        <div className="mt-6 flex flex-wrap items-center gap-2" role="group" aria-label="Faixa de preço">
          {FAIXAS.map(([k, l]) => (
            <button key={k} type="button" aria-pressed={faixa === k} onClick={() => setFaixa(k)} className="min-h-11 rounded-r-full border border-dashed px-5 text-xl" style={{ ...MAO, borderColor: "var(--t-fg)", background: faixa === k ? "#fff8c7" : "transparent" }}>{l}</button>
          ))}
          <label className="ml-auto flex items-center gap-2 text-xl" style={MAO}>Ordenar
            <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} className="h-11 border border-dashed bg-transparent px-2 text-base" style={{ borderColor: "var(--t-fg)", fontFamily: "var(--t-texto)" }}>
              {ORDENS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
        </div>
        <p className="mt-3 text-lg" style={{ ...MAO, color: "var(--t-muted)" }} aria-live="polite">{lista.length} {lista.length === 1 ? "cesta" : "cestas"} feitas à mão</p>
        {lista.length ? (
          <div className="mt-8 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-5 gap-y-10 px-1 sm:gap-x-8 lg:grid-cols-3 xl:grid-cols-4">
            {lista.map((p, i) => <Cartao key={p.slug} p={p} i={i} />)}
          </div>
        ) : (
          <p className="mt-10 border border-dashed p-8 text-center text-xl" style={{ ...MAO, borderColor: "var(--t-fg)" }}>Nada nessa faixa. <button type="button" className="underline" onClick={() => setFaixa("")}>Ver todas</button></p>
        )}
      </main>
    </div>
  );
}

export function ProdutoRustico({ d, slug }: { d: DadosLoja; slug: string }) {
  const p = d.produtos.find((x) => x.slug === slug);
  const { comprar, ok } = useCompra(p);
  if (!p) return <NaoEncontrada d={d} />;
  const cat = d.categorias.find((c) => c.slug === p.categoria);
  const itens = itensLimpos(p);
  return (
    <div style={PAPEL}>
      <main className={`${wrap} py-10 sm:py-14`}>
        <CaminhoPao d={d} p={p} cat={cat ? { nome: cat.nome, href: cat.href } : undefined} />
        <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="min-w-0">
            <div className={`relative mx-auto max-w-xl -rotate-1 bg-white p-3 pb-16 ${SOMBRA}`}>
              <Foto src={p.fotos[0]} alt={p.nome} className="aspect-square w-full object-cover" />
              <p className="absolute right-3 bottom-3 left-3 text-center text-3xl leading-none" style={MAO}>{p.nome}</p>
            </div>
            {p.fotos.length > 1 ? (
              <div className="mx-auto mt-6 grid max-w-xl grid-cols-3 gap-4">
                {p.fotos.slice(1, 4).map((f, i) => <div key={f} className={`bg-white p-1.5 pb-4 ${SOMBRA} ${i % 2 ? "rotate-2" : "-rotate-2"}`}><Foto src={f} alt="" className="aspect-square w-full object-cover" /></div>)}
              </div>
            ) : null}
          </div>
          <div className="min-w-0">
            <h1 className="text-4xl leading-tight sm:text-5xl" style={{ fontFamily: "var(--t-titulo)", fontWeight: 600 }}>{p.nome}</h1>
            {p.serve ? <p className="mt-1 text-xl" style={{ ...MAO, color: "var(--t-muted)" }}>{p.serve}</p> : null}
            <p className="mt-4 text-3xl font-semibold" style={{ fontFamily: "var(--t-titulo)", color: "var(--t-accent)" }}>{p.precoDe ? <s className="mr-3 text-lg" style={{ color: "var(--t-muted)" }}>{brl(p.precoDe)}</s> : null}{brl(p.preco)}</p>
            <div className="mt-5 rotate-1 p-5 text-2xl leading-snug shadow-sm" style={{ background: "#fff8c7", color: "#3a2f1d", ...MAO }}>{p.descricao}</div>
            {itens.length ? (
              <section className="mt-7" aria-labelledby="o-que-vem">
                <h2 id="o-que-vem" className="text-3xl" style={{ ...MAO, color: "var(--t-primary)" }}>O que vai na cesta</h2>
                <ul className="mt-2 grid grid-cols-[minmax(0,1fr)] gap-x-6 sm:grid-cols-2">
                  {itens.map((i) => <li key={i} className="flex min-w-0 items-baseline gap-2 border-b border-dashed py-2" style={{ borderColor: "var(--t-line)" }}><Check className="size-4 shrink-0 translate-y-0.5" style={{ color: "var(--t-primary)" }} /><span className="min-w-0">{i}</span></li>)}
                </ul>
              </section>
            ) : null}
            <button type="button" data-acao="comprar" onClick={comprar} className="mt-8 inline-flex min-h-14 w-full items-center justify-center gap-2 border-2 border-dashed text-2xl" style={{ ...MAO, borderColor: "var(--t-primary)", background: "var(--t-primary)", color: "var(--t-on-primary)" }}>
              {ok ? <><Check className="size-5" /> Na sacola!</> : "Colocar na sacola"}
            </button>
            <a href={`${d.base}/carrinho`} className="mt-3 flex min-h-12 w-full items-center justify-center border-2 border-dashed text-xl" style={{ ...MAO, borderColor: "var(--t-fg)" }}>Ver minha sacola</a>
            <p className="mt-3 text-lg" style={{ ...MAO, color: "var(--t-muted)" }}>Você escolhe o dia e o horário no pedido, e escreve o bilhete.</p>
          </div>
        </div>
        <section className="mt-16" aria-labelledby="outras">
          <h2 id="outras" className="text-4xl" style={{ ...MAO, color: "var(--t-primary)" }}>Outras da casa</h2>
          <div className="mt-6 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-5 gap-y-10 px-1 sm:grid-cols-4 sm:gap-x-8">
            {d.produtos.filter((x) => x.slug !== p.slug).slice(0, 4).map((x, i) => <Cartao key={x.slug} p={x} i={i} />)}
          </div>
        </section>
      </main>
      <div className="fixed inset-x-0 z-30 flex items-center gap-3 border-t-2 border-dashed px-4 py-2 lg:hidden" style={{ bottom: "var(--demo-barra-baixo, 0px)", background: "#fff8c7", borderColor: "var(--t-fg)", color: "#3a2f1d" }}>
        <p className="min-w-0 flex-1 text-xl font-semibold" style={{ fontFamily: "var(--t-titulo)" }}>{brl(p.preco)}</p>
        <button type="button" onClick={comprar} className="min-h-11 border-2 border-dashed px-6 text-xl" style={{ ...MAO, borderColor: "var(--t-primary)", background: "var(--t-primary)", color: "var(--t-on-primary)" }}>{ok ? "Na sacola!" : "Quero"}</button>
      </div>
    </div>
  );
}

export function CarrinhoRustico({ d }: { d: DadosLoja }) {
  const { itens, total } = useDemoCart();
  return (
    <div style={PAPEL}>
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className={`bg-white px-5 py-8 sm:px-10 ${SOMBRA}`}>
          <h1 className="text-center text-5xl" style={{ ...MAO, color: "var(--t-primary)" }}>Minha sacola</h1>
          <p className="text-center text-lg" style={{ ...MAO, color: "var(--t-muted)" }}>{d.loja}</p>
          {itens.length === 0 ? <CarrinhoVazio d={d} className="mt-8 border-y border-dashed py-10 text-center" botao="mt-4 inline-flex min-h-12 items-center px-8 text-2xl" /> : (
            <>
              <ul className="mt-6 border-t-2 border-dashed" style={{ borderColor: "var(--t-fg)" }}>
                {itens.map((i) => (
                  <li key={i.slug} className="flex gap-4 border-b border-dashed py-4" style={{ borderColor: "var(--t-line)" }}>
                    <Foto src={i.foto} alt="" className="size-20 shrink-0 object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-2xl leading-none" style={MAO}>{i.nome}</p>
                      <p className="text-sm" style={{ color: "var(--t-muted)" }}>{brl(i.preco)} cada</p>
                      <Quantidade slug={i.slug} nome={i.nome} qtd={i.qtd} redondo={false} className="mt-1" />
                    </div>
                    <p className="shrink-0 font-semibold">{brl(i.preco * i.qtd)}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-5 flex items-baseline justify-between text-3xl" style={MAO}><span>Total</span><span className="underline decoration-wavy underline-offset-4">{brl(total)}</span></p>
              <p className="mt-1 text-lg" style={{ ...MAO, color: "var(--t-muted)" }}>Dia, horário e bilhete: você escolhe no pedido.</p>
              <AvisoSemCobranca d={d} className="mt-5 border border-dashed p-3 text-sm" />
              <button type="button" aria-disabled={d.demo} className="mt-6 inline-flex min-h-14 w-full items-center justify-center border-2 border-dashed text-2xl aria-disabled:cursor-not-allowed" style={{ ...MAO, borderColor: "var(--t-primary)", background: "var(--t-primary)", color: "var(--t-on-primary)" }}>{rotuloFinalizar(d)}</button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
