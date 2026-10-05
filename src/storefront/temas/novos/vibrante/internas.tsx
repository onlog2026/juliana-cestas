"use client";

import { useState, type ReactNode } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { Foto, brl } from "../../kit";
import { useDemoCart, useDemoCartOptional } from "../../demo-cart";
import type { DadosLoja, ProdutoLoja } from "../../types";
import type { EncaixesCategoria, EncaixesProduto } from "../../encaixes";
import { AvisoSemCobranca, CaminhoPao, CarrinhoVazio, FAIXAS, NaoEncontrada, ORDENS, Quantidade, descontoPct, itensLimpos, rotuloFinalizar, useLista, wrap, type Ordem } from "../../internas/comum";
import { GIGANTE, PILULA, blocoEstilo } from "./pecas";

/* VIBRANTE — páginas internas: categoria em blocos coloridos alternando, cesta com fundo de cor (varia por produto) e preço em selo, carrinho em blocos. */

/** Adicionar ao carrinho de demonstração; fora do carrinho de demonstração (loja ao vivo) não faz nada. */
function useCompraSegura(p: ProdutoLoja | undefined) {
  const c = useDemoCartOptional();
  const [ok, setOk] = useState(false);
  function comprar() {
    if (!p || !c) return;
    c.adicionar({ slug: p.slug, nome: p.nome, preco: p.preco, foto: p.fotos[0] });
    setOk(true);
    window.setTimeout(() => setOk(false), 2000);
  }
  return { comprar, ok, temCarrinho: Boolean(c) };
}

/** Bloco colorido do cartão (sem botão de demonstração). A cor do texto vem do próprio bloco (`blocoEstilo`). */
function CartaoBloco({ p, i }: { p: ProdutoLoja; i: number }) {
  const off = descontoPct(p);
  return (
    <a href={p.href} className="group block h-full min-w-0">
      <div className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border-[3px] p-3 sm:p-4" style={{ ...blocoEstilo(i), borderColor: "var(--t-fg)" }}>
        <div className="relative overflow-hidden rounded-t-full rounded-b-2xl border-[3px]" style={{ borderColor: "var(--t-fg)", background: "var(--t-bg)" }}>
          <Foto src={p.fotos[0]} alt={p.nome} className="aspect-[4/5] w-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105" />
        </div>
        <p className="mt-3 line-clamp-2 min-h-[2.6em] text-base leading-tight font-extrabold [overflow-wrap:anywhere] sm:text-xl" style={{ fontFamily: "var(--t-titulo)" }}>{p.nome}</p>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="inline-block rounded-full px-3 py-1 text-base font-bold tabular-nums sm:text-lg" style={{ background: "var(--t-fg)", color: "var(--t-bg)" }}>{brl(p.preco)}</span>
          {p.precoDe ? <s className="text-xs tabular-nums">{brl(p.precoDe)}</s> : null}
          {off ? <span className="text-xs font-bold">-{off}%</span> : null}
        </p>
      </div>
    </a>
  );
}

/** Cartão do modelo para os blocos reais da loja ao vivo: a cor do bloco varia por cesta (pelo slug). */
export function Cartao({ p }: { p: ProdutoLoja }) {
  let h = 0;
  for (let k = 0; k < p.slug.length; k++) h = (h * 31 + p.slug.charCodeAt(k)) % 997;
  return <CartaoBloco p={p} i={h} />;
}

function CartaoComBotao({ p, i }: { p: ProdutoLoja; i: number }) {
  const { comprar, ok, temCarrinho } = useCompraSegura(p);
  if (!temCarrinho) return <CartaoBloco p={p} i={i} />;
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex-1"><CartaoBloco p={p} i={i} /></div>
      <button type="button" onClick={comprar} className={`${PILULA} min-h-11 w-full text-sm`} style={{ borderColor: "var(--t-fg)", background: "var(--t-bg)", color: "var(--t-fg)" }}>
        {ok ? <><Check className="size-4" aria-hidden="true" /> Adicionada</> : <><ShoppingBag className="size-4" aria-hidden="true" /> Adicionar</>}
      </button>
    </div>
  );
}

