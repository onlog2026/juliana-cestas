import { Menu } from "lucide-react";
import { CartIcon } from "../../cart-icon";
import type { DadosLoja } from "../../types";
import { Estrela, Faixa, GIGANTE, PILULA } from "./pecas";

/* VIBRANTE — cabeçalho: faixa em movimento, logo grande e menu em pílulas (no celular, botão Menu em <details>). Rodapé: bloco escuro com o nome gigante. */

export function Cabecalho({ d }: { d: DadosLoja }) {
  return (
    <>
      <Faixa frases={[d.aviso, "Cartão escrito do seu jeito", "PIX e cartão"]} fundo="var(--t-primary)" texto="var(--t-on-primary)" />
      <header className="relative border-b-[3px]" style={{ borderColor: "var(--t-fg)", background: "var(--t-bg)" }}>
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-10">
          <a href={d.base || "/"} className="flex min-h-11 min-w-0 items-center gap-2 text-2xl font-extrabold sm:text-3xl" style={{ fontFamily: "var(--t-titulo)" }}>
            <Estrela className="size-6 shrink-0 sm:size-7" style={{ color: "var(--t-primary)" }} />
            <span className="truncate">{d.loja}</span>
          </a>
          <nav aria-label="Categorias" className="ml-4 hidden flex-wrap gap-2 lg:flex">
            {d.categorias.map((c) => (
              <a key={c.slug} href={c.href} className="rounded-full border-2 px-4 text-sm font-bold" style={{ borderColor: "var(--t-fg)" }}>{c.nome}</a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="flex rounded-full border-[3px]" style={{ borderColor: "var(--t-fg)" }}>
              <CartIcon base={d.base} icone="sacola" className="size-5" />
            </span>
            <details className="group lg:hidden">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full border-[3px] px-4 text-sm font-bold [&::-webkit-details-marker]:hidden" style={{ borderColor: "var(--t-fg)" }}>
                <Menu className="size-4" aria-hidden="true" /> Menu
              </summary>
              <div className="absolute inset-x-0 top-full z-40 border-b-[3px] px-4 pt-2 pb-5" style={{ background: "var(--t-bg)", borderColor: "var(--t-fg)" }}>
                <nav aria-label="Menu" className="flex flex-col">
                  <a href={`${d.base}/categoria`} className="text-2xl font-extrabold sm:text-3xl [overflow-wrap:anywhere]" style={{ fontFamily: "var(--t-titulo)" }}>Todas as cestas</a>
                  {d.categorias.map((c) => (
                    <a key={c.slug} href={c.href} className="text-2xl font-extrabold sm:text-3xl [overflow-wrap:anywhere]" style={{ fontFamily: "var(--t-titulo)"}}>{c.nome}</a>
                  ))}
                </nav>
              </div>
            </details>
          </div>
        </div>
      </header>
    </>
  );
}

export function Rodape({ d }: { d: DadosLoja }) {
  return (
    <footer className="mt-16">
      <Faixa frases={["Entrega com data marcada", d.loja, "Presente com cor"]} fundo="var(--t-accent)" texto="var(--t-fg)" />
      <div className="px-4 pt-12 pb-10 sm:px-6 lg:px-10" style={{ background: "var(--t-fg)", color: "var(--t-bg)" }}>
        <div className="mx-auto max-w-[1400px]">
          <p className={`text-[clamp(2.25rem,10vw,8rem)] font-extrabold ${GIGANTE}`} style={{ fontFamily: "var(--t-titulo)" }}>
            <a href={d.base || "/"}>{d.loja}</a>
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={`${d.base}/categoria`} className={`${PILULA} border-2`} style={{ borderColor: "var(--t-bg)" }}>Todas as cestas</a>
            <a href={`${d.base}/carrinho`} className={`${PILULA} border-2`} style={{ borderColor: "var(--t-bg)" }}>Meu carrinho</a>
            {d.categorias.slice(0, 3).map((c) => (
              <a key={c.slug} href={c.href} className={`${PILULA} border-2`} style={{ borderColor: "var(--t-bg)" }}>{c.nome}</a>
            ))}
          </div>
          <p className="mt-8 text-sm opacity-90">Entrega com data e horário marcados · Pagamento por PIX ou cartão</p>
        </div>
      </div>
    </footer>
  );
}
