import { ArrowUpRight } from "lucide-react";
import { Foto, brl } from "../../kit";
import type { DadosLoja } from "../../types";
import { GAL_CSS } from "./casca";

/** GALERIA — abertura em tela cheia, vitrine assimétrica numerada, "nossa história" em duas colunas. */

const CAPS = "text-[11px] tracking-[0.28em] uppercase";
const num = (n: number) => String(n + 1).padStart(2, "0");

/** Posição de cada peça na vitrine (12 colunas no computador; 2 no celular). */
const LAYOUT = [
  { col: "col-span-2 lg:col-span-7", asp: "aspect-[4/5]", off: "" },
  { col: "col-span-1 lg:col-span-4 lg:col-start-9", asp: "aspect-[3/4]", off: "lg:mt-52" },
  { col: "col-span-1 lg:col-span-4 lg:col-start-2", asp: "aspect-[3/4]", off: "lg:mt-4" },
  { col: "col-span-2 lg:col-span-5 lg:col-start-7", asp: "aspect-square", off: "lg:mt-32" },
  { col: "col-span-1 lg:col-span-5", asp: "aspect-[4/5]", off: "lg:mt-4" },
  { col: "col-span-1 lg:col-span-3 lg:col-start-9", asp: "aspect-[3/4]", off: "lg:mt-24" },
];

