"use client";

import { useMemo, useState } from "react";
import { Check, Minus, Plus, Trash2 } from "lucide-react";
import { Foto, brl } from "./kit";
import { useDemoCart } from "./demo-cart";
import type { DadosLoja, ProdutoLoja } from "./types";

/**
 * Páginas INTERNAS (categoria, cesta, carrinho) — compartilhadas por todos os modelos.
 * Só usam as variáveis `--t-*` do modelo e o `data-modelo` do invólucro, então herdam
 * cores/fontes da variação. O que é visual de cada esqueleto (cabeçalho, rodapé, home)
 * mora em `casca.tsx` e nas homes.
 */

const wrap = "mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10";

function Cartao({ p }: { p: ProdutoLoja }) {
  return (
    <a href={p.href} className="group block min-w-0">
      <div className="overflow-hidden rounded-[var(--t-raio,12px)]" style={{ background: "var(--t-surface)" }}>
        <Foto src={p.fotos[0]} alt={p.nome} className="aspect-[4/5] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
      </div>
      <p className="mt-3 line-clamp-2 text-[15px] leading-snug font-semibold">{p.nome}</p>
      {p.serve ? <p className="text-xs" style={{ color: "var(--t-muted)" }}>{p.serve}</p> : null}
      <p className="mt-1 flex items-baseline gap-2">
        {p.precoDe ? <s className="text-sm" style={{ color: "var(--t-muted)" }}>{brl(p.precoDe)}</s> : null}
        <span className="text-lg font-bold">{brl(p.preco)}</span>
      </p>
    </a>
  );
}

const ORDENS = [
  ["destaques", "Destaques"],
  ["menor", "Menor preço"],
  ["maior", "Maior preço"],
] as const;

