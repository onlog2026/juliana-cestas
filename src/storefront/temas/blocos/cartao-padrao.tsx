import { Foto, brl } from "../kit";
import type { ProdutoLoja } from "../types";

/**
 * Cartão neutro usado pelos blocos quando o modelo não passa o dele. Só variáveis `--t-*`.
 * Primeiro filho do link = o `div` com borda (é nele que o brilho de hover aparece).
 */
export function CartaoPadrao({ p }: { p: ProdutoLoja }) {
  return (
    <a href={p.href} className="group block min-w-0">
      <div className="overflow-hidden rounded-lg border" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>
        <Foto src={p.fotos[0]} alt={p.nome} className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
      </div>
      <p className="mt-3 line-clamp-2 text-[15px] font-semibold leading-snug" style={{ color: "var(--t-fg)" }}>
        {p.nome}
        {p.serve ? <span className="ml-1.5 whitespace-nowrap text-xs font-normal" style={{ color: "var(--t-muted)" }}>· {p.serve}</span> : null}
      </p>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-lg font-bold tabular-nums" style={{ color: "var(--t-fg)" }}>
        {p.precoDe ? <s className="text-sm font-normal" style={{ color: "var(--t-muted)" }} aria-label={`de ${brl(p.precoDe)}`}>{brl(p.precoDe)}</s> : null}
        <span>{brl(p.preco)}</span>
      </p>
    </a>
  );
}