export function Home({ d }: { d: DadosLoja }) {
  const pecas = d.cestas.slice(0, 6);
  const apoio = d.cestas[1]?.imagem || d.categorias[0]?.imagem || d.heroImagem;
  return (
    <main>
      <style dangerouslySetInnerHTML={{ __html: GAL_CSS + `@media (prefers-reduced-motion:no-preference){@keyframes gal-zoom{from{transform:scale(1.07)}to{transform:scale(1)}}.gal-hero img{animation:gal-zoom 2.4s cubic-bezier(.2,.7,.2,1) both}}` }} />

      {/* Abertura */}
      <section className="gal-hero relative h-[85dvh] min-h-[480px] w-full overflow-hidden">
        <Foto src={d.heroImagem} alt={d.titulo} className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,8,6,.62), rgba(10,8,6,.08) 55%, rgba(10,8,6,.12))" }} aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-[2000px] flex-col gap-5 px-5 pb-12 sm:px-10 sm:pb-16" style={{ color: "#fff" }}>
          <p className={CAPS}>{d.loja}</p>
          <h1 className="max-w-4xl text-[clamp(2.4rem,7vw,6.2rem)] leading-[1.02] font-normal tracking-[-0.01em]" style={{ fontFamily: "var(--t-titulo)" }}>{d.titulo}</h1>
          <p className="max-w-md text-sm leading-relaxed sm:text-base" style={{ opacity: 0.92 }}>{d.texto}</p>
          <a href={`${d.base}/categoria`} className={`gal-ul w-fit ${CAPS} inline-flex min-h-11 items-center`}>Ver a coleção</a>
        </div>
      </section>

      {/* Vitrine */}
      <section className="mx-auto max-w-[2000px] px-5 pt-24 pb-10 sm:px-10 sm:pt-36" aria-labelledby="vitrine">
        <div className="flex items-end justify-between gap-6 border-b pb-5" style={{ borderColor: "var(--t-line)" }}>
          <h2 id="vitrine" className="text-4xl sm:text-6xl" style={{ fontFamily: "var(--t-titulo)" }}>A coleção</h2>
          <p className={CAPS} style={{ color: "var(--t-muted)" }}>{pecas.length} peças</p>
        </div>
        <div className="mt-12 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-4 gap-y-12 sm:gap-x-8 lg:grid-cols-12 lg:gap-y-16">
          {pecas.map((c, i) => {
            const l = LAYOUT[i % LAYOUT.length];
            return (
              <a key={c.href} href={c.href} className={`group block min-w-0 ${l.col} ${l.off}`}>
                <div className="overflow-hidden border" style={{ borderColor: "var(--t-line)" }}>
                  <Foto src={c.imagem} alt={c.nome} className={`${l.asp} w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]`} />
                </div>
                <div className="mt-3 flex items-baseline gap-3">
                  <span className={CAPS} style={{ color: "var(--t-accent)" }}>N° {num(i)}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{c.nome}</span>
                  <span className="text-sm tabular-nums" style={{ color: "var(--t-muted)" }}>{brl(c.preco)}</span>
                </div>
              </a>
            );
          })}
        </div>
        <p className="mt-16 text-center">
          <a href={`${d.base}/categoria`} className={`gal-ul ${CAPS} inline-flex min-h-11 items-center`}>Ver todas as peças</a>
        </p>
      </section>

      {/* Nossa história */}
      <section className="mt-16 border-y" style={{ background: "var(--t-surface)", borderColor: "var(--t-line)" }} aria-labelledby="historia">
        <div className="mx-auto grid max-w-[2000px] grid-cols-[minmax(0,1fr)] items-center gap-12 px-5 py-20 sm:px-10 lg:grid-cols-2 lg:gap-24 lg:py-32">
          <div className="min-w-0 lg:pr-10">
            <Foto src={apoio} alt="" className="aspect-[4/5] w-full max-w-md object-cover lg:ml-auto" />
          </div>
          <div className="min-w-0 max-w-xl">
            <p className={CAPS} style={{ color: "var(--t-accent)" }}>Nossa história</p>
            <h2 id="historia" className="mt-5 text-4xl leading-[1.08] sm:text-6xl" style={{ fontFamily: "var(--t-titulo)" }}>Feito devagar, de propósito.</h2>
            <p className="mt-8 leading-[1.9]" style={{ color: "var(--t-muted)" }}>{d.texto}</p>
            <p className="mt-4 leading-[1.9]" style={{ color: "var(--t-muted)" }}>Cada cesta é montada à mão, uma de cada vez. Você escolhe o dia e o horário da entrega e escreve o cartão que vai junto.</p>
            <a href={`${d.base}/categoria`} className={`mt-10 inline-flex min-h-11 items-center gap-2 ${CAPS}`}><span className="gal-ul">Conhecer as peças</span><ArrowUpRight className="size-4" aria-hidden="true" /></a>
          </div>
        </div>
      </section>

      {/* Coleções em lista */}
      <section className="mx-auto max-w-[2000px] px-5 pt-24 sm:px-10" aria-labelledby="colecoes">
        <h2 id="colecoes" className={CAPS} style={{ color: "var(--t-muted)" }}>Escolha por ocasião</h2>
        <ul className="mt-6 border-t" style={{ borderColor: "var(--t-line)" }}>
          {d.categorias.map((c, i) => (
            <li key={c.slug} className="border-b" style={{ borderColor: "var(--t-line)" }}>
              <a href={c.href} className="group flex min-h-16 items-center gap-5 py-4">
                <span className={`${CAPS} w-8 shrink-0`} style={{ color: "var(--t-accent)" }}>{num(i)}</span>
                <span className="min-w-0 flex-1 text-3xl transition-transform duration-500 group-hover:translate-x-2 sm:text-5xl" style={{ fontFamily: "var(--t-titulo)" }}>{c.nome}</span>
                <ArrowUpRight className="size-5 shrink-0" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* Promessas */}
      <section className="mx-auto grid max-w-[2000px] grid-cols-[minmax(0,1fr)] gap-10 px-5 pt-24 sm:grid-cols-3 sm:px-10">
        {[["I", "Montada à mão", "Cada peça é preparada no dia da entrega."], ["II", "Data e horário marcados", "Você escolhe quando a cesta chega."], ["III", "Cartão escrito por você", "A mensagem vai junto, do seu jeito."]].map(([n, t, x]) => (
          <div key={n} className="min-w-0 border-t pt-5" style={{ borderColor: "var(--t-line)" }}>
            <p className="text-2xl" style={{ fontFamily: "var(--t-titulo)", color: "var(--t-accent)" }}>{n}</p>
            <p className="mt-3 text-lg" style={{ fontFamily: "var(--t-titulo)" }}>{t}</p>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--t-muted)" }}>{x}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
