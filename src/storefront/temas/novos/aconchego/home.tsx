import { Foto } from "../../kit";
import type { DadosLoja } from "../../types";
import { BlocoAvaliacoes, BlocoBannersPromo, BlocoBeneficios, BlocoCartaozinho, BlocoConfianca, BlocoFaq, BlocoGradeOrdenavel, BlocoVistos, BlocoVitrines, BlocoWhatsapp, JsonLdHome } from "../../blocos";
import { Cartao } from "./internas";
import { Blob, CartaoNuvem, Coracao, Faisca, Folha, IconeDe, Laco, Onda, Xicara, forma, wrapA } from "./formas";

/**
 * ACONCHEGO — página inicial: abertura com foto em forma orgânica sobre manchas,
 * categorias como "pedrinhas", cartões nuvem, três cuidados com ilustração de linha
 * e um cartão-carta. Ritmo calmo, muito respiro, textos curtos.
 */

const CSS = `
@media (prefers-reduced-motion:no-preference){
  @keyframes aco-flutua{0%,100%{transform:translateY(0) rotate(var(--r,0deg))}50%{transform:translateY(-8px) rotate(var(--r,0deg))}}
  .aco-flutua{animation:aco-flutua 7s ease-in-out infinite}
  .aco-flutua-2{animation-delay:-3s}
}
`;

const CUIDADOS = [
  { titulo: "Escolha com calma", texto: "Veja as cestas, leia o que vem em cada uma e escolha a que combina com quem vai receber.", icone: 1 },
  { titulo: "Montada à mão", texto: "Cada cesta é arrumada com atenção, uma de cada vez, no dia da entrega.", icone: 0 },
  { titulo: "Chega na hora combinada", texto: "Você escolhe o dia e o horário. Ela chega com o cartão que você escreveu.", icone: 3 },
];

