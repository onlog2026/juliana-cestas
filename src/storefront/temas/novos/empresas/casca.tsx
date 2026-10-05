import { CartIcon } from "../../cart-icon";
import type { DadosLoja } from "../../types";
import { wrapE } from "./pecas";

/**
 * EMPRESAS — cabeçalho sóbrio de duas linhas: faixa de atendimento, marca com monograma
 * quadrado, menu de texto e botão "Pedir orçamento". Rodapé em 4 colunas, sem enfeite.
 */

export function Cabecalho({ d }: { d: DadosLoja }) {
  const inicio = d.base || "/";
  return (
    <>
      <p className="px-4 py-2 text-center text-xs sm:text-[13px]" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)", fontFamily: "var(--t-detalhe)" }}>{d.aviso}</p>
      <header className="border-b" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>
        <div className={`${wrapE} flex items-center gap-4 py-2.5`}>
          <a href={inicio} className="flex min-h-11 min-w-0 items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-md text-lg" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)", fontFamily: "var(--t-titulo)", fontWeight: 700 }}>{d.loja.trim().charAt(0).toUpperCase()}</span>
            <span className="truncate text-lg" style={{ fontFamily: "var(--t-titulo)", fontWeight: 700, letterSpacing: "-0.01em" }}>{d.loja}</span>
          </a>
          <nav className="ml-6 hidden min-w-0 flex-1 items-center gap-1 lg:flex" aria-label="Categorias">
            {d.categorias.map((c) => (
              <a key={c.slug} href={c.href} className="rounded-md px-3 text-sm font-medium underline-offset-8 hover:underline">{c.nome}</a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <a href={`${inicio}#orcamento`} className="hidden min-h-11 items-center rounded-md border px-4 text-sm font-semibold sm:inline-flex" style={{ borderColor: "var(--t-primary)", color: "var(--t-primary)" }}>Pedir orçamento</a>
            <a href={`${d.base}/carrinho`} className="hidden min-h-11 items-center text-sm font-semibold sm:inline-flex">Orçamento</a>
            <CartIcon base={d.base} icone="carrinho" className="size-5" />
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto border-t px-4 py-1.5 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden" style={{ borderColor: "var(--t-line)" }} aria-label="Categorias">
          {d.categorias.map((c) => (
            <a key={c.slug} href={c.href} className="shrink-0 rounded-md px-3 text-sm font-medium whitespace-nowrap">{c.nome}</a>
          ))}
        </nav>
      </header>
    </>
  );
}

export function Rodape({ d }: { d: DadosLoja }) {
  const inicio = d.base || "/";
  const zap = d.whatsapp ? d.whatsapp.replace(/\D/g, "") : "";
  const titulo = { fontFamily: "var(--t-detalhe)", color: "var(--t-primary)" } as const;
  return (
    <footer className="mt-20 border-t" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>
      <div className={`${wrapE} grid grid-cols-[minmax(0,1fr)] gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]`}>
        <div className="min-w-0">
          <a href={inicio} className="flex min-h-11 items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-md text-lg" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)", fontFamily: "var(--t-titulo)", fontWeight: 700 }}>{d.loja.trim().charAt(0).toUpperCase()}</span>
            <span className="text-lg" style={{ fontFamily: "var(--t-titulo)", fontWeight: 700 }}>{d.loja}</span>
          </a>
          <p className="mt-2 max-w-xs text-sm leading-relaxed" style={{ color: "var(--t-muted)" }}>Cestas e presentes para empresas: peça em quantidade, defina a data e receba no endereço combinado.</p>
        </div>
        <div className="min-w-0 text-sm">
          <p className="text-xs font-semibold tracking-[0.16em] uppercase" style={titulo}>Para sua empresa</p>
          <ul className="mt-2">
            {d.categorias.map((c) => <li key={c.slug}><a href={c.href}>{c.nome}</a></li>)}
          </ul>
        </div>
        <div className="min-w-0 text-sm">
          <p className="text-xs font-semibold tracking-[0.16em] uppercase" style={titulo}>Orçamento</p>
          <ul className="mt-2">
            <li><a href={`${inicio}#como`}>Como funciona</a></li>
            <li><a href={`${inicio}#quantidades`}>Tabela de quantidades</a></li>
            <li><a href={`${inicio}#orcamento`}>Pedir orçamento</a></li>
            <li><a href={`${d.base}/carrinho`}>Meu orçamento</a></li>
          </ul>
        </div>
        <div className="min-w-0 text-sm">
          <p className="text-xs font-semibold tracking-[0.16em] uppercase" style={titulo}>Atendimento</p>
          <ul className="mt-2" style={{ color: "var(--t-muted)" }}>
            <li className="py-2.5">Nota fiscal e entrega agendada</li>
            {zap ? <li><a href={`https://wa.me/${zap}`} className="underline" style={{ color: "var(--t-fg)" }}>Falar pelo WhatsApp</a></li> : <li className="py-2.5">Atendimento por WhatsApp e e-mail</li>}
          </ul>
        </div>
      </div>
      <p className="border-t px-4 py-4 text-center text-xs" style={{ borderColor: "var(--t-line)", color: "var(--t-muted)" }}>{d.loja} · presentes corporativos</p>
    </footer>
  );
}
