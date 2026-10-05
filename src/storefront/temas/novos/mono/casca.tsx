import { CartIcon } from "../../cart-icon";
import type { DadosLoja } from "../../types";

/** MONO — cabeçalho de linhas finas com menu de texto sublinhado animado; rodapé com o nome da loja em letras gigantes. */

export const MONO_CSS = `
.mono-ul{background-image:linear-gradient(currentColor,currentColor);background-repeat:no-repeat;background-position:0 100%;background-size:0 2px;padding-bottom:2px;transition:background-size .3s ease}
.mono-ul:hover,.mono-ul:focus-visible{background-size:100% 2px}
@media (prefers-reduced-motion:reduce){.mono-ul{transition:none}}
`;

export const MONO_CAPS = "text-[11px] font-medium tracking-[0.16em] uppercase";
/** Letras enormes: nunca passam da largura da tela (quebra a palavra se for preciso). */
export const MONO_GIGA = "uppercase font-bold leading-[0.86] tracking-[-0.045em] [overflow-wrap:anywhere] [text-wrap:balance]";

export function Cabecalho({ d }: { d: DadosLoja }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: MONO_CSS }} />
      <p className={`border-b px-4 py-2 sm:px-8 ${MONO_CAPS}`} style={{ borderColor: "var(--t-line)", color: "var(--t-muted)" }}>{d.aviso}</p>
      <header className="relative border-b" style={{ borderColor: "var(--t-line)" }}>
        <div className="flex items-stretch justify-between gap-3 px-4 sm:px-8">
          <p className="flex min-w-0 items-center py-3 text-xl font-bold tracking-[-0.03em] uppercase sm:text-2xl">
            <a href={d.base || "/"} className="flex min-h-11 min-w-0 items-center truncate">{d.loja}</a>
          </p>
          <nav aria-label="Categorias" className={`hidden items-center gap-8 lg:flex ${MONO_CAPS}`}>
            {d.categorias.map((c) => <a key={c.slug} href={c.href} className="mono-ul">{c.nome}</a>)}
          </nav>
          <div className="flex items-center gap-1">
            <details className="lg:hidden">
              <summary className={`flex min-h-11 cursor-pointer list-none items-center px-2 ${MONO_CAPS}`}>Menu</summary>
              <div className="absolute inset-x-0 top-full z-30 border-b" style={{ background: "var(--t-bg)", borderColor: "var(--t-line)" }}>
                <nav aria-label="Categorias" className="flex flex-col px-4 py-2">
                  {d.categorias.map((c, i) => (
                    <a key={c.slug} href={c.href} className="w-full justify-between border-b text-2xl font-bold tracking-[-0.03em] uppercase" style={{ borderColor: "var(--t-line)" }}>
                      <span>{c.nome}</span><span className={MONO_CAPS} style={{ color: "var(--t-muted)" }}>{String(i + 1).padStart(2, "0")}</span>
                    </a>
                  ))}
                  <a href={`${d.base}/categoria`} className={MONO_CAPS}>Todas as cestas</a>
                </nav>
              </div>
            </details>
            <CartIcon base={d.base} icone="sacola" className="size-5" />
          </div>
        </div>
      </header>
    </>
  );
}

export function Rodape({ d }: { d: DadosLoja }) {
  return (
    <footer className="mt-24 border-t" style={{ borderColor: "var(--t-line)" }}>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-px sm:grid-cols-3" style={{ background: "var(--t-line)" }}>
        <div className="min-w-0 p-5 sm:p-8" style={{ background: "var(--t-bg)" }}>
          <p className={MONO_CAPS} style={{ color: "var(--t-muted)" }}>Cestas</p>
          <ul className="mt-3 text-lg font-bold tracking-[-0.02em] uppercase">
            {d.categorias.map((c) => <li key={c.slug}><a href={c.href}>{c.nome}</a></li>)}
          </ul>
        </div>
        <div className="min-w-0 p-5 sm:p-8" style={{ background: "var(--t-bg)" }}>
          <p className={MONO_CAPS} style={{ color: "var(--t-muted)" }}>Atendimento</p>
          <p className="mt-3 leading-relaxed">Segunda a sábado.<br />WhatsApp e e-mail.<br />Trocas e devoluções.</p>
        </div>
        <div className="min-w-0 p-5 sm:p-8" style={{ background: "var(--t-bg)" }}>
          <p className={MONO_CAPS} style={{ color: "var(--t-muted)" }}>Entrega</p>
          <p className="mt-3 leading-relaxed">Dia e horário escolhidos no pedido.<br />Cartão de mensagem incluso.</p>
        </div>
      </div>
      <p className={`overflow-hidden px-4 pt-8 pb-4 text-[clamp(2.6rem,13vw,13rem)] sm:px-8 ${MONO_GIGA}`}>
        <a href={d.base || "/"}>{d.loja}</a>
      </p>
    </footer>
  );
}
