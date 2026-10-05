import { ArrowRight } from "lucide-react";
import { Foto, brl } from "../../kit";
import type { DadosLoja } from "../../types";
import { Kicker, MATERIAS, TituloSecao } from "./pecas";

/**
 * REVISTA — editorial: manchete com foto e legenda, coluna lateral de matérias (cada uma leva à
 * categoria correspondente), destaques da edição em colunas com filete, texto do editor com capitular.
 */
export function Home({ d }: { d: DadosLoja }) {
  const area = "mx-auto w-full max-w-[2000px] px-4 sm:px-6 lg:px-10";
  const nCat = Math.max(d.categorias.length, 1);
  const destaques = d.cestas.slice(0, 4);
  const mais = d.cestas.slice(4, 8);
  const materias = MATERIAS.slice(0, 4).map((m, i) => ({ ...m, cat: d.categorias[i % nCat] }));
  return (
    <main>
      {/* Manchete + matérias */}
      <section className={`${area} grid grid-cols-[minmax(0,1fr)] gap-8 py-8 sm:py-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-0`} aria-labelledby="manchete">
        <article className="min-w-0 lg:pr-10">
          <Kicker>Manchete</Kicker>
          <h1 id="manchete" className="mt-2 text-[clamp(2.1rem,6vw,4.4rem)] leading-[1.02] tracking-tight [overflow-wrap:anywhere]" style={{ fontFamily: "var(--t-titulo)" }}>{d.titulo}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed sm:text-xl" style={{ color: "var(--t-muted)" }}>{d.texto}</p>
          <figure className="mt-6">
            <div className="overflow-hidden">
              <Foto src={d.heroImagem} alt={d.titulo} className="aspect-[4/3] w-full object-cover sm:aspect-[16/10]" />
            </div>
            <figcaption className="mt-2 border-b pb-2 text-xs" style={{ borderColor: "var(--t-line)", color: "var(--t-muted)", fontFamily: "var(--t-detalhe)" }}>Foto: seleção desta edição, montada com entrega de data marcada.</figcaption>
          </figure>
          <a href={`${d.base}/categoria`} className="mt-4 inline-flex min-h-11 items-center gap-2 border-b-2 text-sm font-bold tracking-[0.14em] uppercase" style={{ borderColor: "var(--t-accent)", fontFamily: "var(--t-detalhe)" }}>
            Ver as cestas da edição <ArrowRight className="size-4" aria-hidden="true" />
          </a>
        </article>

        <aside aria-labelledby="materias" className="min-w-0 border-t-[3px] pt-3 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8" style={{ borderColor: "var(--t-fg)" }}>
          <h2 id="materias" className="border-b-[3px] pb-2 text-[11px] font-bold tracking-[0.22em] uppercase lg:border-t-[3px] lg:pt-3" style={{ fontFamily: "var(--t-detalhe)", borderColor: "var(--t-fg)" }}>Nesta edição</h2>
          <ol>
            {materias.map((m, i) => (
              <li key={m.titulo} className="border-b py-4 last:border-b-0" style={{ borderColor: "var(--t-line)" }}>
                <a href={m.cat?.href ?? `${d.base}/categoria`} className="group block min-w-0">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl leading-none tabular-nums" style={{ fontFamily: "var(--t-titulo)", color: "var(--t-accent)" }}>{i + 1}</span>
                    <div className="min-w-0">
                      <Kicker>{m.kicker}</Kicker>
                      <p className="mt-1 text-xl leading-snug underline-offset-4 group-hover:underline" style={{ fontFamily: "var(--t-titulo)" }}>{m.titulo}</p>
                      <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--t-muted)" }}>{m.resumo}</p>
                      {m.cat ? <p className="mt-2 text-xs font-bold tracking-[0.14em] uppercase" style={{ fontFamily: "var(--t-detalhe)" }}>Ver cestas: {m.cat.nome} →</p> : null}
                    </div>
                  </div>
                </a>
              </li>
            ))}
          </ol>
        </aside>
      </section>

      {/* Destaques da edição */}
      <section className={`${area} py-8`} aria-labelledby="destaques">
        <TituloSecao id="destaques" direita="Seleção da edição">Destaques da edição</TituloSecao>
        <div className="mt-6 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-4 gap-y-8 lg:grid-cols-4 lg:gap-x-0">
          {destaques.map((c, i) => (
            <a key={c.href} href={c.href} className={`group block min-w-0 lg:px-6 ${i === 0 ? "lg:pl-0" : "lg:border-l"} ${i === destaques.length - 1 ? "lg:pr-0" : ""}`} style={{ borderColor: "var(--t-line)" }}>
              <div className="overflow-hidden">
                <Foto src={c.imagem} alt={c.nome} className="aspect-[3/4] w-full object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.04]" />
              </div>
              <p className="mt-3 text-[11px] font-bold tracking-[0.2em] tabular-nums uppercase" style={{ fontFamily: "var(--t-detalhe)", color: "var(--t-accent)" }}>Nº {String(i + 1).padStart(2, "0")}</p>
              <p className="mt-1 line-clamp-2 text-lg leading-snug sm:text-xl" style={{ fontFamily: "var(--t-titulo)" }}>{c.nome}</p>
              {c.serve ? <p className="mt-1 line-clamp-1 text-sm" style={{ color: "var(--t-muted)" }}>{c.serve}</p> : null}
              <p className="mt-2 flex items-baseline gap-2 text-base font-bold tabular-nums">
                {brl(c.preco)}
                {c.precoDe && c.precoDe > c.preco ? <s className="text-xs font-normal" style={{ color: "var(--t-muted)" }}>{brl(c.precoDe)}</s> : null}
              </p>
            </a>
          ))}
        </div>
      </section>

      {/* Do editor */}
      <section className="mt-6 py-12" style={{ background: "var(--t-surface)" }} aria-labelledby="editor">
        <div className={`${area} grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-14`}>
          <div className="min-w-0">
            <Kicker>Do editor</Kicker>
            <h2 id="editor" className="mt-2 text-3xl leading-tight sm:text-4xl" style={{ fontFamily: "var(--t-titulo)" }}>Escolher bem é metade do presente</h2>
          </div>
          <div className="min-w-0 text-[17px] leading-[1.75] sm:columns-2 sm:gap-10">
            <p className="first-letter:float-left first-letter:mr-2 first-letter:text-[4.2rem] first-letter:leading-[0.8] first-letter:font-bold first-letter:[font-family:var(--t-titulo)]">
              Toda cesta desta edição foi pensada para uma ocasião: um café da manhã sem pressa, uma surpresa de aniversário, um agradecimento que merece mais do que uma mensagem.
            </p>
            <p className="mt-4">Você escolhe a cesta, marca a data e o horário e escreve o cartão do seu jeito. Cuidamos do resto, para que o presente chegue no momento certo e com a cara de quem o enviou.</p>
            <p className="mt-4">Se estiver em dúvida, comece pelas seções: cada uma reúne cestas parecidas, fáceis de comparar lado a lado.</p>
          </div>
        </div>
      </section>

      {/* Seções */}
      <section className={`${area} py-10`} aria-labelledby="secoes">
        <TituloSecao id="secoes">Todas as seções</TituloSecao>
        <ol className="mt-2">
          {d.categorias.map((c, i) => (
            <li key={c.slug} className="border-b" style={{ borderColor: "var(--t-line)" }}>
              <a href={c.href} className="group flex min-h-14 items-baseline gap-4 py-3">
                <span className="w-8 shrink-0 text-lg tabular-nums" style={{ fontFamily: "var(--t-titulo)", color: "var(--t-accent)" }}>{String(i + 1).padStart(2, "0")}</span>
                <span className="min-w-0 flex-1 text-2xl leading-tight underline-offset-4 group-hover:underline sm:text-3xl" style={{ fontFamily: "var(--t-titulo)" }}>{c.nome}</span>
                <ArrowRight className="size-5 shrink-0 self-center" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ol>
      </section>

      {/* Mais da edição */}
      {mais.length ? (
        <section className={`${area} pb-4`} aria-labelledby="mais">
          <TituloSecao id="mais">Mais da edição</TituloSecao>
          <ul className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-x-10 sm:grid-cols-2">
            {mais.map((c) => (
              <li key={c.href} className="border-b py-4" style={{ borderColor: "var(--t-line)" }}>
                <a href={c.href} className="group flex min-w-0 items-center gap-4">
                  <div className="w-24 shrink-0 overflow-hidden sm:w-28">
                    <Foto src={c.imagem} alt={c.nome} className="aspect-square w-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-lg leading-snug underline-offset-4 group-hover:underline" style={{ fontFamily: "var(--t-titulo)" }}>{c.nome}</p>
                    <p className="mt-1 font-bold tabular-nums">{brl(c.preco)}</p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
