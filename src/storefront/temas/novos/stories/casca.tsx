import { Grid2x2, House } from "lucide-react";
import { CartIcon } from "../../cart-icon";
import type { DadosLoja } from "../../types";
import { COL, COL_STYLE } from "./post";

/** STORIES — topo enxuto (nome + carrinho) e barra de app fixa embaixo (início, cestas, carrinho). */

export function Cabecalho({ d }: { d: DadosLoja }) {
  return (
    <header className="sticky top-0 z-30" style={{ background: "var(--t-bg)" }}>
      <div className={`${COL} border-b`} style={COL_STYLE}>
        <div className="flex min-w-0 items-center gap-3 px-4 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xl leading-tight font-bold tracking-tight" style={{ fontFamily: "var(--t-titulo)" }}><a href={d.base || "/"}>{d.loja}</a></p>
            <p className="truncate text-xs" style={{ color: "var(--t-muted)" }}>{d.aviso}</p>
          </div>
          <CartIcon base={d.base} icone="sacola" className="size-6" />
        </div>
      </div>
    </header>
  );
}

export function Rodape({ d }: { d: DadosLoja }) {
  const item = "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold";
  return (
    <>
      {/* Na página da cesta a "folha de compra" ocupa o lugar da barra. */}
      <style dangerouslySetInnerHTML={{ __html: `body:has([data-stories-sheet]) [data-stories-bar]{display:none}` }} />
      <footer className={`${COL} px-4 pt-10 pb-28 text-center`} style={COL_STYLE}>
        <p className="text-lg font-bold" style={{ fontFamily: "var(--t-titulo)" }}><a href={d.base || "/"}>{d.loja}</a></p>
        <p className="mx-auto mt-2 max-w-xs text-sm" style={{ color: "var(--t-muted)" }}>Entrega com data e horário marcados. Cartão de mensagem em todo pedido.</p>
        <p className="mt-4 text-sm"><a href={`${d.base}/categoria`} className="inline-flex items-center underline">Ver todas as cestas</a></p>
      </footer>
      <nav data-stories-bar aria-label="Navegação do aplicativo" className="fixed inset-x-0 z-40 mx-auto w-full max-w-[560px] border-t" style={{ bottom: "var(--demo-barra-baixo, 0px)", background: "var(--t-bg)", borderColor: "var(--t-line)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="grid grid-cols-3">
          <a href={d.base || "/"} className={item}><House className="size-6" aria-hidden="true" />Início</a>
          <a href={`${d.base}/categoria`} className={item}><Grid2x2 className="size-6" aria-hidden="true" />Cestas</a>
          <span className={item}>
            <CartIcon base={d.base} icone="sacola" className="size-6" />
            <span aria-hidden="true" className="-mt-2">Carrinho</span>
          </span>
        </div>
      </nav>
    </>
  );
}