export function Home({ d }: { d: DadosLoja }) {
  const destaques = d.cestas.slice(0, 8);
  const todas = `${d.base}/categoria`;
  return (
    <main>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {!d.demo ? <BlocoBannersPromo /> : null}

      {/* Abertura */}
      <section className={`${wrapA} grid grid-cols-[minmax(0,1fr)] items-center gap-10 pt-8 pb-14 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:gap-6 md:pt-14 md:pb-20`}>
        <div className="min-w-0 text-center md:text-left">
          <p className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)", color: "var(--t-primary)" }}>
            <Coracao className="size-4" /> feito com carinho
          </p>
          <h1 className="mt-5 text-[clamp(2.35rem,7.4vw,4.4rem)] leading-[1.04]" style={{ fontFamily: "var(--t-titulo)", fontWeight: 700 }}>{d.titulo}</h1>
          <Onda className="mx-auto mt-4 h-3 w-28 md:mx-0" style={{ color: "var(--t-primary)" }} />
          <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed md:mx-0" style={{ color: "var(--t-muted)" }}>{d.texto}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
            <a href={todas} className="inline-flex min-h-12 items-center gap-2 rounded-full border px-8 text-base font-bold shadow-sm" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)", borderColor: "var(--t-primary)" }}>
              Ver as cestas
            </a>
            {d.categorias[0] ? (
              <a href={d.categorias[0].href} className="inline-flex min-h-12 items-center rounded-full border px-6 text-base font-semibold" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>
                {d.categorias[0].nome}
              </a>
            ) : null}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[430px] min-w-0 px-3 md:max-w-none md:px-8">
          <Blob i={0} className="absolute -top-6 -right-2 w-[88%]" style={{ color: "var(--t-accent)" }} />
          <Blob i={2} className="absolute -bottom-8 -left-4 w-[52%]" style={{ color: "color-mix(in srgb, var(--t-primary) 16%, var(--t-bg))" }} />
          <div className="relative overflow-hidden border-[6px]" style={{ borderRadius: forma(0), aspectRatio: "4 / 5", borderColor: "var(--t-surface)", boxShadow: "0 30px 60px -34px color-mix(in srgb, var(--t-primary) 55%, transparent)" }}>
            <Foto src={d.heroImagem} alt="" className="size-full object-cover" />
          </div>
          <Folha className="aco-flutua absolute -top-3 left-2 size-14 [--r:-12deg]" style={{ color: "var(--t-primary)" }} />
          <Faisca className="aco-flutua aco-flutua-2 absolute top-1/3 -right-1 size-9" style={{ color: "var(--t-primary)" }} />
          <span className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold whitespace-nowrap shadow-md md:left-6 md:translate-x-0" style={{ background: "var(--t-surface)", borderColor: "var(--t-line)" }}>
            <Laco className="size-5" style={{ color: "var(--t-primary)" }} /> com cartão escrito por você
          </span>
        </div>
      </section>

      {!d.demo ? <div className={`${wrapA} pb-12`}><BlocoConfianca /></div> : null}

      {/* Categorias */}
      {d.categorias.length ? (
        <section className={`${wrapA} pb-16`} aria-labelledby="aco-cats">
          <div className="text-center">
            <h2 id="aco-cats" className="text-3xl sm:text-4xl" style={{ fontFamily: "var(--t-titulo)", fontWeight: 700 }}>Para cada momento</h2>
            <p className="mt-2" style={{ color: "var(--t-muted)" }}>Escolha pelo jeito de cuidar.</p>
          </div>
          <div className="mt-9 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-4 gap-y-8 sm:grid-cols-3 lg:[grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
            {d.categorias.map((c, i) => (
              <a key={c.slug} href={c.href} className="group block min-w-0 text-center">
                <div className="mx-auto w-full max-w-[210px] overflow-hidden border-4 transition-transform duration-300 motion-safe:group-hover:-rotate-2" style={{ borderRadius: forma(i + 1), aspectRatio: "1 / 1", borderColor: "var(--t-surface)", boxShadow: "0 16px 30px -20px color-mix(in srgb, var(--t-primary) 50%, transparent)" }}>
                  <Foto src={c.imagem} alt={c.nome} className="size-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105" />
                </div>
                <p className="mt-3 text-lg leading-tight" style={{ fontFamily: "var(--t-titulo)", fontWeight: 600 }}>{c.nome}</p>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {/* Cestas */}
      {destaques.length ? (
        <section className="py-16" style={{ background: "color-mix(in srgb, var(--t-accent) 26%, var(--t-bg))" }} aria-labelledby="aco-cestas">
          <div className={wrapA}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="aco-cestas" className="text-3xl sm:text-4xl" style={{ fontFamily: "var(--t-titulo)", fontWeight: 700 }}>Cestas para abraçar</h2>
                <p className="mt-1" style={{ color: "var(--t-fg)" }}>Montadas com calma, prontas para presentear.</p>
              </div>
              <a href={todas} className="inline-flex min-h-11 items-center rounded-full border px-5 text-sm font-bold" style={{ borderColor: "var(--t-primary)", color: "var(--t-primary)" }}>Ver todas</a>
            </div>
            <div className="mt-8 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3.5 sm:gap-6 lg:grid-cols-4">
              {destaques.map((c, i) => (
                <CartaoNuvem key={c.href + i} c={{ href: c.href, nome: c.nome, preco: c.preco, precoDe: c.precoDe, serve: c.serve, imagem: c.imagem }} i={i} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {!d.demo ? (
        <>
          <div className={`${wrapA} min-w-0 pt-16`}><BlocoVitrines base={d.base} Cartao={Cartao} /></div>
          <section className={`${wrapA} min-w-0 pt-16`} aria-labelledby="aco-todas">
            <div className="mb-8 text-center">
              <h2 id="aco-todas" className="text-3xl sm:text-4xl" style={{ fontFamily: "var(--t-titulo)", fontWeight: 700 }}>Todas as cestas</h2>
              <Onda className="mx-auto mt-3 h-3 w-24" style={{ color: "var(--t-primary)" }} />
            </div>
            <BlocoGradeOrdenavel base={d.base} Cartao={Cartao} classeGrade="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3.5 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4" />
          </section>
          <div className={`${wrapA} min-w-0 pt-16`}><BlocoAvaliacoes /></div>
        </>
      ) : null}

      {/* Cuidados */}
      <section className={`${wrapA} py-20`} aria-labelledby="aco-cuidados">
        <div className="text-center">
          <Xicara className="mx-auto size-9" style={{ color: "var(--t-primary)" }} />
          <h2 id="aco-cuidados" className="mt-3 text-3xl sm:text-4xl" style={{ fontFamily: "var(--t-titulo)", fontWeight: 700 }}>Do jeitinho que você imaginou</h2>
        </div>
        <ul className="mt-12 grid grid-cols-[minmax(0,1fr)] gap-12 md:grid-cols-3 md:gap-8">
          {CUIDADOS.map((c, i) => (
            <li key={c.titulo} className="min-w-0 text-center">
              <span className="relative mx-auto grid size-24 place-items-center">
                <Blob i={i} className="absolute inset-0 size-full" style={{ color: "color-mix(in srgb, var(--t-accent) 70%, var(--t-bg))" }} />
                <IconeDe i={c.icone} className="relative size-11" style={{ color: "var(--t-primary)" }} />
              </span>
              <h3 className="mt-5 text-xl" style={{ fontFamily: "var(--t-titulo)", fontWeight: 600 }}>{c.titulo}</h3>
              <p className="mx-auto mt-2 max-w-[18rem] leading-relaxed" style={{ color: "var(--t-muted)" }}>{c.texto}</p>
            </li>
          ))}
        </ul>
      </section>

      {!d.demo ? (
        <>
          <div className={`${wrapA} min-w-0 pb-16`}><BlocoBeneficios /></div>
          <div className={`${wrapA} min-w-0 pb-16`}><BlocoCartaozinho /></div>
          <div className={`${wrapA} min-w-0 pb-16`}><BlocoFaq /></div>
          <div className={`${wrapA} min-w-0 pb-16`}><BlocoWhatsapp /></div>
          <div className={`${wrapA} min-w-0 pb-16`}><BlocoVistos base={d.base} Cartao={Cartao} /></div>
          <JsonLdHome nome={d.loja} />
        </>
      ) : null}

      {/* Cartão-carta */}
      <section className={`${wrapA} pb-8`} aria-labelledby="aco-carta">
        <div className="relative mx-auto max-w-3xl overflow-hidden border px-6 py-12 text-center sm:px-14" style={{ borderRadius: "3rem 3.5rem 2.5rem 3.5rem / 2.5rem 3rem 3.5rem 3rem", borderColor: "var(--t-line)", background: "var(--t-surface)", boxShadow: "0 26px 50px -34px color-mix(in srgb, var(--t-primary) 45%, transparent)" }}>
          <Blob i={1} className="absolute -top-16 -right-14 w-52" style={{ color: "color-mix(in srgb, var(--t-accent) 55%, var(--t-surface))" }} />
          <Laco className="relative mx-auto size-14" style={{ color: "var(--t-primary)" }} />
          <h2 id="aco-carta" className="relative mt-4 text-3xl sm:text-4xl" style={{ fontFamily: "var(--t-titulo)", fontWeight: 700 }}>Escreva o que o coração mandar</h2>
          <p className="relative mx-auto mt-3 max-w-md text-lg leading-relaxed" style={{ color: "var(--t-muted)" }}>Toda cesta vai com um cartão. Diga o que você sente com as suas palavras, a gente cuida do resto.</p>
          <a href={todas} className="relative mt-7 inline-flex min-h-12 items-center rounded-full border px-8 font-bold" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)", borderColor: "var(--t-primary)" }}>Escolher uma cesta</a>
        </div>
      </section>
    </main>
  );
}
