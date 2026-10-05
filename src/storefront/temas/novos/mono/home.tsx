import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Foto, brl } from "../../kit";
import type { DadosLoja } from "../../types";
import { MONO_CAPS, MONO_CSS, MONO_GIGA } from "./casca";

/** MONO — título gigante, fotos coladas em grade de 1 px, numeração enorme, tudo em cantos retos. */

const num = (n: number) => String(n + 1).padStart(2, "0");

export function Home({ d }: { d: DadosLoja }) {
  const pecas = d.cestas.slice(0, 8);
  const [a, b] = [d.cestas[1], d.cestas[2]];
  return (
    <main>
      <style dangerouslySetInnerHTML={{ __html: MONO_CSS }} />

      {/* Abertura */}
      <section className="px-4 pt-10 sm:px-8 sm:pt-16" aria-label="Abertura">
        <h1 className={`text-[clamp(2.7rem,12vw,12rem)] ${MONO_GIGA}`}>{d.titulo}</h1>
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] items-end gap-6 border-t pt-4 sm:grid-cols-[minmax(0,1fr)_auto]" style={{ borderColor: "var(--t-line)" }}>
          <p className="max-w-xl text-lg leading-snug sm:text-2xl">{d.texto}</p>
          <a href={`${d.base}/categoria`} className={`mono-ul inline-flex min-h-11 w-fit items-center gap-2 ${MONO_CAPS}`}>Ver as cestas <ArrowDownRight className="size-4" aria-hidden="true" /></a>
        </div>
      </section>

      {/* Fotos coladas */}
      <section className="mt-10 border-y" style={{ borderColor: "var(--t-line)" }} aria-label="Em destaque">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-px lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]" style={{ background: "var(--t-line)" }}>
          <div className="col-span-2 min-w-0 overflow-hidden lg:col-span-1" style={{ background: "var(--t-bg)" }}>
            <Foto src={d.heroImagem} alt="" className="aspect-[4/3] size-full object-cover lg:aspect-auto lg:min-h-[560px]" />
          </div>
          {[a, b].map((c, i) => c ? (
            <a key={c.href} href={c.href} className="group relative block min-w-0">
              <div className="h-full overflow-hidden" style={{ background: "var(--t-bg)" }}>
                <Foto src={c.imagem} alt={c.nome} className="aspect-[3/4] size-full object-cover transition-transform duration-700 group-hover:scale-105 lg:aspect-auto lg:min-h-[560px]" />
              </div>
              <span className={`absolute bottom-0 left-0 px-3 py-2 ${MONO_CAPS}`} style={{ background: "var(--t-bg)", color: "var(--t-fg)" }}>{num(i + 1)} / {c.nome}</span>
            </a>
          ) : null)}
        </div>
      </section>

      {/* Lista numerada */}
      <section className="px-4 pt-20 sm:px-8" aria-labelledby="selecao">
        <div className="flex items-end justify-between gap-4">
          <h2 id="selecao" className={`text-[clamp(2rem,7vw,6rem)] ${MONO_GIGA}`}>A seleção</h2>
          <p className={MONO_CAPS} style={{ color: "var(--t-muted)" }}>{String(pecas.length).padStart(2, "0")} cestas</p>
        </div>
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-px border-y sm:grid-cols-3 lg:grid-cols-4" style={{ background: "var(--t-line)", borderColor: "var(--t-line)" }}>
          {pecas.map((c, i) => (
            <a key={c.href} href={c.href} className="group block min-w-0" style={{ background: "var(--t-bg)" }}>
              <div className="overflow-hidden">
                <Foto src={c.imagem} alt={c.nome} className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="p-3 sm:p-4">
                <p className="text-5xl leading-none font-bold tracking-[-0.05em] tabular-nums sm:text-7xl">{num(i)}</p>
                <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-snug font-medium uppercase">{c.nome}</p>
                <p className="mt-1 text-sm tabular-nums" style={{ color: "var(--t-muted)" }}>{brl(c.preco)}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Categorias em linhas */}
      <section className="px-4 pt-20 sm:px-8" aria-labelledby="categorias">
        <h2 id="categorias" className={MONO_CAPS} style={{ color: "var(--t-muted)" }}>Categorias</h2>
        <ul className="mt-4 border-t" style={{ borderColor: "var(--t-line)" }}>
          {d.categorias.map((c, i) => (
            <li key={c.slug} className="border-b" style={{ borderColor: "var(--t-line)" }}>
              <a href={c.href} className="group flex min-h-16 w-full items-center gap-4 py-3">
                <span className={`w-8 shrink-0 tabular-nums ${MONO_CAPS}`} style={{ color: "var(--t-muted)" }}>{num(i)}</span>
                <span className="min-w-0 flex-1 text-[clamp(1.8rem,6vw,5rem)] leading-none font-bold tracking-[-0.04em] [overflow-wrap:anywhere] uppercase transition-transform duration-300 group-hover:translate-x-3">{c.nome}</span>
                <ArrowUpRight className="size-6 shrink-0" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* Como funciona, em tabela */}
      <section className="mt-20 grid grid-cols-[minmax(0,1fr)] gap-px border-y sm:grid-cols-3" style={{ background: "var(--t-line)", borderColor: "var(--t-line)" }} aria-label="Como funciona">
        {[["Entrega", "Você escolhe o dia e o horário."], ["Cartão", "A mensagem é escrita por você e vai junto."], ["Pagamento", "PIX ou cartão, direto no pedido."]].map(([t, x]) => (
          <div key={t} className="min-w-0 p-5 sm:p-8" style={{ background: "var(--t-bg)" }}>
            <p className="text-3xl font-bold tracking-[-0.04em] uppercase">{t}</p>
            <p className="mt-2" style={{ color: "var(--t-muted)" }}>{x}</p>
          </div>
        ))}
      </section>

      <a href={`${d.base}/categoria`} className="group mt-0 flex min-h-24 w-full items-center justify-between gap-4 px-4 py-8 sm:px-8" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>
        <span className="min-w-0 text-[clamp(2rem,8vw,8rem)] leading-none font-bold tracking-[-0.045em] uppercase">Ver todas</span>
        <ArrowUpRight className="size-10 shrink-0 transition-transform duration-300 group-hover:translate-x-2 group-hover:-translate-y-2 sm:size-16" aria-hidden="true" />
      </a>
    </main>
  );
}
