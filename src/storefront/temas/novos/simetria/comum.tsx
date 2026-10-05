import type { ReactNode } from "react";
import { Foto, brl } from "../../kit";
import type { ProdutoLoja } from "../../types";

/** SIMETRIA — peças compartilhadas (sem hooks): título entre dois fios, cartão centralizado e medida da página. */

export const LARG = "mx-auto w-full max-w-[2000px] px-4 sm:px-6 lg:px-10 2xl:px-14";
export const CAPS = "text-xs font-medium tracking-[0.22em] uppercase";

/** Título de seção centralizado entre dois fios. */
export function Titulo({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <div className="flex items-center gap-4 sm:gap-8">
      <span className="h-px flex-1" style={{ background: "var(--t-line)" }} />
      <h2 id={id} className="text-center text-xl tracking-[0.12em] uppercase sm:text-2xl" style={{ fontFamily: "var(--t-titulo)" }}>{children}</h2>
      <span className="h-px flex-1" style={{ background: "var(--t-line)" }} />
    </div>
  );
}

export type DadosCartao = { nome: string; preco: number; precoDe?: number; imagem: string; serve?: string; href: string };

/** Cartão: foto, e embaixo nome, detalhe e preço, tudo centralizado. */
export function Cartao({ p: dados }: { p: DadosCartao | ProdutoLoja }) {
  // Aceita o cartão da demo (`imagem`) e a cesta real da loja (`fotos`).
  const imagem = "imagem" in dados ? dados.imagem : (dados.fotos[0] ?? "");
  const p = { nome: dados.nome, preco: dados.preco, precoDe: dados.precoDe, serve: dados.serve, href: dados.href, imagem };
  return (
    <a href={p.href} className="group block min-w-0 text-center">
      <div className="overflow-hidden border" style={{ borderColor: "var(--t-line)" }}>
        <Foto src={p.imagem} alt={p.nome} className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:transition-none" />
      </div>
      <p className="mt-4 line-clamp-2 text-lg leading-snug" style={{ fontFamily: "var(--t-titulo)" }}>{p.nome}</p>
      {p.serve ? <p className="mt-1 truncate text-xs" style={{ color: "var(--t-muted)" }}>{p.serve}</p> : null}
      <p className="mt-2 tabular-nums" style={{ color: "var(--t-primary)" }}>
        {p.precoDe ? <s className="mr-2 text-sm" style={{ color: "var(--t-muted)" }}>{brl(p.precoDe)}</s> : null}
        {brl(p.preco)}
      </p>
    </a>
  );
}
