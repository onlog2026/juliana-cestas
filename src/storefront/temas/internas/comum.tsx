"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useDemoCart } from "../demo-cart";
import { brl } from "../kit";
import type { DadosLoja, ProdutoLoja } from "../types";

/**
 * Peças de LÓGICA compartilhadas pelas páginas internas de todos os modelos (filtro,
 * ordem, compra, quantidade). O que cada modelo desenha em volta — estrutura, cartão,
 * galeria, resumo — mora no arquivo do próprio modelo.
 */

export const wrap = "mx-auto w-full max-w-[2000px] px-4 sm:px-6 lg:px-10";

export type Faixa = "" | "ate150" | "150a300" | "300mais";
export type Ordem = "destaques" | "menor" | "maior";

export const FAIXAS: ReadonlyArray<readonly [Faixa, string]> = [
  ["", "Todas"],
  ["ate150", "Até R$ 150"],
  ["150a300", "R$ 150 a R$ 300"],
  ["300mais", "Acima de R$ 300"],
];
export const ORDENS: ReadonlyArray<readonly [Ordem, string]> = [
  ["destaques", "Destaques"],
  ["menor", "Menor preço"],
  ["maior", "Maior preço"],
];

/** Estado de filtro/ordem da página de categoria (igual em todos os modelos). */
export function useLista(d: DadosLoja, slug?: string) {
  const cat = d.categorias.find((c) => c.slug === slug);
  const [ordem, setOrdem] = useState<Ordem>("destaques");
  const [faixa, setFaixa] = useState<Faixa>("");
  const lista = useMemo(() => {
    let l = d.produtos.filter((p) => !slug || p.categoria === slug);
    if (faixa === "ate150") l = l.filter((p) => p.preco <= 150);
    if (faixa === "150a300") l = l.filter((p) => p.preco > 150 && p.preco <= 300);
    if (faixa === "300mais") l = l.filter((p) => p.preco > 300);
    if (ordem === "menor") l = [...l].sort((a, b) => a.preco - b.preco);
    if (ordem === "maior") l = [...l].sort((a, b) => b.preco - a.preco);
    return l;
  }, [d.produtos, slug, ordem, faixa]);
  return { cat, titulo: cat?.nome ?? "Todas as cestas", lista, ordem, setOrdem, faixa, setFaixa };
}

/** Adicionar ao carrinho (demo/prévia) com aviso de "adicionada" por 2 s. */
export function useCompra(p: ProdutoLoja | undefined) {
  const { adicionar } = useDemoCart();
  const [ok, setOk] = useState(false);
  function comprar() {
    if (!p) return;
    adicionar({ slug: p.slug, nome: p.nome, preco: p.preco, foto: p.fotos[0] });
    setOk(true);
    window.setTimeout(() => setOk(false), 2000);
  }
  return { comprar, ok };
}

export function descontoPct(p: ProdutoLoja): number | null {
  return p.precoDe && p.precoDe > p.preco ? Math.round((1 - p.preco / p.precoDe) * 100) : null;
}

export function itensLimpos(p: ProdutoLoja): string[] {
  return p.itens.map((i) => i.trim()).filter(Boolean);
}

/** Texto do botão de fechar pedido: na demo e na prévia nada é cobrado, e dizemos isso. */
export function rotuloFinalizar(d: DadosLoja): string {
  return d.demo ? "Finalizar (desligado na demo)" : "Finalizar pedido";
}

export function AvisoSemCobranca({ d, className }: { d: DadosLoja; className?: string }) {
  if (!d.demo) return null;
  return (
    <div className={className ?? "rounded-lg p-3 text-sm"} style={{ background: "var(--t-bg)" }}>
      <p className="font-semibold">Loja de demonstração</p>
      <p style={{ color: "var(--t-muted)" }}>Aqui nada é cobrado. Na sua loja, o cliente escolhe data, horário, escreve o cartão e paga por PIX ou cartão.</p>
    </div>
  );
}

/** Botões − quantidade + lixeira, com toque de 44px. `redondo` troca o formato. */
export function Quantidade({ slug, nome, qtd, redondo = true, className }: { slug: string; nome: string; qtd: number; redondo?: boolean; className?: string }) {
  const { mudar, remover } = useDemoCart();
  const forma = redondo ? "rounded-full" : "rounded-none";
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <button type="button" aria-label="Menos uma" onClick={() => mudar(slug, -1)} className={`flex size-11 items-center justify-center border ${forma}`} style={{ borderColor: "var(--t-line)" }}><Minus className="size-4" /></button>
      <span className="w-6 text-center tabular-nums">{qtd}</span>
      <button type="button" aria-label="Mais uma" onClick={() => mudar(slug, 1)} className={`flex size-11 items-center justify-center border ${forma}`} style={{ borderColor: "var(--t-line)" }}><Plus className="size-4" /></button>
      <button type="button" aria-label={`Remover ${nome}`} onClick={() => remover(slug)} className="ml-auto flex size-11 items-center justify-center"><Trash2 className="size-4" /></button>
    </div>
  );
}

export function CaminhoPao({ d, p, cat }: { d: DadosLoja; p?: ProdutoLoja; cat?: { nome: string; href: string } }) {
  return (
    <nav aria-label="Caminho" className="text-sm" style={{ color: "var(--t-muted)" }}>
      <a href={d.base || "/"}>Início</a> / {cat ? (p ? <a href={cat.href}>{cat.nome}</a> : <span style={{ color: "var(--t-fg)" }}>{cat.nome}</span>) : p ? null : <span style={{ color: "var(--t-fg)" }}>Todas as cestas</span>}
      {p ? <> / <span style={{ color: "var(--t-fg)" }}>{p.nome}</span></> : null}
    </nav>
  );
}

export function NaoEncontrada({ d }: { d: DadosLoja }) {
  return (
    <main className={`${wrap} py-20 text-center`}>
      <h1 className="text-3xl" style={{ fontFamily: "var(--t-titulo)" }}>Cesta não encontrada</h1>
      <a href={`${d.base}/categoria`} className="mt-4 inline-block underline">Ver todas as cestas</a>
    </main>
  );
}

export function CarrinhoVazio({ d, className, botao }: { d: DadosLoja; className?: string; botao: string }) {
  return (
    <div className={className ?? "mt-8 rounded-xl border border-dashed p-10 text-center"} style={{ borderColor: "var(--t-line)" }}>
      <p className="text-lg">Seu carrinho está vazio.</p>
      <a href={`${d.base}/categoria`} className={botao} style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>Escolher uma cesta</a>
    </div>
  );
}

export { brl };
