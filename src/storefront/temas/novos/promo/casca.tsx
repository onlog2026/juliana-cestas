import { CreditCard, Gift, PackageCheck, Search, ShieldCheck, Truck } from "lucide-react";
import { CartIcon } from "../../cart-icon";
import type { DadosLoja } from "../../types";

/** PROMO — faixa rolante de avisos, busca grande e barra de categorias colorida; rodapé denso com garantias. */

export const PROMO_CSS = `
@keyframes promo-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.promo-trilho{display:flex;width:max-content;animation:promo-marquee 38s linear infinite}
.promo-trilho:hover{animation-play-state:paused}
.promo-copia2{display:flex}
@media (prefers-reduced-motion:reduce){.promo-trilho{animation:none;width:auto;flex-wrap:wrap;justify-content:center}.promo-copia2{display:none}}
.promo-faixa{background:repeating-linear-gradient(135deg,var(--t-primary) 0 14px,var(--t-accent) 14px 28px);height:8px}
`;

function Avisos({ d }: { d: DadosLoja }) {
  const itens = [d.aviso, "Ofertas terminam hoje às 23:59", "Entrega com data e horário marcados", "Cartão de mensagem incluso"];
  return (
    <>
      {itens.map((t) => (
        <span key={t} className="flex items-center gap-8 px-4 text-[13px] font-semibold tracking-wide whitespace-nowrap uppercase">
          {t}
          <span aria-hidden="true" className="size-1.5 rotate-45" style={{ background: "var(--t-on-primary)" }} />
        </span>
      ))}
    </>
  );
}

export function Cabecalho({ d }: { d: DadosLoja }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PROMO_CSS }} />
      <div className="overflow-hidden py-2" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>
        <div className="promo-trilho">
          <div className="flex"><Avisos d={d} /></div>
          <div className="promo-copia2" aria-hidden="true"><Avisos d={d} /></div>
        </div>
      </div>
      <header style={{ background: "var(--t-bg)" }}>
        <div className="mx-auto flex max-w-[2000px] items-center gap-3 px-4 py-3 sm:gap-6 sm:px-6">
          <p className="text-2xl leading-none font-bold tracking-tight whitespace-nowrap uppercase sm:text-4xl" style={{ fontFamily: "var(--t-titulo)" }}>
            <a href={d.base || "/"}>{d.loja}</a>
          </p>
          <a href={`${d.base}/categoria`} className="hidden h-12 flex-1 items-center gap-3 rounded-md border-2 px-4 text-sm sm:flex" style={{ borderColor: "var(--t-fg)", background: "var(--t-surface)", color: "var(--t-muted)" }}>
            <Search className="size-5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">Buscar cestas, flores, ocasiões…</span>
            <span className="rounded px-3 py-1.5 text-xs font-bold uppercase" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>Buscar</span>
          </a>
          <div className="ml-auto flex items-center gap-1 sm:ml-0">
            <a href={`${d.base}/categoria`} aria-label="Buscar cestas" className="flex size-11 items-center justify-center sm:hidden"><Search className="size-5" aria-hidden="true" /></a>
            <CartIcon base={d.base} icone="carrinho" className="size-6" />
          </div>
        </div>
        <nav aria-label="Categorias" className="overflow-x-auto" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>
          <ul className="mx-auto flex max-w-[2000px] items-stretch gap-1 px-2 text-sm font-semibold tracking-wide whitespace-nowrap uppercase sm:px-4">
            <li><a href={`${d.base}/categoria`} className="px-3 sm:px-4">Todas as ofertas</a></li>
            {d.categorias.map((c) => <li key={c.slug}><a href={c.href} className="px-3 sm:px-4">{c.nome}</a></li>)}
          </ul>
        </nav>
        <div className="promo-faixa" aria-hidden="true" />
      </header>
    </>
  );
}

const GARANTIAS: Array<[typeof Truck, string, string]> = [
  [Truck, "Entrega agendada", "Você escolhe dia e horário"],
  [Gift, "Cartão incluso", "Mensagem escrita por você"],
  [PackageCheck, "Montada no dia", "Cestas preparadas na entrega"],
  [ShieldCheck, "Compra segura", "Pague por PIX ou cartão"],
];

export function Rodape({ d }: { d: DadosLoja }) {
  return (
    <footer className="mt-16" style={{ background: "var(--t-surface)" }}>
      <div className="promo-faixa" aria-hidden="true" />
      <div className="mx-auto max-w-[2000px] px-4 py-10 sm:px-6">
        <ul className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 lg:grid-cols-4">
          {GARANTIAS.map(([I, t, x]) => (
            <li key={t} className="flex min-w-0 items-start gap-3">
              <I className="mt-0.5 size-6 shrink-0" style={{ color: "var(--t-primary)" }} aria-hidden="true" />
              <div className="min-w-0"><p className="text-sm font-bold uppercase">{t}</p><p className="text-sm" style={{ color: "var(--t-muted)" }}>{x}</p></div>
            </li>
          ))}
        </ul>
        <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-8 border-t pt-8 text-sm sm:grid-cols-3" style={{ borderColor: "var(--t-line)" }}>
          <div className="min-w-0">
            <p className="text-3xl font-bold uppercase" style={{ fontFamily: "var(--t-titulo)" }}><a href={d.base || "/"}>{d.loja}</a></p>
            <p className="mt-2 flex items-center gap-2" style={{ color: "var(--t-muted)" }}><CreditCard className="size-4" aria-hidden="true" /> PIX e cartão</p>
          </div>
          <div className="min-w-0">
            <p className="font-bold uppercase">Departamentos</p>
            <ul className="mt-1">{d.categorias.map((c) => <li key={c.slug}><a href={c.href}>{c.nome}</a></li>)}</ul>
          </div>
          <div className="min-w-0" style={{ color: "var(--t-muted)" }}>
            <p className="font-bold uppercase" style={{ color: "var(--t-fg)" }}>Atendimento</p>
            <p className="mt-1">Segunda a sábado<br />WhatsApp e e-mail<br />Trocas e devoluções</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
