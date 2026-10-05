"use client";

import { useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import { Foto, brl } from "../../kit";
import { useDemoCart } from "../../demo-cart";
import type { DadosLoja, ProdutoLoja } from "../../types";
import { AvisoSemCobranca, CaminhoPao, CarrinhoVazio, FAIXAS, NaoEncontrada, ORDENS, Quantidade, descontoPct, itensLimpos, rotuloFinalizar, useCompra, useLista } from "../../internas/comum";

/** GALERIA (internas) — categoria em 2 colunas desiguais, cesta com miniaturas e zoom, carrinho em linhas finas. */

const CAPS = "text-[11px] tracking-[0.28em] uppercase";
const wrapG = "mx-auto w-full max-w-[1500px] px-5 sm:px-10";
const num = (n: number) => String(n + 1).padStart(2, "0");
const ASP_ESQ = ["aspect-[4/5]", "aspect-square", "aspect-[3/4]"];
const ASP_DIR = ["aspect-[3/4]", "aspect-[4/5]", "aspect-[3/4]"];

function Peca({ p, n, asp }: { p: ProdutoLoja; n: number; asp: string }) {
  return (
    <a href={p.href} className="group block min-w-0">
      <div className="overflow-hidden border" style={{ borderColor: "var(--t-line)" }}>
        <Foto src={p.fotos[0]} alt={p.nome} className={`${asp} w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]`} />
      </div>
      <div className="mt-3 flex items-baseline gap-3">
        <span className={CAPS} style={{ color: "var(--t-accent)" }}>N° {num(n)}</span>
        <span className="min-w-0 flex-1 truncate text-sm">{p.nome}</span>
      </div>
      <p className="mt-0.5 text-sm tabular-nums" style={{ color: "var(--t-muted)" }}>{brl(p.preco)}</p>
    </a>
  );
}

function Texto({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={ativo} onClick={onClick} className={`min-h-11 ${CAPS}`} style={{ color: ativo ? "var(--t-fg)" : "var(--t-muted)", textDecoration: ativo ? "underline" : "none", textUnderlineOffset: 6 }}>{children}</button>
  );
}

export function Categoria({ d, slug }: { d: DadosLoja; slug?: string }) {
  const { cat, titulo, lista, ordem, setOrdem, faixa, setFaixa } = useLista(d, slug);
  const esq = lista.filter((_, i) => i % 2 === 0);
  const dir = lista.filter((_, i) => i % 2 === 1);
  return (
    <main className={`${wrapG} py-10 sm:py-16`}>
      <CaminhoPao d={d} cat={cat ? { nome: cat.nome, href: cat.href } : undefined} />
      <h1 className="mt-8 text-5xl leading-none sm:text-8xl" style={{ fontFamily: "var(--t-titulo)" }}>{titulo}</h1>
      <div className="mt-10 flex flex-col gap-1 border-y py-2 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--t-line)" }}>
        <div className="flex flex-wrap gap-x-6" role="group" aria-label="Faixa de preço">
          {FAIXAS.map(([k, l]) => <Texto key={k} ativo={faixa === k} onClick={() => setFaixa(k)}>{l}</Texto>)}
        </div>
        <div className="flex flex-wrap gap-x-6" role="group" aria-label="Ordenar">
          {ORDENS.map(([k, l]) => <Texto key={k} ativo={ordem === k} onClick={() => setOrdem(k)}>{l}</Texto>)}
        </div>
      </div>
      <p className={`mt-4 ${CAPS}`} style={{ color: "var(--t-muted)" }} aria-live="polite">{lista.length} {lista.length === 1 ? "peça" : "peças"}</p>
      {lista.length ? (
        <div className="mt-10 grid grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-x-4 sm:gap-x-12">
          <div className="flex min-w-0 flex-col gap-12 sm:gap-20">
            {esq.map((p, i) => <Peca key={p.slug} p={p} n={i * 2} asp={ASP_ESQ[i % ASP_ESQ.length]} />)}
          </div>
          <div className="mt-16 flex min-w-0 flex-col gap-12 sm:mt-40 sm:gap-20">
            {dir.map((p, i) => <Peca key={p.slug} p={p} n={i * 2 + 1} asp={ASP_DIR[i % ASP_DIR.length]} />)}
          </div>
        </div>
      ) : (
        <p className="mt-16 text-center" style={{ color: "var(--t-muted)" }}>Nenhuma peça nessa faixa. <button type="button" className="min-h-11 underline" onClick={() => setFaixa("")}>Ver todas</button></p>
      )}
    </main>
  );
}

