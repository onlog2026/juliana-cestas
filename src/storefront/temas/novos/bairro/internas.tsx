"use client";

import { useState, type ReactNode } from "react";
import { Check, ShoppingBasket } from "lucide-react";
import { Foto, brl } from "../../kit";
import { useDemoCart, useDemoCartOptional } from "../../demo-cart";
import type { DadosLoja, ProdutoLoja } from "../../types";
import type { EncaixesCategoria, EncaixesProduto } from "../../encaixes";
import { AvisoSemCobranca, CaminhoPao, CarrinhoVazio, FAIXAS, NaoEncontrada, ORDENS, Quantidade, descontoPct, itensLimpos, rotuloFinalizar, useLista, wrap, type Ordem } from "../../internas/comum";
import { Horarios, Retirada, SeloEntrega, Whats } from "./pecas";

/* BAIRRO — páginas internas: chips de ocasião, cartões com selo de entrega, cesta com bloco de entrega e barra de compra no celular. */

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

/** Cartão visual do modelo (sem botão de demonstração): é o que os blocos reais da loja ao vivo usam. */
export function Cartao({ p }: { p: ProdutoLoja }) {
  const off = descontoPct(p);
  return (
    <a href={p.href} className="group block min-w-0">
      <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>
        <div className="relative">
          <Foto src={p.fotos[0]} alt={p.nome} className="aspect-[4/5] w-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.04]" />
          {off ? <span className="absolute top-2 left-2 rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: "var(--t-fg)", color: "var(--t-bg)" }}>-{off}%</span> : null}
        </div>
        <div className="border-t border-dashed p-3" style={{ borderColor: "var(--t-line)" }}>
          <p className="line-clamp-2 min-h-[2.5rem] text-sm leading-snug font-medium sm:text-base">{p.nome}</p>
          <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
            <span className="text-lg font-bold tabular-nums" style={{ fontFamily: "var(--t-titulo)" }}>{brl(p.preco)}</span>
            {p.precoDe ? <s className="text-xs tabular-nums" style={{ color: "var(--t-muted)" }}>{brl(p.precoDe)}</s> : null}
          </p>
          <SeloEntrega className="mt-2" />
        </div>
      </div>
    </a>
  );
}

function CartaoComBotao({ p }: { p: ProdutoLoja }) {
  const { comprar, ok, temCarrinho } = useCompraSegura(p);
  if (!temCarrinho) return <Cartao p={p} />;
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Cartao p={p} />
      <button type="button" onClick={comprar} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border text-sm font-semibold" style={{ borderColor: "var(--t-primary)", color: "var(--t-primary)", background: "var(--t-surface)" }}>
        {ok ? <><Check className="size-4" aria-hidden="true" /> Adicionada</> : <><ShoppingBasket className="size-4" aria-hidden="true" /> Adicionar</>}
      </button>
    </div>
  );
}

