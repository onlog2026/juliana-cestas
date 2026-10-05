import { Gift, PenLine, Truck } from "lucide-react";
import { Foto } from "../../kit";
import type { DadosLoja } from "../../types";
import { BlocoAvaliacoes, BlocoBannersPromo, BlocoBeneficios, BlocoCartaozinho, BlocoConfianca, BlocoFaq, BlocoGradeOrdenavel, BlocoVistos, BlocoVitrines, BlocoWhatsapp, JsonLdHome } from "../../blocos";
import { CAPS, Cartao, LARG, Titulo } from "./comum";

/** SIMETRIA (início) — fotos em arco espelhadas, coleções em 2×2 com legenda sobre cor, destaques em 3 colunas iguais. */

export function Home({ d }: { d: DadosLoja }) {
  const blocos = d.categorias.slice(0, 4);
  const extras = d.categorias.slice(4);
  const destaques = d.cestas.length >= 6 ? d.cestas.slice(0, 6) : d.cestas.slice(0, 3);
  const arco = "overflow-hidden rounded-t-[999px] border";
  return (
    <main>
      {!d.demo ? <BlocoBannersPromo /> : null}

      <section className={`${LARG} pt-10 sm:pt-14`}>
        <div className="grid grid-cols-2 items-end gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1fr)] md:gap-8">
          <div className="col-span-2 px-2 text-center md:order-2 md:col-span-1 md:px-0 md:pb-6">
            <p className={CAPS} style={{ color: "var(--t-primary)" }}>{d.loja}</p>
            <h1 className="mt-5 text-[clamp(2rem,4.4vw,3.75rem)] leading-[1.08]" style={{ fontFamily: "var(--t-titulo)" }}>{d.titulo}</h1>
            <p className="mx-auto mt-5 max-w-md leading-relaxed" style={{ color: "var(--t-muted)" }}>{d.texto}</p>
            <a href={`${d.base}/categoria`} className={`mt-8 inline-flex min-h-12 items-center justify-center border px-9 ${CAPS}`} style={{ borderColor: "var(--t-primary)", background: "var(--t-primary)", color: "var(--t-on-primary)" }}>Ver as cestas</a>
          </div>
          <div className={`min-w-0 md:order-1 ${arco}`} style={{ borderColor: "var(--t-line)" }}>
            <Foto src={d.heroImagem} alt="" className="aspect-[3/4] w-full object-cover" />
          </div>
          <div className={`min-w-0 md:order-3 ${arco}`} style={{ borderColor: "var(--t-line)" }}>
            <Foto src={d.heroImagem} alt="" className="aspect-[3/4] w-full -scale-x-100 object-cover" />
          </div>
        </div>
      </section>

      <section className={`${LARG} pt-24`} aria-labelledby="colecoes">
        <Titulo id="colecoes">Coleções</Titulo>
        <div className="mt-10 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 sm:gap-6">
          {blocos.map((c, n) => {
            const cheio = n === 0 || n === 3; // cores em diagonal: o desenho fica espelhado
            return (
              <a key={c.slug} href={c.href} className="group block min-w-0 text-center">
                <div className="overflow-hidden border" style={{ borderColor: "var(--t-line)" }}>
                  <Foto src={c.imagem} alt="" className="aspect-[5/4] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:transition-none" />
                  <div className="px-3 py-5 sm:py-7" style={{ background: cheio ? "var(--t-primary)" : "var(--t-surface)", color: cheio ? "var(--t-on-primary)" : "var(--t-fg)" }}>
                    <p className="truncate text-base tracking-[0.1em] uppercase sm:text-xl" style={{ fontFamily: "var(--t-titulo)" }}>{c.nome}</p>
                    <p className={`mt-1 ${CAPS} opacity-90`}>Ver coleção</p>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
        {extras.length ? (
          <ul className="mt-6 flex flex-wrap justify-center gap-3">
            {extras.map((c) => <li key={c.slug}><a href={c.href} className={`inline-flex min-h-11 items-center border px-6 ${CAPS}`} style={{ borderColor: "var(--t-line)" }}>{c.nome}</a></li>)}
          </ul>
        ) : null}
      </section>

      {d.demo ? (
        <section className={`${LARG} pt-24`} aria-labelledby="destaques">
          <Titulo id="destaques">Destaques</Titulo>
          <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-x-6 gap-y-12 sm:grid-cols-3">
            {destaques.map((c) => <Cartao key={c.href} p={c} />)}
          </div>
          <p className="mt-12 text-center"><a href={`${d.base}/categoria`} className={`inline-flex min-h-12 items-center border px-9 ${CAPS}`} style={{ borderColor: "var(--t-line)" }}>Ver todas as cestas</a></p>
        </section>
      ) : (
        <>
          <section className={`${LARG} min-w-0 pt-24`} aria-label="Mais vendidas">
            <BlocoVitrines base={d.base} Cartao={Cartao} />
          </section>
          <section className={`${LARG} min-w-0 pt-24`} aria-labelledby="todas-cestas">
            <Titulo id="todas-cestas">Todas as cestas</Titulo>
            <div className="mt-10">
              <BlocoGradeOrdenavel
                base={d.base}
                Cartao={Cartao}
                classeGrade="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3"
              />
            </div>
          </section>
        </>
      )}

      {!d.demo ? <section className={`${LARG} min-w-0 pt-16`} aria-label="Confiança"><BlocoConfianca /></section> : null}

      {d.demo ? (
      <section className="mt-24 border-y py-14" style={{ background: "var(--t-surface)", borderColor: "var(--t-line)" }} aria-label="Como entregamos">
        <div className={`${LARG} grid grid-cols-[minmax(0,1fr)] gap-10 text-center sm:grid-cols-3`}>
          {[
            { Icone: Truck, titulo: "Entrega agendada", texto: "Você escolhe o dia e o horário no pedido." },
            { Icone: PenLine, titulo: "Cartão de mensagem", texto: "Escrito por você e entregue junto com a cesta." },
            { Icone: Gift, titulo: "Embalagem de presente", texto: "Cada cesta é montada e embrulhada à mão." },
          ].map(({ Icone, titulo, texto }) => (
            <div key={titulo} className="min-w-0">
              <Icone className="mx-auto size-7" strokeWidth={1.4} style={{ color: "var(--t-primary)" }} aria-hidden="true" />
              <p className="mt-4 text-lg" style={{ fontFamily: "var(--t-titulo)" }}>{titulo}</p>
              <p className="mx-auto mt-1 max-w-[16rem] text-sm leading-relaxed" style={{ color: "var(--t-muted)" }}>{texto}</p>
            </div>
          ))}
        </div>
      </section>
      ) : null}

      {!d.demo ? (
        <>
          <section className={`${LARG} min-w-0 pt-24`} aria-label="Benefícios"><BlocoBeneficios /></section>
          <section className={`${LARG} min-w-0 pt-24`} aria-label="Avaliações"><BlocoAvaliacoes /></section>
          <section className={`${LARG} min-w-0 pt-24`} aria-label="Cartãozinho"><BlocoCartaozinho /></section>
          <section className={`${LARG} min-w-0 pt-24`} aria-label="Perguntas frequentes"><BlocoFaq /></section>
          <section className={`${LARG} min-w-0 pt-24`} aria-label="Atendimento"><BlocoWhatsapp /></section>
          <section className={`${LARG} min-w-0 pt-24`} aria-label="Vistos recentemente"><BlocoVistos base={d.base} Cartao={Cartao} /></section>
          <JsonLdHome nome={d.loja} />
        </>
      ) : null}
    </main>
  );
}
