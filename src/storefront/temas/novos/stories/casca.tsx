import { Grid2x2, House } from "lucide-react";
import { CartIcon } from "../../cart-icon";
import type { DadosLoja } from "../../types";
import { BlocoBusca } from "../../blocos";
import { COL, COL_STYLE } from "./post";

/** STORIES — topo enxuto (nome + carrinho) e barra de app fixa embaixo (início, cestas, carrinho). */

export function Cabecalho({ d }: { d: DadosLoja }) {
  return (
    <header className="sticky top-0 z-30" style={{ background: "var(--t-bg)" }}>
      <div className={`${COL} border-b`} style={COL_STYLE}>
        <div className="flex min-w-0 items-center gap-3 px-4 py-2 md:gap-8 md:px-6 lg:px-10">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xl leading-tight font-bold tracking-tight" style={{ fontFamily: "var(--t-titulo)" }}><a href={d.base || "/"}>{d.loja}</a></p>
            <p className="truncate text-xs" style={{ color: "var(--t-muted)" }}>{d.aviso}</p>
          </div>
          <nav aria-label="Menu" className="hidden items-center gap-6 text-sm font-semibold md:flex">
            <a href={d.base || "/"} className="min-h-11">Início</a>
            <a href={`${d.base}/categoria`} className="min-h-11">Todas as cestas</a>
            {d.categorias.slice(0, 4).map((c) => <a key={c.slug} href={c.href} className="min-h-11" style={{ color: "var(--t-muted)" }}>{c.nome}</a>)}
          </nav>
          <CartIcon base={d.base} icone="sacola" className="size-6" />
        </div>
        {!d.demo ? <div className="min-w-0 px-4 pb-2 md:px-6 lg:px-10"><BlocoBusca base={d.base} id="busca-stories" /></div> : null}
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
      <footer className={`${COL} px-4 pt-10 pb-28 text-center md:px-6 md:pb-10 lg:px-10`} style={COL_STYLE}>
        <p className="text-lg font-bold" style={{ fontFamily: "var(--t-titulo)" }}><a href={d.base || "/"}>{d.loja}</a></p>
        <p className="mx-auto mt-2 max-w-xs text-sm" style={{ color: "var(--t-muted)" }}>Entrega com data e horário marcados. Cartão de mensagem em todo pedido.</p>
        <p className="mt-4 text-sm"><a href={`${d.base}/categoria`} className="inline-flex items-center underline">Ver todas as cestas</a></p>
      </footer>
      <nav data-stories-bar aria-label="Navegação do aplicativo" className="fixed inset-x-0 z-40 mx-auto w-full max-w-[560px] border-t md:hidden" style={{ bottom: "var(--demo-barra-baixo, 0px)", background: "var(--t-bg)", borderColor: "var(--t-line)", paddingBottom: "env(safe-area-inset-bottom)" }}>
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
