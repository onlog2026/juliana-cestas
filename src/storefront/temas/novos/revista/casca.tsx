import { CartIcon } from "../../cart-icon";
import type { DadosLoja } from "../../types";
import { Regua } from "./pecas";

/* REVISTA — cabeçalho de jornal (nome gigante centralizado entre réguas, seções em caixa-alta) e rodapé de expediente. */

export function Cabecalho({ d }: { d: DadosLoja }) {
  return (
    <header>
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 sm:px-6 lg:px-10">
        <p className="min-w-0 flex-1 truncate py-2 text-[11px] tracking-[0.14em] uppercase" style={{ fontFamily: "var(--t-detalhe)", color: "var(--t-muted)" }}>{d.aviso}</p>
        <CartIcon base={d.base} icone="sacola" className="size-5" />
      </div>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <Regua />
        <p className="py-4 text-center text-[clamp(2.25rem,9vw,5.5rem)] leading-none [overflow-wrap:anywhere]" style={{ fontFamily: "var(--t-titulo)" }}>
          <a href={d.base || "/"} className="inline-flex min-h-11 items-center">{d.loja}</a>
        </p>
        <Regua />
        <nav aria-label="Seções" className="flex gap-1 overflow-x-auto border-b [scrollbar-width:none] sm:justify-center [&::-webkit-scrollbar]:hidden" style={{ borderColor: "var(--t-line)" }}>
          <a href={`${d.base}/categoria`} className="shrink-0 px-3 text-[12px] font-bold tracking-[0.16em] whitespace-nowrap uppercase" style={{ fontFamily: "var(--t-detalhe)" }}>Todas</a>
          {d.categorias.map((c) => (
            <a key={c.slug} href={c.href} className="shrink-0 px-3 text-[12px] tracking-[0.16em] whitespace-nowrap uppercase" style={{ fontFamily: "var(--t-detalhe)" }}>{c.nome}</a>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function Rodape({ d }: { d: DadosLoja }) {
  return (
    <footer className="mt-20 px-4 pb-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1400px]">
        <Regua />
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 py-8 text-sm sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <p className="text-3xl leading-none" style={{ fontFamily: "var(--t-titulo)" }}><a href={d.base || "/"}>{d.loja}</a></p>
            <p className="mt-3 max-w-sm leading-relaxed" style={{ color: "var(--t-muted)" }}>Cestas escolhidas como se escolhe uma boa leitura: com calma, curadoria e bom gosto.</p>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ fontFamily: "var(--t-detalhe)" }}>Seções</p>
            <ul className="mt-2 space-y-0.5">
              {d.categorias.map((c) => <li key={c.slug}><a href={c.href}>{c.nome}</a></li>)}
            </ul>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ fontFamily: "var(--t-detalhe)" }}>Atendimento</p>
            <ul className="mt-2 space-y-0.5">
              <li><a href={`${d.base}/categoria`}>Todas as cestas</a></li>
              <li><a href={`${d.base}/carrinho`}>Meu carrinho</a></li>
              <li style={{ color: "var(--t-muted)" }}>Entrega com data e horário marcados</li>
              <li style={{ color: "var(--t-muted)" }}>Pagamento por PIX ou cartão</li>
            </ul>
          </div>
        </div>
        <div className="h-px" style={{ background: "var(--t-fg)" }} aria-hidden="true" />
        <p className="pt-3 text-center text-[11px] tracking-[0.16em] uppercase" style={{ fontFamily: "var(--t-detalhe)", color: "var(--t-muted)" }}>{d.loja} · Edição desta semana</p>
      </div>
    </footer>
  );
}
