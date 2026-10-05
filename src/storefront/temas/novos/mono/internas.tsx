"use client";

import { useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import { Foto, brl } from "../../kit";
import { useDemoCart } from "../../demo-cart";
import type { DadosLoja, ProdutoLoja } from "../../types";
import type { EncaixesCategoria, EncaixesProduto } from "../../encaixes";
import { AvisoSemCobranca, CaminhoPao, CarrinhoVazio, FAIXAS, NaoEncontrada, ORDENS, Quantidade, descontoPct, itensLimpos, rotuloFinalizar, useCompra, useLista } from "../../internas/comum";

/** MONO (internas) — categoria em linhas enormes (foto ao passar o mouse), cesta com tabela fina, carrinho tipográfico. */

const CAPS = "text-[11px] font-medium tracking-[0.16em] uppercase";
const GIGA = "uppercase font-bold leading-[0.86] tracking-[-0.045em] [overflow-wrap:anywhere] [text-wrap:balance]";
const pad = "px-4 sm:px-8";
const num = (n: number) => String(n + 1).padStart(2, "0");

/** Cartão do Mono (blocos da loja ao vivo): foto de canto reto, nome em caixa-alta e preço tabular. */
export function Cartao({ p }: { p: ProdutoLoja }) {
  return (
    <a href={p.href} className="group block min-w-0" style={{ background: "var(--t-bg)" }}>
      <div className="overflow-hidden border-b" style={{ borderColor: "var(--t-line)" }}>
        <Foto src={p.fotos[0]} alt={p.nome} className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
      </div>
      <div className="p-3">
        <p className="line-clamp-2 min-h-10 text-sm leading-snug font-medium uppercase">{p.nome}</p>
        <p className="mt-1 text-sm tabular-nums" style={{ color: "var(--t-muted)" }}>{brl(p.preco)}</p>
      </div>
    </a>
  );
}

function Texto({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={ativo} onClick={onClick} className={`min-h-11 ${CAPS}`} style={{ color: ativo ? "var(--t-fg)" : "var(--t-muted)", textDecoration: ativo ? "underline" : "none", textUnderlineOffset: 5, textDecorationThickness: 2 }}>{children}</button>
  );
}

export function Categoria({ d, slug, encaixes }: { d: DadosLoja; slug?: string; encaixes?: EncaixesCategoria }) {
  const { cat, titulo, lista, ordem, setOrdem, faixa, setFaixa } = useLista(d, slug);
  const [foco, setFoco] = useState<number | null>(null);
  const previa = foco !== null ? lista[foco] : undefined;
  return (
    <main className="py-8 sm:py-12">
      <div className={pad}>
        <CaminhoPao d={d} cat={cat ? { nome: cat.nome, href: cat.href } : undefined} />
        <h1 className={`mt-6 text-[clamp(2.7rem,12vw,12rem)] ${GIGA}`}>{titulo}</h1>
      </div>
      {encaixes?.filtrosExtras ? <div className={`mt-6 ${pad}`}>{encaixes.filtrosExtras}</div> : null}
      <div className={`mt-8 flex flex-col gap-1 border-y py-2 sm:flex-row sm:items-center sm:justify-between ${pad}`} style={{ borderColor: "var(--t-line)" }}>
        <div className="flex flex-wrap gap-x-5" role="group" aria-label="Faixa de preço">
          {FAIXAS.map(([k, l]) => <Texto key={k} ativo={faixa === k} onClick={() => setFaixa(k)}>{l}</Texto>)}
        </div>
        <div className="flex flex-wrap gap-x-5" role="group" aria-label="Ordenar">
          {ORDENS.map(([k, l]) => <Texto key={k} ativo={ordem === k} onClick={() => setOrdem(k)}>{l}</Texto>)}
        </div>
      </div>
      {lista.length ? (
        <ul onMouseLeave={() => setFoco(null)}>
          {lista.map((p, i) => (
            <li key={p.slug} className="border-b" style={{ borderColor: "var(--t-line)" }}>
              <a href={p.href} onMouseEnter={() => setFoco(i)} onFocus={() => setFoco(i)} onBlur={() => setFoco(null)} className={`group flex min-h-20 w-full items-center gap-3 py-3 sm:gap-6 ${pad}`}>
                <span className={`w-7 shrink-0 tabular-nums sm:w-10 ${CAPS}`} style={{ color: "var(--t-muted)" }}>{num(i)}</span>
                <Foto src={p.fotos[0]} alt="" className="size-16 shrink-0 object-cover lg:hidden" />
                <span className="min-w-0 flex-1 text-[clamp(1.25rem,5vw,4.5rem)] leading-[0.95] font-bold tracking-[-0.04em] [overflow-wrap:anywhere] uppercase transition-all duration-300 group-hover:translate-x-3 group-hover:text-[color:var(--t-accent)]">{p.nome}</span>
                <span className="shrink-0 text-sm font-medium tabular-nums sm:text-xl">{brl(p.preco)}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className={`mt-12 ${pad}`} style={{ color: "var(--t-muted)" }}>Nenhuma cesta nessa faixa. <button type="button" className="min-h-11 font-bold underline" onClick={() => setFaixa("")}>Ver todas</button></p>
      )}
      <p className={`mt-4 ${pad} ${CAPS}`} style={{ color: "var(--t-muted)" }} aria-live="polite">{lista.length} {lista.length === 1 ? "cesta" : "cestas"}</p>
      {encaixes?.rodape ? <div className={`mt-16 ${pad}`}>{encaixes.rodape}</div> : null}
      {previa ? (
        <div className="pointer-events-none fixed top-1/2 right-8 z-20 hidden w-72 -translate-y-1/2 border lg:block" style={{ borderColor: "var(--t-line)", background: "var(--t-bg)" }} aria-hidden="true">
          <Foto src={previa.fotos[0]} alt="" className="aspect-[4/5] w-full object-cover" />
        </div>
      ) : null}
    </main>
  );
}

function Linha({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-4 border-b py-3 text-sm" style={{ borderColor: "var(--t-line)" }}>
      <dt className={CAPS} style={{ color: "var(--t-muted)" }}>{rotulo}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

export function Produto({ d, slug, encaixes }: { d: DadosLoja; slug: string; encaixes?: EncaixesProduto }) {
  const p = d.produtos.find((x) => x.slug === slug);
  const { comprar, ok } = useCompra(p);
  if (!p) return <NaoEncontrada d={d} />;
  const cat = d.categorias.find((c) => c.slug === p.categoria);
  const itens = itensLimpos(p);
  const pct = descontoPct(p);
  const outras = d.produtos.filter((x) => x.slug !== p.slug).slice(0, 4);
  const fotos = p.fotos.length ? p.fotos : [""];
  return (
    <main className="pb-24 lg:pb-0">
      <div className="grid grid-cols-[minmax(0,1fr)] border-b lg:grid-cols-2" style={{ borderColor: "var(--t-line)" }}>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-px" style={{ background: "var(--t-line)" }}>
          {fotos.slice(0, 4).map((f, i) => (
            <Foto key={f + i} src={f} alt={i === 0 ? p.nome : ""} className={`w-full object-cover ${i === 0 ? "aspect-[4/5]" : "aspect-[4/3]"}`} />
          ))}
        </div>
        <div className="min-w-0 border-t lg:border-t-0 lg:border-l" style={{ borderColor: "var(--t-line)" }}>
          <div className="lg:sticky lg:top-0 lg:max-h-dvh lg:overflow-y-auto">
            <div className="px-4 pt-6 pb-8 sm:px-8">
              <CaminhoPao d={d} p={p} cat={cat ? { nome: cat.nome, href: cat.href } : undefined} />
              <h1 className={`mt-6 text-[clamp(2.2rem,6vw,5rem)] ${GIGA}`}>{p.nome}</h1>
              <p className="mt-6 text-4xl font-bold tracking-[-0.03em] tabular-nums">
                {p.precoDe ? <s className="mr-3 text-xl font-medium" style={{ color: "var(--t-muted)" }}>{brl(p.precoDe)}</s> : null}{brl(p.preco)}
                {pct ? <span className={`ml-3 align-middle ${CAPS}`} style={{ color: "var(--t-accent)" }}>-{pct}%</span> : null}
              </p>
              <dl className="mt-8 border-t" style={{ borderColor: "var(--t-line)" }}>
                {p.serve ? <Linha rotulo="Serve">{p.serve}</Linha> : null}
                {encaixes?.compra ? (
                  encaixes.entrega ? <Linha rotulo="Entrega">{encaixes.entrega}</Linha> : null
                ) : (
                  <>
                    <Linha rotulo="Entrega">Dia e horário escolhidos no pedido.</Linha>
                    <Linha rotulo="Cartão">Mensagem escrita por você, incluso.</Linha>
                  </>
                )}
                {itens.length ? (
                  <Linha rotulo="Itens">
                    <ol>{itens.map((i, n) => <li key={i} className="flex gap-3 py-0.5"><span className="w-6 shrink-0 tabular-nums" style={{ color: "var(--t-muted)" }}>{num(n)}</span><span className="min-w-0">{i}</span></li>)}</ol>
                  </Linha>
                ) : null}
              </dl>
              <p className="mt-6 leading-relaxed" style={{ color: "var(--t-muted)" }}>{p.descricao}</p>
              {encaixes?.compra ? (
                <div id="compra" className="mt-8 scroll-mt-6">{encaixes.compra}</div>
              ) : (
                <>
                  <button type="button" data-acao="comprar" onClick={comprar} className={`mt-8 inline-flex min-h-16 w-full items-center justify-center gap-2 border-2 text-sm font-bold tracking-[0.16em] uppercase`} style={{ background: "var(--t-primary)", color: "var(--t-on-primary)", borderColor: "var(--t-primary)" }}>
                    {ok ? <><Check className="size-4" aria-hidden="true" /> Adicionada</> : "Adicionar ao carrinho"}
                  </button>
                  <a href={`${d.base}/carrinho`} className={`mt-3 inline-flex min-h-12 w-full items-center justify-center border-2 ${CAPS}`} style={{ borderColor: "var(--t-line)" }}>Ver carrinho</a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {encaixes?.extras ? <section className={`pt-16 ${pad}`} aria-label="Embalagem e cartãozinho">{encaixes.extras}</section> : null}
      {encaixes?.avaliacoes ? <section className={`pt-16 ${pad}`} aria-label="Avaliações">{encaixes.avaliacoes}</section> : null}
      {encaixes?.quemComprou ? <section className={`pt-16 ${pad}`} aria-label="Quem comprou também levou">{encaixes.quemComprou}</section> : null}
      {outras.length ? (
        <section className={`pt-16 ${pad}`} aria-labelledby="mais">
          <h2 id="mais" className={`text-[clamp(2rem,7vw,6rem)] ${GIGA}`}>Mais cestas</h2>
          <div className="mt-6 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-px border-y sm:grid-cols-4" style={{ background: "var(--t-line)", borderColor: "var(--t-line)" }}>
            {outras.map((x, i) => (
              <a key={x.slug} href={x.href} className="group block min-w-0" style={{ background: "var(--t-bg)" }}>
                <div className="overflow-hidden"><Foto src={x.fotos[0]} alt={x.nome} className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105" /></div>
                <div className="p-3"><p className="text-4xl leading-none font-bold tracking-[-0.05em] tabular-nums">{num(i)}</p><p className="mt-2 line-clamp-2 text-sm font-medium uppercase">{x.nome}</p><p className="text-sm tabular-nums" style={{ color: "var(--t-muted)" }}>{brl(x.preco)}</p></div>
              </a>
            ))}
          </div>
        </section>
      ) : null}
      {encaixes?.vistos ? <section className={`pt-16 ${pad}`} aria-label="Vistos recentemente">{encaixes.vistos}</section> : null}
      <div className="fixed inset-x-0 z-30 flex items-center gap-3 border-t px-4 py-2 lg:hidden" style={{ bottom: "var(--demo-barra-baixo, 0px)", background: "var(--t-bg)", borderColor: "var(--t-line)" }}>
        <p className="min-w-0 flex-1 text-2xl font-bold tracking-[-0.03em] tabular-nums">{brl(p.preco)}</p>
        {encaixes?.compra ? (
          <a href="#compra" className={`inline-flex min-h-11 items-center px-6 ${CAPS}`} style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>Comprar</a>
        ) : (
          <button type="button" onClick={comprar} className={`min-h-11 px-6 ${CAPS}`} style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>{ok ? "Adicionada" : "Adicionar"}</button>
        )}
      </div>
    </main>
  );
}

export function Carrinho({ d, conteudo }: { d: DadosLoja; conteudo?: ReactNode }) {
  const { itens, total } = useDemoCart();
  return (
    <main className="py-8 sm:py-12">
      <div className={pad}>
        <h1 className={`text-[clamp(2.7rem,12vw,12rem)] ${GIGA}`}>Carrinho</h1>
      </div>
      {conteudo ? (
        <div className={`mt-10 min-w-0 ${pad}`}>{conteudo}</div>
      ) : itens.length === 0 ? (
        <div className={`mt-10 ${pad}`}>
          <CarrinhoVazio d={d} className="border-y py-16" botao="mt-6 inline-flex min-h-12 items-center border-2 px-8 text-sm font-bold tracking-[0.16em] uppercase" />
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-[minmax(0,1fr)] border-y lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]" style={{ borderColor: "var(--t-line)" }}>
          <ul className="min-w-0">
            {itens.map((i, n) => (
              <li key={i.slug} className={`flex gap-3 border-b py-5 sm:gap-6 ${pad}`} style={{ borderColor: "var(--t-line)" }}>
                <span className={`w-7 shrink-0 tabular-nums sm:w-10 ${CAPS}`} style={{ color: "var(--t-muted)" }}>{num(n)}</span>
                <Foto src={i.foto} alt="" className="size-20 shrink-0 object-cover sm:size-28" />
                <div className="min-w-0 flex-1">
                  <p className="text-xl leading-[0.95] font-bold tracking-[-0.03em] [overflow-wrap:anywhere] uppercase sm:text-3xl">{i.nome}</p>
                  <p className="mt-1 text-sm tabular-nums" style={{ color: "var(--t-muted)" }}>{brl(i.preco)} cada</p>
                  <Quantidade slug={i.slug} nome={i.nome} qtd={i.qtd} redondo={false} className="mt-3" />
                </div>
                <p className="shrink-0 text-lg font-bold tabular-nums sm:text-2xl">{brl(i.preco * i.qtd)}</p>
              </li>
            ))}
          </ul>
          <aside className="min-w-0 border-t p-5 sm:p-8 lg:border-t-0 lg:border-l" style={{ borderColor: "var(--t-line)" }}>
            <p className={CAPS} style={{ color: "var(--t-muted)" }}>Total</p>
            <p className="mt-2 text-[clamp(2.4rem,6vw,4.5rem)] leading-none font-bold tracking-[-0.045em] tabular-nums">{brl(total)}</p>
            <p className="mt-4 text-sm" style={{ color: "var(--t-muted)" }}>Entrega e cartão de mensagem definidos no pedido.</p>
            <AvisoSemCobranca d={d} className="mt-4 border p-3 text-sm" />
            <button type="button" aria-disabled={d.demo} className="mt-6 inline-flex min-h-16 w-full items-center justify-center border-2 text-sm font-bold tracking-[0.16em] uppercase aria-disabled:cursor-not-allowed" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)", borderColor: "var(--t-primary)" }}>{rotuloFinalizar(d)}</button>
            <a href={`${d.base}/categoria`} className={`mt-3 inline-flex min-h-12 w-full items-center justify-center border-2 ${CAPS}`} style={{ borderColor: "var(--t-line)" }}>Continuar escolhendo</a>
          </aside>
        </div>
      )}
    </main>
  );
}
