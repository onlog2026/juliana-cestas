import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Foto, brl } from "../../kit";
import type { DadosLoja } from "../../types";
import { Estrela, Faixa, GIGANTE, PILULA, blocoEstilo } from "./pecas";

/**
 * VIBRANTE — blocos de cor chapada de ponta a ponta, títulos gigantes, faixa em movimento,
 * cartões sem foto de fundo (bloco colorido + foto recortada em arco) e botões em pílula grossa.
 */
export function Home({ d }: { d: DadosLoja }) {
  const area = "mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10";
  const n = d.categorias.length;
  const passos: Array<[string, string]> = [
    ["Escolha", "Ache a cesta com a cara de quem vai receber."],
    ["Marque", "Defina o dia, o horário e escreva o cartão."],
    ["Pronto", "A cesta chega no combinado, embalada para abrir na hora."],
  ];
  return (
    <main>
      {/* Abertura */}
      <section style={{ background: "var(--t-accent)", color: "var(--t-fg)" }} aria-label="Apresentação">
        <div className={`${area} grid grid-cols-[minmax(0,1fr)] items-center gap-8 py-10 sm:py-14 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-12`}>
          <div className="min-w-0">
            <h1 className={`text-[clamp(2rem,8vw,5.5rem)] font-extrabold ${GIGANTE}`} style={{ fontFamily: "var(--t-titulo)" }}>{d.titulo}</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed sm:text-xl">{d.texto}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={`${d.base}/categoria`} className={PILULA} style={{ background: "var(--t-fg)", color: "var(--t-bg)", borderColor: "var(--t-fg)" }}>
                Ver todas as cestas <ArrowRight className="size-5" aria-hidden="true" />
              </a>
              {d.categorias[0] ? (
                <a href={d.categorias[0].href} className={PILULA} style={{ borderColor: "var(--t-fg)" }}>{d.categorias[0].nome}</a>
              ) : null}
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md min-w-0 lg:max-w-none">
            <div className="overflow-hidden rounded-t-full rounded-b-[2.5rem] border-[3px]" style={{ borderColor: "var(--t-fg)", background: "var(--t-bg)" }}>
              <Foto src={d.heroImagem} alt={d.titulo} className="aspect-[4/5] w-full object-cover" />
            </div>
            <div className="absolute top-3 right-3 flex size-24 -rotate-6 items-center justify-center rounded-full border-[3px] p-2 text-center text-[13px] leading-tight font-extrabold sm:size-28 sm:text-sm" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)", borderColor: "var(--t-fg)", fontFamily: "var(--t-titulo)" }}>
              Entrega com data marcada
            </div>
          </div>
        </div>
      </section>

      <Faixa frases={["Cartão escrito do seu jeito", "Entrega com data e horário marcados", "PIX e cartão"]} fundo="var(--t-fg)" texto="var(--t-bg)" />

      {/* Categorias */}
      <section style={{ background: "var(--t-bg)" }} aria-labelledby="clima">
        <div className={`${area} py-12 sm:py-16`}>
          <h2 id="clima" className={`text-[clamp(1.9rem,6vw,4.25rem)] font-extrabold ${GIGANTE}`} style={{ fontFamily: "var(--t-titulo)" }}>Escolha o seu clima</h2>
          <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 sm:gap-5">
            {d.categorias.map((c, i) => (
              <a key={c.slug} href={c.href} className={`group block min-w-0 ${n % 2 === 1 && i === n - 1 ? "sm:col-span-2" : ""}`}>
                <div className="relative flex min-h-[260px] items-end overflow-hidden rounded-[2rem] border-[3px] p-5 sm:min-h-[320px] sm:p-7" style={{ ...blocoEstilo(i), borderColor: "var(--t-fg)" }}>
                  <div className="absolute top-4 right-4 size-24 overflow-hidden rounded-full border-[3px] sm:top-6 sm:right-6 sm:size-36" style={{ borderColor: "var(--t-fg)", background: "var(--t-bg)" }}>
                    <Foto src={c.imagem} alt="" className="size-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-110" />
                  </div>
                  <div className="relative min-w-0 pr-2">
                    <span className="text-sm font-bold tabular-nums" style={{ fontFamily: "var(--t-titulo)" }}>{String(i + 1).padStart(2, "0")}</span>
                    <p className={`mt-1 text-[clamp(1.6rem,5vw,3.25rem)] font-extrabold ${GIGANTE}`} style={{ fontFamily: "var(--t-titulo)" }}>{c.nome}</p>
                    <span className="mt-3 inline-flex size-11 items-center justify-center rounded-full border-[3px] motion-safe:transition-transform motion-safe:group-hover:translate-x-1" style={{ borderColor: "currentColor" }}><ArrowUpRight className="size-5" aria-hidden="true" /></span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Mais pedidas */}
      <section style={{ background: "color-mix(in srgb, var(--t-primary) 22%, var(--t-bg))", color: "var(--t-fg)" }} aria-labelledby="pedidas">
        <div className={`${area} py-12 sm:py-16`}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="pedidas" className={`text-[clamp(1.9rem,6vw,4.25rem)] font-extrabold ${GIGANTE}`} style={{ fontFamily: "var(--t-titulo)" }}>Para levar hoje</h2>
            <a href={`${d.base}/categoria`} className={PILULA} style={{ borderColor: "var(--t-fg)" }}>Ver todas <ArrowRight className="size-5" aria-hidden="true" /></a>
          </div>
          <div className="mt-8 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 sm:gap-5 lg:grid-cols-4">
            {d.cestas.slice(0, 8).map((c, i) => (
              <a key={c.href} href={c.href} className="group block min-w-0">
                <div className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border-[3px] p-3 sm:p-4" style={{ ...blocoEstilo(i), borderColor: "var(--t-fg)" }}>
                  <div className="overflow-hidden rounded-t-full rounded-b-2xl border-[3px]" style={{ borderColor: "var(--t-fg)", background: "var(--t-bg)" }}>
                    <Foto src={c.imagem} alt={c.nome} className="aspect-[4/5] w-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105" />
                  </div>
                  <p className="mt-3 line-clamp-2 min-h-[2.6em] text-base leading-tight font-extrabold [overflow-wrap:anywhere] sm:text-xl" style={{ fontFamily: "var(--t-titulo)" }}>{c.nome}</p>
                  <p className="mt-2">
                    <span className="inline-block rounded-full px-3 py-1 text-base font-bold tabular-nums sm:text-lg" style={{ background: "var(--t-fg)", color: "var(--t-bg)" }}>{brl(c.preco)}</span>
                    {c.precoDe && c.precoDe > c.preco ? <s className="ml-2 text-xs tabular-nums">{brl(c.precoDe)}</s> : null}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }} aria-labelledby="como">
        <div className={`${area} py-12 sm:py-16`}>
          <h2 id="como" className={`text-[clamp(1.9rem,6vw,4.25rem)] font-extrabold ${GIGANTE}`} style={{ fontFamily: "var(--t-titulo)" }}>Fácil como 1, 2, 3</h2>
          <ol className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-3 md:gap-5">
            {passos.map(([t, txt], i) => (
              <li key={t} className="min-w-0 rounded-[1.75rem] border-[3px] p-5 sm:p-6" style={{ borderColor: "var(--t-on-primary)" }}>
                <span className="flex size-14 items-center justify-center rounded-full text-xl font-extrabold" style={{ background: "var(--t-accent)", color: "var(--t-fg)", fontFamily: "var(--t-titulo)" }}>{i + 1}</span>
                <p className="mt-4 text-2xl font-extrabold" style={{ fontFamily: "var(--t-titulo)" }}>{t}</p>
                <p className="mt-1 leading-relaxed">{txt}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Fecho */}
      <section style={{ background: "var(--t-accent)", color: "var(--t-fg)" }} aria-labelledby="fecho">
        <div className={`${area} flex flex-col items-start gap-6 py-14 sm:py-20`}>
          <Estrela className="size-10 sm:size-14" />
          <h2 id="fecho" className={`text-[clamp(2rem,7.5vw,5.5rem)] font-extrabold ${GIGANTE}`} style={{ fontFamily: "var(--t-titulo)" }}>Qual cesta vai alegrar o dia de alguém?</h2>
          <a href={`${d.base}/categoria`} className={`${PILULA} min-h-14 px-8 text-lg`} style={{ background: "var(--t-fg)", color: "var(--t-bg)", borderColor: "var(--t-fg)" }}>
            Escolher agora <ArrowRight className="size-5" aria-hidden="true" />
          </a>
        </div>
      </section>
    </main>
  );
}