function Visor({ p }: { p: ProdutoLoja }) {
  const [atual, setAtual] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const fotos = p.fotos.length ? p.fotos : [""];
  return (
    <div className="flex min-w-0 flex-col gap-3 lg:flex-row-reverse lg:gap-4">
      <div
        className="min-w-0 flex-1 overflow-hidden border"
        style={{ borderColor: "var(--t-line)", cursor: zoom ? "zoom-in" : "default" }}
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse") return;
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onPointerLeave={() => setZoom(null)}
      >
        <Foto
          src={fotos[atual] ?? fotos[0]}
          alt={p.nome}
          className="aspect-[4/5] w-full object-cover transition-transform duration-500 ease-out"
          style={{ transform: zoom ? "scale(1.7)" : "scale(1)", transformOrigin: zoom ? `${zoom.x}% ${zoom.y}%` : "50% 50%" }}
        />
      </div>
      {fotos.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto lg:max-h-[640px] lg:w-20 lg:shrink-0 lg:flex-col lg:overflow-x-visible lg:overflow-y-auto" role="group" aria-label="Fotos da cesta">
          {fotos.map((f, i) => (
            <button key={f + i} type="button" aria-label={`Ver foto ${i + 1}`} aria-pressed={atual === i} onClick={() => setAtual(i)} className="size-16 shrink-0 overflow-hidden border lg:h-24 lg:w-20" style={{ borderColor: atual === i ? "var(--t-fg)" : "var(--t-line)", opacity: atual === i ? 1 : 0.7 }}>
              <Foto src={f} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function Produto({ d, slug }: { d: DadosLoja; slug: string }) {
  const p = d.produtos.find((x) => x.slug === slug);
  const { comprar, ok } = useCompra(p);
  if (!p) return <NaoEncontrada d={d} />;
  const cat = d.categorias.find((c) => c.slug === p.categoria);
  const itens = itensLimpos(p);
  const pct = descontoPct(p);
  const outras = d.produtos.filter((x) => x.slug !== p.slug).slice(0, 3);
  return (
    <main className={`${wrapG} py-8 pb-28 sm:py-14 lg:pb-14`}>
      <CaminhoPao d={d} p={p} cat={cat ? { nome: cat.nome, href: cat.href } : undefined} />
      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-20">
        <Visor key={p.slug} p={p} />
        <div className="min-w-0 lg:pt-6">
          <p className={CAPS} style={{ color: "var(--t-accent)" }}>{cat?.nome ?? "Peça única"}</p>
          <h1 className="mt-4 text-4xl leading-[1.08] sm:text-6xl" style={{ fontFamily: "var(--t-titulo)" }}>{p.nome}</h1>
          <p className="mt-6 text-2xl font-light tabular-nums">
            {p.precoDe ? <s className="mr-3 text-base" style={{ color: "var(--t-muted)" }}>{brl(p.precoDe)}</s> : null}{brl(p.preco)}
            {pct ? <span className={`ml-3 align-middle ${CAPS}`} style={{ color: "var(--t-accent)" }}>-{pct}%</span> : null}
          </p>
          {p.serve ? <p className={`mt-2 ${CAPS}`} style={{ color: "var(--t-muted)" }}>{p.serve}</p> : null}
          <p className="mt-8 max-w-lg leading-[1.95]" style={{ color: "var(--t-muted)" }}>{p.descricao}</p>
          {itens.length ? (
            <section className="mt-10 max-w-lg" aria-labelledby="na-cesta">
              <h2 id="na-cesta" className={CAPS}>Na cesta</h2>
              <ul className="mt-3 border-t" style={{ borderColor: "var(--t-line)" }}>
                {itens.map((i, n) => (
                  <li key={i} className="flex min-w-0 gap-4 border-b py-3 text-sm" style={{ borderColor: "var(--t-line)" }}>
                    <span className={`w-6 shrink-0 ${CAPS}`} style={{ color: "var(--t-accent)" }}>{num(n)}</span>
                    <span className="min-w-0">{i}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <button type="button" data-acao="comprar" onClick={comprar} className={`mt-10 inline-flex min-h-14 w-full max-w-lg items-center justify-center gap-2 border ${CAPS}`} style={{ background: "var(--t-primary)", color: "var(--t-on-primary)", borderColor: "var(--t-primary)" }}>
            {ok ? <><Check className="size-4" aria-hidden="true" /> Adicionada</> : "Adicionar ao carrinho"}
          </button>
          <a href={`${d.base}/carrinho`} className={`mt-3 inline-flex min-h-12 w-full max-w-lg items-center justify-center border ${CAPS}`} style={{ borderColor: "var(--t-line)" }}>Ver carrinho</a>
          <p className="mt-5 max-w-lg text-sm leading-relaxed" style={{ color: "var(--t-muted)" }}>Dia e horário de entrega escolhidos no pedido. Cartão de mensagem incluso.</p>
        </div>
      </div>
      {outras.length ? (
        <section className="mt-24" aria-labelledby="mais">
          <h2 id="mais" className={`border-b pb-4 ${CAPS}`} style={{ borderColor: "var(--t-line)" }}>Outras peças</h2>
          <div className="mt-8 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-8">
            {outras.map((x, i) => <Peca key={x.slug} p={x} n={i} asp="aspect-[4/5]" />)}
          </div>
        </section>
      ) : null}
      <div className="fixed inset-x-0 z-30 flex items-center gap-3 border-t px-4 py-2 lg:hidden" style={{ bottom: "var(--demo-barra-baixo, 0px)", background: "var(--t-bg)", borderColor: "var(--t-line)" }}>
        <p className="min-w-0 flex-1 text-lg tabular-nums">{brl(p.preco)}</p>
        <button type="button" onClick={comprar} className={`min-h-11 border px-6 ${CAPS}`} style={{ background: "var(--t-primary)", color: "var(--t-on-primary)", borderColor: "var(--t-primary)" }}>{ok ? "Adicionada" : "Adicionar"}</button>
      </div>
    </main>
  );
}

export function Carrinho({ d }: { d: DadosLoja }) {
  const { itens, total } = useDemoCart();
  return (
    <main className={`${wrapG} py-10 sm:py-16`}>
      <p className={CAPS} style={{ color: "var(--t-muted)" }}>Carrinho</p>
      <h1 className="mt-4 text-5xl leading-none sm:text-7xl" style={{ fontFamily: "var(--t-titulo)" }}>Sua seleção</h1>
      {itens.length === 0 ? (
        <CarrinhoVazio d={d} className="mt-12 border-y py-16 text-center" botao={`mt-6 inline-flex min-h-12 items-center border px-8 ${CAPS}`} />
      ) : (
        <div className="mt-12 grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-20">
          <ul className="border-t" style={{ borderColor: "var(--t-line)" }}>
            {itens.map((i) => (
              <li key={i.slug} className="flex gap-4 border-b py-6 sm:gap-6" style={{ borderColor: "var(--t-line)" }}>
                <Foto src={i.foto} alt={i.nome} className="aspect-[4/5] w-24 shrink-0 object-cover sm:w-32" />
                <div className="min-w-0 flex-1">
                  <p className="text-xl leading-snug sm:text-2xl" style={{ fontFamily: "var(--t-titulo)" }}>{i.nome}</p>
                  <p className="mt-1 text-sm tabular-nums" style={{ color: "var(--t-muted)" }}>{brl(i.preco)} cada</p>
                  <Quantidade slug={i.slug} nome={i.nome} qtd={i.qtd} redondo={false} className="mt-3" />
                </div>
                <p className="shrink-0 tabular-nums">{brl(i.preco * i.qtd)}</p>
              </li>
            ))}
          </ul>
          <aside className="h-fit min-w-0 border p-6 sm:p-8" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>
            <p className={CAPS} style={{ color: "var(--t-muted)" }}>Total</p>
            <p className="mt-3 text-5xl tabular-nums" style={{ fontFamily: "var(--t-titulo)" }}>{brl(total)}</p>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--t-muted)" }}>Entrega e cartão de mensagem definidos no pedido.</p>
            <AvisoSemCobranca d={d} className="mt-5 border p-3 text-sm" />
            <button type="button" aria-disabled={d.demo} className={`mt-6 inline-flex min-h-14 w-full items-center justify-center border ${CAPS} aria-disabled:cursor-not-allowed`} style={{ background: "var(--t-primary)", color: "var(--t-on-primary)", borderColor: "var(--t-primary)" }}>{rotuloFinalizar(d)}</button>
            <a href={`${d.base}/categoria`} className={`mt-3 inline-flex min-h-12 w-full items-center justify-center border ${CAPS}`} style={{ borderColor: "var(--t-line)" }}>Continuar escolhendo</a>
          </aside>
        </div>
      )}
    </main>
  );
}
