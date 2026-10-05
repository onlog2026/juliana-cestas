import { Foto, brl } from "../../kit";
import type { ProdutoLoja } from "../../types";

/** PANORAMA — cartão de cesta (foto alta, nome grande e preço). Sem hooks: serve para servidor e cliente. */
export function Cartao({ p }: { p: ProdutoLoja }) {
  return (
    <a href={p.href} className="group block min-w-0">
      <div className="overflow-hidden rounded-md border" style={{ borderColor: "var(--t-line)" }}>
        <Foto src={p.fotos[0] ?? ""} alt={p.nome} className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:transition-none" />
      </div>
      <p className="mt-3 line-clamp-2 text-lg leading-snug" style={{ fontFamily: "var(--t-titulo)" }}>{p.nome}</p>
      <p className="text-sm tabular-nums" style={{ color: "var(--t-muted)" }}>
        {p.precoDe ? <s className="mr-2">{brl(p.precoDe)}</s> : null}
        {brl(p.preco)}
      </p>
    </a>
  );
}