export function PaginaCategoria({ d, slug }: { d: DadosLoja; slug?: string }) {
  const cat = d.categorias.find((c) => c.slug === slug);
  const [ordem, setOrdem] = useState<(typeof ORDENS)[number][0]>("destaques");
  const [faixa, setFaixa] = useState<"" | "ate150" | "150a300" | "300mais">("");
  const lista = useMemo(() => {
    let l = d.produtos.filter((p) => !slug || p.categoria === slug);
    if (faixa === "ate150") l = l.filter((p) => p.preco <= 150);
    if (faixa === "150a300") l = l.filter((p) => p.preco > 150 && p.preco <= 300);
    if (faixa === "300mais") l = l.filter((p) => p.preco > 300);
    if (ordem === "menor") l = [...l].sort((a, b) => a.preco - b.preco);
    if (ordem === "maior") l = [...l].sort((a, b) => b.preco - a.preco);
    return l;
  }, [d.produtos, slug, ordem, faixa]);

  return (
    <main className={`${wrap} py-8 sm:py-12`}>
      <nav aria-label="Caminho" className="text-sm" style={{ color: "var(--t-muted)" }}>
        <a href={d.base || "/"}>Início</a> / <span style={{ color: "var(--t-fg)" }}>{cat?.nome ?? "Todas as cestas"}</span>
      </nav>
      <h1 className="mt-3 text-4xl sm:text-5xl" style={{ fontFamily: "var(--t-titulo)" }}>{cat?.nome ?? "Todas as cestas"}</h1>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {([["", "Todas"], ["ate150", "Até R$ 150"], ["150a300", "R$ 150 a R$ 300"], ["300mais", "Acima de R$ 300"]] as const).map(([k, l]) => (
          <button key={k} type="button" aria-pressed={faixa === k} onClick={() => setFaixa(k)} className="min-h-11 rounded-full border px-4 text-sm font-medium" style={{ borderColor: faixa === k ? "var(--t-fg)" : "var(--t-line)", background: faixa === k ? "var(--t-fg)" : "transparent", color: faixa === k ? "var(--t-bg)" : "var(--t-fg)" }}>
            {l}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-sm">
          Ordenar
          <select value={ordem} onChange={(e) => setOrdem(e.target.value as typeof ordem)} className="h-11 rounded-lg border bg-transparent px-3" style={{ borderColor: "var(--t-line)" }}>
            {ORDENS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
      </div>
      <p className="mt-3 text-sm" style={{ color: "var(--t-muted)" }} aria-live="polite">{lista.length} {lista.length === 1 ? "cesta" : "cestas"}</p>

      {lista.length ? (
        <div className="mt-6 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-4 gap-y-9 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 xl:grid-cols-5">
          {lista.map((p) => <Cartao key={p.slug} p={p} />)}
        </div>
      ) : (
        <p className="mt-10 rounded-xl border border-dashed p-8 text-center" style={{ borderColor: "var(--t-line)" }}>
          Nenhuma cesta nessa faixa. <button type="button" className="underline" onClick={() => setFaixa("")}>Ver todas</button>
        </p>
      )}
    </main>
  );
}

export function PaginaProduto({ d, slug }: { d: DadosLoja; slug: string }) {
  const p = d.produtos.find((x) => x.slug === slug);
  const { adicionar } = useDemoCart();
  const [foto, setFoto] = useState(0);
  const [ok, setOk] = useState(false);
  if (!p) {
    return (
      <main className={`${wrap} py-20 text-center`}>
        <h1 className="text-3xl" style={{ fontFamily: "var(--t-titulo)" }}>Cesta não encontrada</h1>
        <a href={`${d.base}/categoria`} className="mt-4 inline-block underline">Ver todas as cestas</a>
      </main>
    );
  }
  const cat = d.categorias.find((c) => c.slug === p.categoria);
  const relacionadas = d.produtos.filter((x) => x.slug !== p.slug).slice(0, 4);
  const itens = p.itens.map((i) => i.trim()).filter(Boolean);

  function comprar() {
    adicionar({ slug: p!.slug, nome: p!.nome, preco: p!.preco, foto: p!.fotos[0] });
    setOk(true);
    window.setTimeout(() => setOk(false), 2000);
  }

  return (
    <main className={`${wrap} py-8 sm:py-12`}>
      <nav aria-label="Caminho" className="text-sm" style={{ color: "var(--t-muted)" }}>
        <a href={d.base || "/"}>Início</a> / {cat ? <a href={cat.href}>{cat.nome}</a> : null} / <span style={{ color: "var(--t-fg)" }}>{p.nome}</span>
      </nav>
      <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
        <div>
          <div className="overflow-hidden rounded-[var(--t-raio,12px)]" style={{ background: "var(--t-surface)" }}>
            <Foto src={p.fotos[foto]} alt={p.nome} className="aspect-[4/5] w-full object-cover sm:aspect-square" />
          </div>
          {p.fotos.length > 1 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto" role="group" aria-label="Fotos da cesta">
              {p.fotos.map((f, i) => (
                <button key={f} type="button" onClick={() => setFoto(i)} aria-label={`Foto ${i + 1}`} aria-pressed={i === foto} className="size-16 shrink-0 overflow-hidden rounded-lg border-2" style={{ borderColor: i === foto ? "var(--t-fg)" : "transparent" }}>
                  <Foto src={f} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="min-w-0">
          <h1 className="text-4xl leading-tight sm:text-5xl" style={{ fontFamily: "var(--t-titulo)" }}>{p.nome}</h1>
          {p.serve ? <p className="mt-1" style={{ color: "var(--t-muted)" }}>{p.serve}</p> : null}
          <p className="mt-4 flex items-baseline gap-3">
            {p.precoDe ? <s style={{ color: "var(--t-muted)" }}>{brl(p.precoDe)}</s> : null}
            <span className="text-3xl font-bold">{brl(p.preco)}</span>
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--t-muted)" }}>ou 3x de {brl(p.preco / 3)} no cartão</p>
          <p className="mt-5 leading-relaxed" style={{ color: "var(--t-muted)" }}>{p.descricao}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={comprar} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--t-raio,12px)] px-6 font-semibold" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>
              {ok ? <><Check className="size-5" /> Adicionada</> : "Adicionar ao carrinho"}
            </button>
            <a href={`${d.base}/carrinho`} className="inline-flex min-h-12 items-center justify-center rounded-[var(--t-raio,12px)] border px-6 font-semibold" style={{ borderColor: "var(--t-fg)" }}>Ver carrinho</a>
          </div>
          <p className="mt-3 text-sm" style={{ color: "var(--t-muted)" }}>Entrega com data e horário marcados. Cartão de mensagem incluso.</p>

          {itens.length ? (
            <section className="mt-8" aria-labelledby="o-que-vem">
              <h2 id="o-que-vem" className="text-xl" style={{ fontFamily: "var(--t-titulo)" }}>O que vem na cesta</h2>
              <ul className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2">
                {itens.map((i) => (
                  <li key={i} className="flex min-w-0 gap-2 text-sm"><Check className="mt-0.5 size-4 shrink-0" style={{ color: "var(--t-primary)" }} /><span className="min-w-0">{i}</span></li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>

      <section className="mt-16" aria-labelledby="outras">
        <h2 id="outras" className="text-2xl sm:text-3xl" style={{ fontFamily: "var(--t-titulo)" }}>Outras cestas</h2>
        <div className="mt-5 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-4 gap-y-9 sm:grid-cols-4 sm:gap-x-6">
          {relacionadas.map((x) => <Cartao key={x.slug} p={x} />)}
        </div>
      </section>

      {/* Celular: comprar sempre à mão. */}
      <div className="fixed inset-x-0 z-30 flex items-center gap-3 border-t px-4 py-2 lg:hidden" style={{ bottom: "calc(var(--demo-barra-baixo, 0px))", background: "var(--t-bg)", borderColor: "var(--t-line)" }}>
        <p className="min-w-0 flex-1 text-lg font-bold">{brl(p.preco)}</p>
        <button type="button" onClick={comprar} className="min-h-11 rounded-[var(--t-raio,12px)] px-6 font-semibold" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>{ok ? "Adicionada" : "Adicionar"}</button>
      </div>
    </main>
  );
}

export function PaginaCarrinho({ d }: { d: DadosLoja }) {
  const { itens, total, mudar, remover } = useDemoCart();
  return (
    <main className={`${wrap} py-8 sm:py-12`}>
      <h1 className="text-4xl sm:text-5xl" style={{ fontFamily: "var(--t-titulo)" }}>Seu carrinho</h1>
      {itens.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed p-10 text-center" style={{ borderColor: "var(--t-line)" }}>
          <p className="text-lg">Seu carrinho está vazio.</p>
          <a href={`${d.base}/categoria`} className="mt-4 inline-flex min-h-12 items-center rounded-[var(--t-raio,12px)] px-6 font-semibold" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>Escolher uma cesta</a>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <ul className="grid gap-4">
            {itens.map((i) => (
              <li key={i.slug} className="flex gap-4 rounded-xl border p-3" style={{ borderColor: "var(--t-line)" }}>
                <Foto src={i.foto} alt="" className="size-24 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{i.nome}</p>
                  <p className="text-sm" style={{ color: "var(--t-muted)" }}>{brl(i.preco)} cada</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button type="button" aria-label="Menos uma" onClick={() => mudar(i.slug, -1)} className="flex size-11 items-center justify-center rounded-full border" style={{ borderColor: "var(--t-line)" }}><Minus className="size-4" /></button>
                    <span className="w-6 text-center tabular-nums">{i.qtd}</span>
                    <button type="button" aria-label="Mais uma" onClick={() => mudar(i.slug, 1)} className="flex size-11 items-center justify-center rounded-full border" style={{ borderColor: "var(--t-line)" }}><Plus className="size-4" /></button>
                    <button type="button" aria-label={`Remover ${i.nome}`} onClick={() => remover(i.slug)} className="ml-auto flex size-11 items-center justify-center rounded-full"><Trash2 className="size-4" /></button>
                  </div>
                </div>
                <p className="shrink-0 font-bold">{brl(i.preco * i.qtd)}</p>
              </li>
            ))}
          </ul>
          <aside className="h-fit rounded-xl border p-5" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>
            <p className="flex justify-between text-lg"><span>Total</span><b>{brl(total)}</b></p>
            {d.demo ? (
              <div className="mt-4 rounded-lg p-3 text-sm" style={{ background: "var(--t-bg)" }}>
                <p className="font-semibold">Loja de demonstração</p>
                <p style={{ color: "var(--t-muted)" }}>Aqui nada é cobrado. Na sua loja, o cliente escolhe data, horário, escreve o cartão e paga por PIX ou cartão.</p>
              </div>
            ) : null}
            <button type="button" disabled={d.demo} className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-[var(--t-raio,12px)] px-6 font-semibold disabled:opacity-50" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>
              {d.demo ? "Finalizar (desligado na demo)" : "Finalizar pedido"}
            </button>
          </aside>
        </div>
      )}
    </main>
  );
}
