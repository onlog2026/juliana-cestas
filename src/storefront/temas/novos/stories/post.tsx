import { Foto, brl } from "../../kit";
import type { ProdutoLoja } from "../../types";

/** STORIES — cartão de post do feed (foto quadrada, legenda, preço e botão). Sem hooks: serve para servidor e cliente. */

export type DadosPost = { nome: string; preco: number; precoDe?: number; imagem: string; serve?: string; href: string };

export const COL = "mx-auto w-full max-w-[2000px]";
export const COL_STYLE = { borderColor: "var(--t-line)" } as const;

export function Avatar({ imagem, alt, tamanho = "size-10" }: { imagem?: string; alt: string; tamanho?: string }) {
  return (
    <span className={`${tamanho} inline-flex shrink-0 rounded-full p-[2px]`} style={{ background: "conic-gradient(var(--t-primary), var(--t-accent), var(--t-primary))" }}>
      <span className="block size-full overflow-hidden rounded-full border-2" style={{ borderColor: "var(--t-bg)", background: "var(--t-surface)" }}>
        {imagem ? <Foto src={imagem} alt={alt} className="size-full object-cover" /> : null}
      </span>
    </span>
  );
}

/** Cartão de produto do modelo (sem cabeçalho da loja) para os blocos reais: vitrines, grade, vistos. */
export function Cartao({ p }: { p: ProdutoLoja }) {
  return <Post p={{ nome: p.nome, preco: p.preco, precoDe: p.precoDe, imagem: p.fotos[0] ?? "", serve: p.serve, href: p.href }} />;
}

export function Post({ p, loja, avatar }: { p: DadosPost; loja?: string; avatar?: string }) {
  const pct = p.precoDe && p.precoDe > p.preco ? Math.round((1 - p.preco / p.precoDe) * 100) : null;
  return (
    <article className="min-w-0 border-b pb-5 md:overflow-hidden md:rounded-2xl md:border" style={{ borderColor: "var(--t-line)" }}>
      {loja ? (
        <div className="flex min-w-0 items-center gap-3 px-4 py-3">
          <Avatar imagem={avatar} alt="" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{loja}</p>
            <p className="truncate text-xs" style={{ color: "var(--t-muted)" }}>{p.serve || "Entrega com data marcada"}</p>
          </div>
        </div>
      ) : null}
      <a href={p.href} className="group block" aria-label={p.nome}>
        <div className="relative overflow-hidden border-y" style={{ borderColor: "var(--t-line)" }}>
          <Foto src={p.imagem} alt={p.nome} className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none" />
          {pct ? <span className="absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-bold" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>-{pct}%</span> : null}
        </div>
      </a>
      <div className="flex min-w-0 items-center gap-3 px-4 pt-4">
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-base leading-snug font-semibold" style={{ fontFamily: "var(--t-titulo)" }}>{p.nome}</p>
          <p className="mt-1 text-lg font-bold tabular-nums">
            {p.precoDe ? <s className="mr-2 text-sm font-normal" style={{ color: "var(--t-muted)" }}>{brl(p.precoDe)}</s> : null}
            {brl(p.preco)}
          </p>
        </div>
        <a href={p.href} className="inline-flex min-h-11 shrink-0 items-center rounded-full border px-5 text-sm font-semibold" style={{ borderColor: "var(--t-line)" }}>Ver cesta</a>
      </div>
    </article>
  );
}
