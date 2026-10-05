import { CartIcon } from "../../cart-icon";
import type { DadosLoja } from "../../types";
import { BlocoBusca } from "../../blocos";
import { CAPS, LARG } from "./comum";

/** SIMETRIA — logo ao centro; o menu se divide em duas metades iguais, uma de cada lado. Rodapé em três colunas espelhadas. */

export function Cabecalho({ d }: { d: DadosLoja }) {
  const meio = Math.ceil(d.categorias.length / 2);
  const esq = d.categorias.slice(0, meio);
  const dir = d.categorias.slice(meio);
  return (
    <header style={{ background: "var(--t-bg)" }}>
      <p className={`px-4 py-2 text-center ${CAPS}`} style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>{d.aviso}</p>
      <div className={`${LARG} grid grid-cols-[44px_minmax(0,1fr)_44px] items-center py-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:py-6`}>
        <span aria-hidden="true" className="md:hidden" />
        <nav aria-label="Categorias" className="hidden items-center justify-end gap-8 md:flex">
          {esq.map((c) => <a key={c.slug} href={c.href} className={CAPS}>{c.nome}</a>)}
        </nav>
        <p className="min-w-0 px-2 text-center text-[1.65rem] leading-none tracking-[0.04em] md:px-10 md:text-4xl" style={{ fontFamily: "var(--t-titulo)" }}><a href={d.base || "/"}>{d.loja}</a></p>
        <div className="flex items-center justify-end gap-8 md:justify-start">
          <nav aria-label="Mais categorias" className="hidden items-center gap-8 md:flex">
            {dir.map((c) => <a key={c.slug} href={c.href} className={CAPS}>{c.nome}</a>)}
          </nav>
          <CartIcon base={d.base} icone="sacola" className="size-5" />
        </div>
      </div>
      {!d.demo ? <div className={`${LARG} mx-auto max-w-xl min-w-0 pb-3`}><BlocoBusca base={d.base} id="busca-simetria" /></div> : null}
      <nav aria-label="Categorias no celular" className="flex overflow-x-auto md:hidden" style={{ scrollbarWidth: "none" }}>
        {d.categorias.map((c) => <a key={c.slug} href={c.href} className={`shrink-0 px-4 first:ml-auto last:mr-auto ${CAPS}`}>{c.nome}</a>)}
      </nav>
      {/* Fio duplo, simétrico. */}
      <div className="mt-2" aria-hidden="true">
        <div className="h-px" style={{ background: "var(--t-line)" }} />
        <div className="mt-[3px] h-px" style={{ background: "var(--t-line)" }} />
      </div>
    </header>
  );
}

export function Rodape({ d }: { d: DadosLoja }) {
  const meio = Math.ceil(d.categorias.length / 2);
  return (
    <footer className="mt-24 border-t" style={{ background: "var(--t-surface)", borderColor: "var(--t-line)" }}>
      <div className={`${LARG} grid grid-cols-[minmax(0,1fr)] gap-10 py-14 text-center md:grid-cols-3 md:items-start`}>
        <nav aria-label="Categorias do rodapé" className="min-w-0 md:text-right">
          <p className={CAPS} style={{ color: "var(--t-primary)" }}>Coleções</p>
          <ul className="mt-3">
            {d.categorias.slice(0, meio).map((c) => <li key={c.slug}><a href={c.href} className="text-sm">{c.nome}</a></li>)}
          </ul>
        </nav>
        <div className="min-w-0">
          <p className="text-3xl tracking-[0.04em]" style={{ fontFamily: "var(--t-titulo)" }}><a href={d.base || "/"}>{d.loja}</a></p>
          <span className="mx-auto mt-4 block h-px w-16" style={{ background: "var(--t-primary)" }} />
          <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed" style={{ color: "var(--t-muted)" }}>Cestas montadas à mão, com entrega em data e horário combinados.</p>
        </div>
        <nav aria-label="Atalhos do rodapé" className="min-w-0 md:text-left">
          <p className={CAPS} style={{ color: "var(--t-primary)" }}>Atalhos</p>
          <ul className="mt-3">
            {d.categorias.slice(meio).map((c) => <li key={c.slug}><a href={c.href} className="text-sm">{c.nome}</a></li>)}
            <li><a href={`${d.base}/categoria`} className="text-sm">Todas as cestas</a></li>
            <li><a href={`${d.base}/carrinho`} className="text-sm">Carrinho</a></li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