export function Categoria({ d, slug, encaixes }: { d: DadosLoja; slug?: string; encaixes?: EncaixesCategoria }) {
  const { cat, titulo, lista, ordem, setOrdem, faixa, setFaixa } = useLista(d, slug);
  const idx = Math.max(d.categorias.findIndex((c) => c.slug === slug), 0);
  return (
    <main>
      <section style={blocoEstilo(idx)}>
        <div className={`${wrap} py-10 sm:py-14`}>
          <div className="text-sm [&_a]:underline [&_a]:underline-offset-4 [&_span]:![color:inherit] [&_nav]:![color:inherit]">
            <CaminhoPao d={d} cat={cat ? { nome: cat.nome, href: cat.href } : undefined} />
          </div>
          <h1 className={`mt-3 text-[clamp(2.1rem,8vw,6rem)] font-extrabold ${GIGANTE}`} style={{ fontFamily: "var(--t-titulo)" }}>{titulo}</h1>
        </div>
      </section>

      <div className={`${wrap} py-6`}>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Categorias">
          <a href={`${d.base}/categoria`} className="flex min-h-11 shrink-0 items-center rounded-full border-[3px] px-5 text-sm font-bold" style={{ borderColor: "var(--t-fg)", background: slug ? "transparent" : "var(--t-fg)", color: slug ? "var(--t-fg)" : "var(--t-bg)" }}>Todas</a>
          {d.categorias.map((c) => (
            <a key={c.slug} href={c.href} className="flex min-h-11 shrink-0 items-center rounded-full border-[3px] px-5 text-sm font-bold whitespace-nowrap" style={{ borderColor: "var(--t-fg)", background: c.slug === slug ? "var(--t-fg)" : "transparent", color: c.slug === slug ? "var(--t-bg)" : "var(--t-fg)" }}>{c.nome}</a>
          ))}
        </div>
        {encaixes?.filtrosExtras ? <div className="mt-3 min-w-0" style={{ color: "var(--t-fg)" }}>{encaixes.filtrosExtras}</div> : null}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Faixa de preço">
            {FAIXAS.map(([k, l]) => (
              <button key={k} type="button" aria-pressed={faixa === k} onClick={() => setFaixa(k)} className="min-h-11 rounded-full border-2 px-4 text-sm font-semibold" style={{ borderColor: "var(--t-fg)", background: faixa === k ? "var(--t-primary)" : "transparent", color: faixa === k ? "var(--t-on-primary)" : "var(--t-fg)" }}>{l}</button>
            ))}
          </div>
          <label className="ml-auto flex items-center gap-2 text-sm font-semibold">
            Ordenar
            <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} className="h-11 rounded-full border-2 px-3" style={{ borderColor: "var(--t-fg)", background: "var(--t-bg)", color: "var(--t-fg)" }}>
              {ORDENS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
        </div>
        <p className="mt-4 text-sm" style={{ color: "var(--t-muted)" }} aria-live="polite">{lista.length} {lista.length === 1 ? "cesta" : "cestas"}</p>

        {lista.length ? (
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 sm:gap-5 lg:grid-cols-4">
            {lista.map((p, i) => <CartaoComBotao key={p.slug} p={p} i={i} />)}
          </div>
        ) : (
          <p className="mt-6 rounded-[1.75rem] border-[3px] border-dashed p-8 text-center" style={{ borderColor: "var(--t-fg)" }}>Nenhuma cesta nessa faixa. <button type="button" className="min-h-11 font-bold underline" onClick={() => setFaixa("")}>Limpar filtro</button></p>
        )}
        {encaixes?.rodape ? <div className="mt-10 min-w-0" style={{ color: "var(--t-fg)" }}>{encaixes.rodape}</div> : null}
      </div>
    </main>
  );
}