export function Categoria({ d, slug, encaixes }: { d: DadosLoja; slug?: string; encaixes?: EncaixesCategoria }) {
  const { cat, titulo, lista, ordem, setOrdem, faixa, setFaixa } = useLista(d, slug);
  return (
    <main className={`${wrap} py-5 sm:py-8`}>
      <CaminhoPao d={d} cat={cat ? { nome: cat.nome, href: cat.href } : undefined} />
      <h1 className="mt-3 text-3xl leading-tight font-bold sm:text-4xl" style={{ fontFamily: "var(--t-titulo)" }}>{titulo}</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--t-muted)" }}>Todas com entrega de data marcada na região atendida.</p>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Ocasiões">
        <a href={`${d.base}/categoria`} className="flex min-h-11 shrink-0 items-center rounded-full border px-5 text-sm font-semibold" style={{ borderColor: "var(--t-line)", background: slug ? "var(--t-surface)" : "var(--t-primary)", color: slug ? "var(--t-fg)" : "var(--t-on-primary)" }}>Todas</a>
        {d.categorias.map((c) => (
          <a key={c.slug} href={c.href} className="flex min-h-11 shrink-0 items-center rounded-full border px-5 text-sm font-semibold whitespace-nowrap" style={{ borderColor: "var(--t-line)", background: c.slug === slug ? "var(--t-primary)" : "var(--t-surface)", color: c.slug === slug ? "var(--t-on-primary)" : "var(--t-fg)" }}>{c.nome}</a>
        ))}
      </div>

      {encaixes?.filtrosExtras ? <div className="mt-3 min-w-0">{encaixes.filtrosExtras}</div> : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="flex min-w-0 flex-wrap gap-1.5" role="group" aria-label="Faixa de preço">
          {FAIXAS.map(([k, l]) => (
            <button key={k} type="button" aria-pressed={faixa === k} onClick={() => setFaixa(k)} className="min-h-11 rounded-full border px-4 text-sm" style={{ borderColor: faixa === k ? "var(--t-fg)" : "var(--t-line)", background: faixa === k ? "var(--t-fg)" : "transparent", color: faixa === k ? "var(--t-bg)" : "var(--t-fg)" }}>{l}</button>
          ))}
        </div>
        <label className="ml-auto flex items-center gap-2 text-sm">
          <span style={{ color: "var(--t-muted)" }}>Ordenar</span>
          <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} className="h-11 rounded-full border px-3" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)", color: "var(--t-fg)" }}>
            {ORDENS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
      </div>
      <p className="mt-4 text-sm" style={{ color: "var(--t-muted)" }} aria-live="polite">{lista.length} {lista.length === 1 ? "cesta" : "cestas"}</p>

      {lista.length ? (
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {lista.map((p) => <CartaoComBotao key={p.slug} p={p} />)}
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-dashed p-8 text-center" style={{ borderColor: "var(--t-line)" }}>Nenhuma cesta nessa faixa. <button type="button" className="min-h-11 underline" onClick={() => setFaixa("")}>Limpar filtro</button></p>
      )}
      {encaixes?.rodape ? <div className="mt-10 min-w-0">{encaixes.rodape}</div> : null}
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
  return (
    <main className={`${wrap} py-5 sm:py-8`}>
      <CaminhoPao d={d} p={p} cat={cat ? { nome: cat.nome, href: cat.href } : undefined} />
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-6 pb-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12 lg:pb-0">
        <div className="min-w-0">
          <div className="overflow-hidden rounded-3xl border" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>
            <Foto src={p.fotos[foto] ?? p.fotos[0]} alt={p.nome} className="aspect-square w-full object-cover" />
          </div>
          {p.fotos.length > 1 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto" role="group" aria-label="Fotos da cesta">
              {p.fotos.map((f, i) => (
                <button key={f + i} type="button" onClick={() => setFoto(i)} aria-label={`Foto ${i + 1}`} aria-pressed={i === foto} className="size-16 shrink-0 overflow-hidden rounded-xl border-2" style={{ borderColor: i === foto ? "var(--t-primary)" : "var(--t-line)" }}>
                  <Foto src={f} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="min-w-0">
          <SeloEntrega />
          <h1 className="mt-3 text-3xl leading-tight font-bold sm:text-4xl [overflow-wrap:anywhere]" style={{ fontFamily: "var(--t-titulo)" }}>{p.nome}</h1>
          {p.serve ? <p className="mt-1 text-sm" style={{ color: "var(--t-muted)" }}>{p.serve}</p> : null}
          <p className="mt-4 flex flex-wrap items-baseline gap-x-3">
            <span className="text-4xl font-bold tabular-nums" style={{ fontFamily: "var(--t-titulo)" }}>{brl(p.preco)}</span>
            {p.precoDe ? <s className="tabular-nums" style={{ color: "var(--t-muted)" }}>{brl(p.precoDe)}</s> : null}
            {off ? <span className="rounded-full px-2 py-0.5 text-sm font-bold" style={{ background: "var(--t-fg)", color: "var(--t-bg)" }}>-{off}%</span> : null}
          </p>
          <p className="mt-4 leading-relaxed" style={{ color: "var(--t-muted)" }}>{p.descricao}</p>

          {itens.length ? (
            <div className="mt-5">
              <h2 className="font-bold">O que vem na cesta</h2>
              <ul className="mt-2 grid gap-1.5 text-sm sm:grid-cols-2">
                {itens.map((i) => <li key={i} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0" style={{ color: "var(--t-primary)" }} aria-hidden="true" /> <span className="min-w-0">{i}</span></li>)}
              </ul>
            </div>
          ) : null}

          {encaixes?.compra ? (
            <div id="compra" className="mt-6 min-w-0 scroll-mt-24">
              {encaixes.compra}
              {encaixes.entrega ? <div className="mt-3 min-w-0">{encaixes.entrega}</div> : null}
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button type="button" data-acao="comprar" onClick={comprar} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full px-6 font-bold" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>
                {ok ? <><Check className="size-5" aria-hidden="true" /> Adicionada ao carrinho</> : "Adicionar ao carrinho"}
              </button>
              <a href={`${d.base}/carrinho`} className="inline-flex min-h-12 items-center justify-center rounded-full border px-6 font-semibold" style={{ borderColor: "var(--t-line)" }}>Ver carrinho</a>
            </div>
          )}

          <section className="mt-6 rounded-2xl border p-5" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }} aria-labelledby="entrega-cesta">
            <h2 id="entrega-cesta" className="mb-3 text-lg font-bold" style={{ fontFamily: "var(--t-titulo)" }}>Entrega e retirada</h2>
            {encaixes?.compra ? null : <p className="mb-3 text-sm font-semibold" style={{ color: "var(--t-primary)" }}>Pediu até 14h, chega hoje (na região atendida).</p>}
            <Horarios d={d} />
            <div className="mt-4 border-t pt-4" style={{ borderColor: "var(--t-line)" }}><Retirada d={d} /></div>
            <div className="mt-4"><Whats d={d} texto="Tirar dúvidas no WhatsApp" compacto /></div>
          </section>
        </div>
      </div>

      {[encaixes?.extras, encaixes?.avaliacoes, encaixes?.quemComprou, encaixes?.vistos].map((no, n) => (no ? <section key={n} className="mt-10 min-w-0 pb-4">{no}</section> : null))}

      <div className="fixed inset-x-0 z-30 flex items-center gap-3 border-t px-4 py-2 lg:hidden" style={{ bottom: "var(--demo-barra-baixo, 0px)", borderColor: "var(--t-line)", background: "var(--t-surface)" }}>
        <p className="min-w-0 flex-1 text-xl font-bold tabular-nums" style={{ fontFamily: "var(--t-titulo)" }}>{brl(p.preco)}</p>
        {encaixes?.compra ? (
          <a href="#compra" className="inline-flex min-h-11 items-center rounded-full px-6 font-bold" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>Comprar</a>
        ) : (
          <button type="button" onClick={comprar} className="min-h-11 rounded-full px-6 font-bold" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>{ok ? "Adicionada" : "Adicionar"}</button>
        )}
      </div>
    </main>
  );
}

export function Carrinho({ d, conteudo }: { d: DadosLoja; conteudo?: ReactNode }) {
  if (conteudo) {
    return (
      <main className={`${wrap} py-5 sm:py-8`}>
        <h1 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: "var(--t-titulo)" }}>Seu carrinho</h1>
        <div className="mt-5 min-w-0">{conteudo}</div>
      </main>
    );
  }
  return <CarrinhoDemo d={d} />;
}

function CarrinhoDemo({ d }: { d: DadosLoja }) {
  const { itens, total, quantidade } = useDemoCart();
  return (
    <main className={`${wrap} py-5 sm:py-8`}>
      <h1 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: "var(--t-titulo)" }}>Seu carrinho</h1>
      {itens.length === 0 ? (
        <CarrinhoVazio d={d} className="mt-6 rounded-2xl border border-dashed p-10 text-center" botao="mt-4 inline-flex min-h-12 items-center rounded-full px-6 font-bold" />
      ) : (
        <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <ul className="min-w-0 overflow-hidden rounded-2xl border" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>
            {itens.map((i) => (
              <li key={i.slug} className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 border-b p-4 last:border-b-0 sm:grid-cols-[88px_minmax(0,1fr)_auto]" style={{ borderColor: "var(--t-line)" }}>
                <Foto src={i.foto} alt={i.nome} className="size-[72px] rounded-xl object-cover sm:size-[88px]" />
                <div className="min-w-0">
                  <p className="line-clamp-2 font-semibold">{i.nome}</p>
                  <p className="text-sm tabular-nums" style={{ color: "var(--t-muted)" }}>{brl(i.preco)} cada</p>
                  <SeloEntrega className="mt-1.5" />
                </div>
                <div className="col-span-2 flex min-w-0 flex-col gap-1 sm:col-span-1 sm:items-end">
                  <Quantidade slug={i.slug} nome={i.nome} qtd={i.qtd} />
                  <p className="font-bold tabular-nums sm:text-right">{brl(i.preco * i.qtd)}</p>
                </div>
              </li>
            ))}
          </ul>
          <aside className="h-fit min-w-0 rounded-2xl border p-5 lg:sticky lg:top-6" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>
            <h2 className="text-lg font-bold" style={{ fontFamily: "var(--t-titulo)" }}>Resumo do pedido</h2>
            <p className="mt-3 flex justify-between text-sm"><span>Cestas ({quantidade})</span><span className="tabular-nums">{brl(total)}</span></p>
            <p className="mt-1 flex justify-between text-sm" style={{ color: "var(--t-muted)" }}><span>Entrega</span><span>calculada pelo CEP</span></p>
            <p className="mt-3 flex justify-between border-t pt-3 text-xl font-bold" style={{ borderColor: "var(--t-line)" }}><span>Total</span><span className="tabular-nums">{brl(total)}</span></p>
            <p className="mt-3 text-sm" style={{ color: "var(--t-muted)" }}>Você escolhe o dia e a faixa de horário na hora de fechar o pedido.</p>
            <AvisoSemCobranca d={d} className="mt-3 rounded-xl border p-3 text-sm" />
            <button type="button" aria-disabled={d.demo} className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-full font-bold aria-disabled:cursor-not-allowed aria-disabled:opacity-90" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>{rotuloFinalizar(d)}</button>
            <a href={`${d.base}/categoria`} className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-full border text-sm font-semibold" style={{ borderColor: "var(--t-line)" }}>Continuar escolhendo</a>
          </aside>
        </div>
      )}
    </main>
  );
}
