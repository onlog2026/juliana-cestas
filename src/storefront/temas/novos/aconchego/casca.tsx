import { CartIcon } from "../../cart-icon";
import type { DadosLoja } from "../../types";
import { Coracao, Folha, Onda, wrapA } from "./formas";

/**
 * ACONCHEGO — cabeçalho: aviso carinhoso em faixa suave, logo com folha e menu em pílulas
 * (no celular, faixa rolável). Rodapé: borda ondulada, três colunas calmas.
 */

export function Cabecalho({ d }: { d: DadosLoja }) {
  const inicio = d.base || "/";
  return (
    <>
      <p className="flex items-center justify-center gap-2 px-4 py-2 text-center text-[13px]" style={{ background: "var(--t-accent)", color: "var(--t-fg)" }}>
        <Coracao className="size-4 shrink-0" />
        <span className="min-w-0">{d.aviso}</span>
      </p>
      <header className={`${wrapA} pt-4 pb-3`}>
        <div className="flex items-center gap-3">
          <a href={inicio} className="flex min-h-11 min-w-0 items-center gap-2.5">
            <span className="grid size-10 shrink-0 place-items-center" style={{ background: "var(--t-accent)", color: "var(--t-primary)", borderRadius: "58% 42% 45% 55% / 52% 56% 44% 48%" }}>
              <Folha className="size-6" />
            </span>
            <span className="truncate text-2xl leading-none" style={{ fontFamily: "var(--t-titulo)", fontWeight: 700, color: "var(--t-primary)" }}>{d.loja}</span>
          </a>
          <nav className="mx-auto hidden flex-wrap items-center justify-center gap-1.5 md:flex" aria-label="Categorias">
            {d.categorias.map((c) => (
              <a key={c.slug} href={c.href} className="rounded-full border border-transparent px-4 text-[15px] font-semibold">{c.nome}</a>
            ))}
          </nav>
          <div className="ml-auto flex items-center md:ml-0">
            <CartIcon base={d.base} icone="cesta" className="size-6" />
          </div>
        </div>
        <nav className="-mx-5 mt-2 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden" aria-label="Categorias">
          {d.categorias.map((c) => (
            <a key={c.slug} href={c.href} className="shrink-0 rounded-full border px-4 text-sm font-semibold whitespace-nowrap" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>{c.nome}</a>
          ))}
        </nav>
      </header>
    </>
  );
}

export function Rodape({ d }: { d: DadosLoja }) {
  const inicio = d.base || "/";
  const zap = d.whatsapp ? d.whatsapp.replace(/\D/g, "") : "";
  return (
    <footer className="mt-20">
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="block h-8 w-full sm:h-12" style={{ color: "var(--t-surface)" }} aria-hidden="true" focusable="false">
        <path d="M0 60V30C120 6 240 6 360 24s240 30 360 14 240-34 360-26 240 28 360 18V60Z" fill="currentColor" />
      </svg>
      <div className="pb-10" style={{ background: "var(--t-surface)" }}>
        <div className={`${wrapA} grid grid-cols-[minmax(0,1fr)] gap-10 pt-6 sm:grid-cols-3`}>
          <div className="min-w-0">
            <a href={inicio} className="flex min-h-11 items-center gap-2.5">
              <Folha className="size-7" style={{ color: "var(--t-primary)" }} />
              <span className="text-2xl" style={{ fontFamily: "var(--t-titulo)", fontWeight: 700, color: "var(--t-primary)" }}>{d.loja}</span>
            </a>
            <p className="mt-2 max-w-xs text-sm leading-relaxed" style={{ color: "var(--t-muted)" }}>Cestas montadas à mão, uma de cada vez, para presentear com carinho.</p>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold tracking-wide" style={{ color: "var(--t-primary)" }}>Para escolher</p>
            <ul className="mt-1 text-sm">
              {d.categorias.map((c) => (
                <li key={c.slug}><a href={c.href}>{c.nome}</a></li>
              ))}
            </ul>
          </div>
          <div className="min-w-0 text-sm">
            <p className="font-bold tracking-wide" style={{ color: "var(--t-primary)" }}>Com cuidado</p>
            <ul className="mt-1" style={{ color: "var(--t-muted)" }}>
              <li className="py-2.5">Entrega com data e horário marcados</li>
              <li className="py-2.5">Cartão escrito do seu jeito</li>
              {zap ? <li><a href={`https://wa.me/${zap}`} className="underline" style={{ color: "var(--t-fg)" }}>Conversar pelo WhatsApp</a></li> : null}
              <li><a href={`${d.base}/carrinho`} className="underline" style={{ color: "var(--t-fg)" }}>Ver o carrinho</a></li>
            </ul>
          </div>
        </div>
        <div className={`${wrapA} mt-8 flex items-center justify-center gap-3`} style={{ color: "var(--t-muted)" }}>
          <Onda className="h-3 w-16" />
          <span className="flex items-center gap-1.5 text-xs"><Coracao className="size-4" /> feito com carinho</span>
          <Onda className="h-3 w-16" />
        </div>
      </div>
    </footer>
  );
}