export function Produto({ d, slug, encaixes }: { d: DadosLoja; slug: string; encaixes?: EncaixesProduto }) {
  const p = d.produtos.find((x) => x.slug === slug);
  const { comprar, ok } = useCompraSegura(p);
  const [foto, setFoto] = useState(0);
  if (!p) return <NaoEncontrada d={d} />;
  const cat = d.categorias.find((c) => c.slug === p.categoria);
  const itens = itensLimpos(p);
  const off = descontoPct(p);
  const idx = Math.max(d.produtos.findIndex((x) => x.slug === p.slug), 0);
  return (
    <main style={blocoEstilo(idx)}>
      <div className={`${wrap} py-6 pb-24 sm:py-10 lg:pb-12`}>
        <div className="text-sm [&_a]:underline [&_a]:underline-offset-4 [&_span]:![color:inherit] [&_nav]:![color:inherit]">
          <CaminhoPao d={d} p={p} cat={cat ? { nome: cat.nome, href: cat.href } : undefined} />
        </div>
        <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
          <div className="min-w-0">
            <div className="relative">
              <div className="overflow-hidden rounded-t-full rounded-b-[3rem] border-[3px]" style={{ borderColor: "var(--t-fg)", background: "var(--t-bg)" }}>
                <Foto src={p.fotos[foto] ?? p.fotos[0]} alt={p.nome} className="aspect-[4/5] w-full object-cover" />
              </div>
              <div className="absolute right-2 bottom-4 flex size-28 -rotate-6 items-center justify-center rounded-full border-[3px] text-center text-lg leading-tight font-extrabold tabular-nums sm:right-4 sm:size-32 sm:text-xl" style={{ background: "var(--t-fg)", color: "var(--t-bg)", borderColor: "var(--t-bg)", fontFamily: "var(--t-titulo)" }}>
                {brl(p.preco)}
              </div>
            </div>
            {p.fotos.length > 1 ? (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Fotos da cesta">
                {p.fotos.map((f, i) => (
                  <button key={f + i} type="button" onClick={() => setFoto(i)} aria-label={`Foto ${i + 1}`} aria-pressed={i === foto} className="size-16 shrink-0 overflow-hidden rounded-full border-[3px]" style={{ borderColor: "var(--t-fg)", opacity: i === foto ? 1 : 0.7 }}>
                    <Foto src={f} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="min-w-0">
            <h1 className={`text-[clamp(2rem,6.5vw,4.5rem)] font-extrabold ${GIGANTE}`} style={{ fontFamily: "var(--t-titulo)" }}>{p.nome}</h1>
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-lg font-bold">
              {p.serve ? <span>{p.serve}</span> : null}
              {p.precoDe ? <s className="text-base font-normal tabular-nums">{brl(p.precoDe)}</s> : null}
              {off ? <span className="rounded-full px-3 py-0.5 text-sm" style={{ background: "var(--t-fg)", color: "var(--t-bg)" }}>-{off}%</span> : null}
            </p>

            <div className="mt-6 rounded-[2rem] border-[3px] p-5 sm:p-6" style={{ background: "var(--t-bg)", color: "var(--t-fg)", borderColor: "var(--t-fg)" }}>
              <p className="leading-relaxed" style={{ color: "var(--t-muted)" }}>{p.descricao}</p>
              {itens.length ? (
                <>
                  <h2 className="mt-5 text-xl font-extrabold" style={{ fontFamily: "var(--t-titulo)" }}>O que vem na cesta</h2>
                  <ul className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                    {itens.map((i) => (
                      <li key={i} className="flex min-w-0 items-start gap-2"><span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}><Check className="size-3" aria-hidden="true" /></span><span className="min-w-0">{i}</span></li>
                    ))}
                  </ul>
                </>
              ) : null}
              <p className="mt-5 text-sm" style={{ color: "var(--t-muted)" }}>Entrega com data e horário marcados; o frete é calculado no pedido.</p>
              {encaixes?.compra ? (
                <div id="compra" className="mt-4 min-w-0 scroll-mt-24">
                  {encaixes.compra}
                  {encaixes.entrega ? <div className="mt-3 min-w-0">{encaixes.entrega}</div> : null}
                </div>
              ) : (
                <>
                  <button type="button" data-acao="comprar" onClick={comprar} className={`${PILULA} mt-4 w-full`} style={{ background: "var(--t-primary)", color: "var(--t-on-primary)", borderColor: "var(--t-fg)" }}>
                    {ok ? <><Check className="size-5" aria-hidden="true" /> Adicionada ao carrinho</> : "Adicionar ao carrinho"}
                  </button>
                  <a href={`${d.base}/carrinho`} className={`${PILULA} mt-2 w-full`} style={{ borderColor: "var(--t-fg)" }}>Ver carrinho</a>
                </>
              )}
            </div>
          </div>
        </div>
        {[encaixes?.extras, encaixes?.avaliacoes, encaixes?.quemComprou, encaixes?.vistos].map((no, n) => (
          no ? <section key={n} className="mt-8 min-w-0 rounded-[2rem] border-[3px] p-5 sm:p-6" style={{ background: "var(--t-bg)", color: "var(--t-fg)", borderColor: "var(--t-fg)" }}>{no}</section> : null
        ))}
      </div>

      <div className="fixed inset-x-0 z-30 flex items-center gap-3 border-t-[3px] px-4 py-2 lg:hidden" style={{ bottom: "var(--demo-barra-baixo, 0px)", borderColor: "var(--t-fg)", background: "var(--t-bg)", color: "var(--t-fg)" }}>
        <p className="min-w-0 flex-1 text-xl font-extrabold tabular-nums" style={{ fontFamily: "var(--t-titulo)" }}>{brl(p.preco)}</p>
        {encaixes?.compra ? (
          <a href="#compra" className="inline-flex min-h-11 items-center rounded-full border-[3px] px-6 font-bold" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)", borderColor: "var(--t-fg)" }}>Comprar</a>
        ) : (
          <button type="button" onClick={comprar} className="min-h-11 rounded-full border-[3px] px-6 font-bold" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)", borderColor: "var(--t-fg)" }}>{ok ? "Adicionada" : "Adicionar"}</button>
        )}
      </div>
    </main>
  );
}

export function Carrinho({ d, conteudo }: { d: DadosLoja; conteudo?: ReactNode }) {
  if (conteudo) {
    return (
      <main>
        <section style={blocoEstilo(1)}>
          <div className={`${wrap} py-10 sm:py-14`}>
            <h1 className={`text-[clamp(2.1rem,8vw,6rem)] font-extrabold ${GIGANTE}`} style={{ fontFamily: "var(--t-titulo)" }}>Carrinho</h1>
          </div>
        </section>
        <div className={`${wrap} py-8`} style={{ background: "var(--t-bg)", color: "var(--t-fg)" }}>{conteudo}</div>
      </main>
    );
  }
  return <CarrinhoDemo d={d} />;
}

function CarrinhoDemo({ d }: { d: DadosLoja }) {
  const { itens, total, quantidade } = useDemoCart();
  return (
    <main>
      <section style={blocoEstilo(1)}>
        <div className={`${wrap} py-10 sm:py-14`}>
          <h1 className={`text-[clamp(2.1rem,8vw,6rem)] font-extrabold ${GIGANTE}`} style={{ fontFamily: "var(--t-titulo)" }}>Carrinho</h1>
          <p className="mt-2 text-lg font-bold">{quantidade} {quantidade === 1 ? "cesta" : "cestas"}</p>
        </div>
      </section>
      <div className={`${wrap} py-8`}>
        {itens.length === 0 ? (
          <CarrinhoVazio d={d} className="rounded-[2rem] border-[3px] border-dashed p-10 text-center" botao={`${PILULA} mt-4`} />
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <ul className="flex min-w-0 flex-col gap-3">
              {itens.map((i, n) => (
                <li key={i.slug} className="grid grid-cols-[76px_minmax(0,1fr)] gap-3 rounded-[1.75rem] border-[3px] p-3 sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:p-4" style={{ ...blocoEstilo(n + 2), borderColor: "var(--t-fg)" }}>
                  <div className="overflow-hidden rounded-full border-[3px]" style={{ borderColor: "var(--t-fg)", background: "var(--t-bg)" }}>
                    <Foto src={i.foto} alt={i.nome} className="aspect-square w-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-lg leading-tight font-extrabold [overflow-wrap:anywhere]" style={{ fontFamily: "var(--t-titulo)" }}>{i.nome}</p>
                    <p className="mt-1 text-sm tabular-nums">{brl(i.preco)} cada</p>
                  </div>
                  <div className="col-span-2 min-w-0 rounded-2xl p-2 sm:col-span-1 sm:text-right" style={{ background: "var(--t-bg)", color: "var(--t-fg)" }}>
                    <Quantidade slug={i.slug} nome={i.nome} qtd={i.qtd} />
                    <p className="mt-1 px-1 text-xl font-extrabold tabular-nums" style={{ fontFamily: "var(--t-titulo)" }}>{brl(i.preco * i.qtd)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <aside className="h-fit min-w-0 rounded-[2rem] border-[3px] p-5 sm:p-6 lg:sticky lg:top-6" style={{ ...blocoEstilo(0), borderColor: "var(--t-fg)" }}>
              <h2 className="text-2xl font-extrabold" style={{ fontFamily: "var(--t-titulo)" }}>Resumo</h2>
              <p className="mt-4 flex justify-between"><span>Cestas ({quantidade})</span><span className="tabular-nums">{brl(total)}</span></p>
              <p className="mt-1 flex justify-between"><span>Entrega</span><span>calculada no pedido</span></p>
              <p className="mt-4 flex items-baseline justify-between border-t-[3px] pt-4 text-2xl font-extrabold" style={{ fontFamily: "var(--t-titulo)", borderColor: "currentColor" }}><span>Total</span><span className="tabular-nums">{brl(total)}</span></p>
              <div className="mt-4 rounded-2xl" style={{ background: "var(--t-bg)", color: "var(--t-fg)" }}>
                <AvisoSemCobranca d={d} className="rounded-2xl p-3 text-sm" />
              </div>
              <button type="button" aria-disabled={d.demo} className={`${PILULA} mt-4 w-full text-center aria-disabled:cursor-not-allowed`} style={{ background: "var(--t-accent)", color: "var(--t-fg)", borderColor: "var(--t-fg)" }}>{rotuloFinalizar(d)}</button>
              <a href={`${d.base}/categoria`} className={`${PILULA} mt-2 w-full`} style={{ borderColor: "currentColor" }}>Continuar escolhendo</a>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
