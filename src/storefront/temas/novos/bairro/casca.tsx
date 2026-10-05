import { MapPin, Store } from "lucide-react";
import { CartIcon } from "../../cart-icon";
import type { DadosLoja } from "../../types";
import { ENDERECO_EXEMPLO, HORARIOS, linkWhats, regioes } from "./dados";
import { Whats } from "./pecas";
import { BlocoBusca } from "../../blocos";

/* BAIRRO — cabeçalho: faixa "Entregamos em", nome + endereço + WhatsApp, chips de categorias. Rodapé em 3 colunas. */

export function Cabecalho({ d }: { d: DadosLoja }) {
  const lista = regioes(d);
  return (
    <>
      <div className="px-4 py-2 text-sm" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>
        <div className="mx-auto flex max-w-[2000px] items-center gap-3 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {lista.length ? (
            <>
              <span className="flex shrink-0 items-center gap-1.5 font-bold"><MapPin className="size-4" aria-hidden="true" /> Entregamos em:</span>
              {lista.map((r) => <span key={r} className="shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium" style={{ borderColor: "color-mix(in srgb, var(--t-on-primary) 50%, transparent)" }}>{r}</span>)}
            </>
          ) : (
            <span className="font-semibold">{d.aviso}</span>
          )}
        </div>
      </div>
      <header className="border-b" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>
        <div className="mx-auto flex max-w-[2000px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-10">
          <a href={d.base || "/"} className="flex min-h-11 min-w-0 items-center gap-2.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}><Store className="size-5" aria-hidden="true" /></span>
            <span className="truncate text-xl font-bold sm:text-2xl" style={{ fontFamily: "var(--t-titulo)" }}>{d.loja}</span>
          </a>
          {d.demo ? (
            <p className="ml-6 hidden items-center gap-1.5 text-sm lg:flex" style={{ color: "var(--t-muted)" }}>
              <MapPin className="size-4 shrink-0" aria-hidden="true" /> {ENDERECO_EXEMPLO} <span className="text-xs">(endereço de exemplo)</span>
            </p>
          ) : null}
          <div className="ml-auto flex items-center gap-2">
            {linkWhats(d) ? <Whats d={d} texto="WhatsApp" compacto className="hidden sm:inline-flex" /> : null}
            <CartIcon base={d.base} icone="cesta" className="size-6" />
          </div>
        </div>
        {!d.demo ? <div className="border-t" style={{ borderColor: "var(--t-line)" }}><div className="mx-auto max-w-[2000px] px-4 py-2 sm:px-6 lg:px-10"><BlocoBusca base={d.base} id="busca-bairro" /></div></div> : null}
        <nav aria-label="Categorias" className="border-t" style={{ borderColor: "var(--t-line)" }}>
          <div className="mx-auto flex max-w-[2000px] gap-1 overflow-x-auto px-3 sm:px-5 lg:px-9 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <a href={`${d.base}/categoria`} className="shrink-0 px-3 text-sm font-semibold whitespace-nowrap">Todas</a>
            {d.categorias.map((c) => <a key={c.slug} href={c.href} className="shrink-0 px-3 text-sm whitespace-nowrap">{c.nome}</a>)}
          </div>
        </nav>
      </header>
    </>
  );
}

export function Rodape({ d }: { d: DadosLoja }) {
  return (
    <footer className="mt-16 border-t" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>
      <div className="mx-auto grid max-w-[2000px] grid-cols-[minmax(0,1fr)] gap-8 px-4 py-10 text-sm sm:grid-cols-3 sm:px-6 lg:px-10">
        <div className="min-w-0">
          <p className="text-xl font-bold" style={{ fontFamily: "var(--t-titulo)" }}><a href={d.base || "/"}>{d.loja}</a></p>
          <p className="mt-2 max-w-xs leading-relaxed" style={{ color: "var(--t-muted)" }}>Loja do bairro: cada cesta é montada para o dia e a hora que você escolher.</p>
          {d.demo ? <p className="mt-3 flex items-center gap-1.5" style={{ color: "var(--t-muted)" }}><MapPin className="size-4 shrink-0" aria-hidden="true" /> {ENDERECO_EXEMPLO} (exemplo)</p> : null}
        </div>
        <div className="min-w-0">
          <p className="font-bold">Horários de entrega</p>
          <ul className="mt-2 space-y-1" style={{ color: "var(--t-muted)" }}>
            {HORARIOS.map(([f, h]) => <li key={f}>{f}: <span className="tabular-nums">{h}</span></li>)}
          </ul>
        </div>
        <div className="min-w-0">
          <p className="font-bold">Fale com a gente</p>
          <div className="mt-2 flex flex-col items-start gap-2">
            <Whats d={d} texto="Chamar no WhatsApp" compacto />
            <a href={`${d.base}/categoria`} className="underline underline-offset-4">Ver todas as cestas</a>
            <a href={`${d.base}/carrinho`} className="underline underline-offset-4">Meu carrinho</a>
          </div>
        </div>
      </div>
      <p className="border-t px-4 py-4 text-center text-xs" style={{ borderColor: "var(--t-line)", color: "var(--t-muted)" }}>Pagamento por PIX ou cartão · Entrega com data e horário marcados</p>
    </footer>
  );
}
