import { CartIcon } from "../../cart-icon";
import type { DadosLoja } from "../../types";
import { BlocoBusca } from "../../blocos";

/** GALERIA — cabeçalho com logo central pequeno em caixa-alta espaçada, menu fino e rodapé de ateliê. */

export const GAL_CSS = `
.gal-ul{background-image:linear-gradient(currentColor,currentColor);background-repeat:no-repeat;background-position:0 100%;background-size:100% 1px;padding-bottom:3px;transition:background-size .35s ease}
.gal-ul:hover{background-size:0 1px;background-position:100% 100%}
@media (prefers-reduced-motion:reduce){.gal-ul{transition:none}}
`;

const CAPS = "text-[11px] tracking-[0.28em] uppercase";

export function Cabecalho({ d }: { d: DadosLoja }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GAL_CSS }} />
      <p className={`px-4 py-2.5 text-center ${CAPS}`} style={{ color: "var(--t-muted)" }}>{d.aviso}</p>
      <header className="relative border-y" style={{ borderColor: "var(--t-line)" }}>
        <div className="mx-auto grid max-w-[2000px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-4 sm:px-8">
          <nav aria-label="Categorias" className={`hidden items-center gap-7 lg:flex ${CAPS}`}>
            {d.categorias.slice(0, 4).map((c) => <a key={c.slug} href={c.href} className="gal-ul">{c.nome}</a>)}
          </nav>
          <details className="group relative lg:hidden">
            <summary className={`flex min-h-11 w-fit cursor-pointer list-none items-center ${CAPS}`}>Menu</summary>
            <div className="absolute top-full left-0 z-30 mt-px w-64 border p-3" style={{ background: "var(--t-bg)", borderColor: "var(--t-line)" }}>
              <nav aria-label="Categorias" className={`flex flex-col ${CAPS}`}>
                {d.categorias.map((c) => <a key={c.slug} href={c.href}>{c.nome}</a>)}
                <a href={`${d.base}/categoria`}>Todas as peças</a>
              </nav>
            </div>
          </details>
          <p className="py-5 text-center text-[15px] tracking-[0.42em] whitespace-nowrap uppercase sm:text-lg" style={{ fontFamily: "var(--t-titulo)" }}>
            <a href={d.base || "/"}>{d.loja}</a>
          </p>
          <div className="flex items-center justify-end gap-5">
            <a href={`${d.base}/categoria`} className={`hidden min-h-11 items-center lg:inline-flex ${CAPS}`}><span className="gal-ul">Coleção</span></a>
            <CartIcon base={d.base} icone="sacola" className="size-[18px]" />
          </div>
        </div>
        {!d.demo ? (
          <div className="mx-auto max-w-[2000px] border-t px-4 py-2 sm:px-8" style={{ borderColor: "var(--t-line)" }}>
            <div className="mx-auto max-w-xl"><BlocoBusca base={d.base} id="busca-galeria" /></div>
          </div>
        ) : null}
      </header>
    </>
  );
}

export function Rodape({ d }: { d: DadosLoja }) {
  return (
    <footer className="mt-24 border-t px-5 pt-16 pb-10 sm:px-10" style={{ borderColor: "var(--t-line)" }}>
      <div className="mx-auto max-w-[2000px]">
        <p className="text-center text-3xl tracking-[0.4em] uppercase sm:text-5xl" style={{ fontFamily: "var(--t-titulo)" }}>
          <a href={d.base || "/"}>{d.loja}</a>
        </p>
        <div className="mt-14 grid grid-cols-[minmax(0,1fr)] gap-10 text-sm sm:grid-cols-3" style={{ color: "var(--t-muted)" }}>
          <div className="min-w-0">
            <p className={CAPS} style={{ color: "var(--t-fg)" }}>Coleções</p>
            <ul className="mt-3">
              {d.categorias.map((c) => <li key={c.slug}><a href={c.href}>{c.nome}</a></li>)}
            </ul>
          </div>
          <div className="min-w-0">
            <p className={CAPS} style={{ color: "var(--t-fg)" }}>Atendimento</p>
            <p className="mt-3 leading-relaxed">Segunda a sábado.<br />Atendimento por WhatsApp e e-mail.</p>
          </div>
          <div className="min-w-0">
            <p className={CAPS} style={{ color: "var(--t-fg)" }}>Entrega</p>
            <p className="mt-3 leading-relaxed">Dia e horário escolhidos no pedido.<br />Cartão de mensagem escrito por você.</p>
          </div>
        </div>
        <p className={`mt-14 border-t pt-6 text-center ${CAPS}`} style={{ borderColor: "var(--t-line)", color: "var(--t-muted)" }}>© {d.loja}</p>
      </div>
    </footer>
  );
}
