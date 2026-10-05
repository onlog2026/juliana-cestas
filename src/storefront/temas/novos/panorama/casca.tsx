import { Menu } from "lucide-react";
import { CartIcon } from "../../cart-icon";
import type { DadosLoja } from "../../types";
import { EstiloPanorama } from "./estilo";

/** PANORAMA — cabeçalho mínimo: nome à esquerda, carrinho e botão de menu (details, sem JavaScript) à direita. */

export function Cabecalho({ d }: { d: DadosLoja }) {
  return (
    <header className="sticky top-0 z-40 h-16 border-b" style={{ background: "var(--t-bg)", borderColor: "var(--t-line)" }}>
      <EstiloPanorama />
      <div className="mx-auto flex h-full w-full max-w-[2000px] items-center gap-2 px-5 sm:px-8">
        <p className="min-w-0 flex-1 truncate text-2xl leading-none" style={{ fontFamily: "var(--t-titulo)" }}><a href={d.base || "/"}>{d.loja}</a></p>
        <CartIcon base={d.base} icone="sacola" className="size-5" />
        <details className="group">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full border px-4 text-sm font-medium [&::-webkit-details-marker]:hidden" style={{ borderColor: "var(--t-line)" }}>
            <Menu className="size-4" aria-hidden="true" /> Menu
          </summary>
          <nav aria-label="Categorias" className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-b px-5 py-8 sm:px-8" style={{ background: "var(--t-surface)", borderColor: "var(--t-line)" }}>
            <ul className="mx-auto grid max-w-[2000px] gap-x-12 sm:grid-cols-2">
              {d.categorias.map((c) => (
                <li key={c.slug} className="min-w-0 border-b" style={{ borderColor: "var(--t-line)" }}>
                  <a href={c.href} className="flex min-h-14 items-center text-2xl sm:text-3xl" style={{ fontFamily: "var(--t-titulo)" }}>{c.nome}</a>
                </li>
              ))}
              <li className="min-w-0 border-b" style={{ borderColor: "var(--t-line)" }}>
                <a href={`${d.base}/categoria`} className="flex min-h-14 items-center text-2xl sm:text-3xl" style={{ fontFamily: "var(--t-titulo)" }}>Todas as cestas</a>
              </li>
              <li className="min-w-0 border-b" style={{ borderColor: "var(--t-line)" }}>
                <a href={`${d.base}/carrinho`} className="flex min-h-14 items-center text-2xl sm:text-3xl" style={{ fontFamily: "var(--t-titulo)" }}>Carrinho</a>
              </li>
            </ul>
          </nav>
        </details>
      </div>
    </header>
  );
}

export function Rodape({ d }: { d: DadosLoja }) {
  return (
    <footer className="border-t px-5 py-16 sm:px-8" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>
      <div className="mx-auto grid w-full max-w-[2000px] gap-10 md:grid-cols-2">
        <div className="min-w-0">
          <p className="text-4xl leading-none sm:text-5xl" style={{ fontFamily: "var(--t-titulo)" }}><a href={d.base || "/"}>{d.loja}</a></p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed" style={{ color: "var(--t-muted)" }}>Entrega com data e horário marcados. Cartão de mensagem em todo pedido.</p>
        </div>
        <nav aria-label="Atalhos" className="min-w-0 md:justify-self-end">
          <ul className="grid gap-x-12 sm:grid-cols-2">
            {d.categorias.slice(0, 4).map((c) => <li key={c.slug}><a href={c.href} className="text-sm">{c.nome}</a></li>)}
            <li><a href={`${d.base}/categoria`} className="text-sm">Todas as cestas</a></li>
            <li><a href={`${d.base}/carrinho`} className="text-sm">Carrinho</a></li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
