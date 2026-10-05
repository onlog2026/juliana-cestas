import { ArrowRight, CalendarClock, FileCheck2, ListChecks } from "lucide-react";
import { Foto, brl } from "../../kit";
import type { DadosLoja } from "../../types";
import { BlocoAvaliacoes, BlocoBannersPromo, BlocoBeneficios, BlocoCartaozinho, BlocoConfianca, BlocoFaq, BlocoGradeOrdenavel, BlocoVistos, BlocoVitrines, BlocoWhatsapp, JsonLdHome } from "../../blocos";
import { Cartao } from "./internas";
import { FormOrcamento } from "./form-orcamento";
import { Rotulo, SELOS, TabelaExemplo, wrapE } from "./pecas";

/**
 * EMPRESAS — página inicial B2B: proposta de valor, selos informativos, "como funciona"
 * em 3 passos, cestas "a partir de", tabela de quantidades (EXEMPLO) e pedido de orçamento.
 * Cantos retos, filetes finos, fonte de detalhe em caixa-alta. Sem logos nem números de prova social.
 */

const PASSOS = [
  { Icone: ListChecks, titulo: "Escolha as cestas", texto: "Navegue pelas linhas para clientes, equipes e eventos e separe as que combinam com a sua ação." },
  { Icone: CalendarClock, titulo: "Defina quantidade e data", texto: "Informe quantas cestas precisa, o endereço e o dia da entrega. Cartão com a mensagem da sua empresa." },
  { Icone: FileCheck2, titulo: "Aprove o orçamento", texto: "Você recebe os valores e o prazo, confere tudo e aprova. Depois é só aguardar a entrega." },
];

export function Home({ d }: { d: DadosLoja }) {
  const inicio = d.base || "/";
  const todas = `${d.base}/categoria`;
  const mais = d.cestas.slice(0, 6);
  const fotoB = d.cestas[1]?.imagem ?? d.cestas[0]?.imagem ?? "";
  const fotoC = d.cestas[2]?.imagem ?? d.cestas[0]?.imagem ?? "";
  return (
    <main>
      {!d.demo ? <BlocoBannersPromo /> : null}

      {/* Abertura */}
      <section className={`${wrapE} grid grid-cols-[minmax(0,1fr)] items-center gap-10 py-10 sm:py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 lg:py-20`}>
        <div className="min-w-0">
          <Rotulo>Presentes corporativos</Rotulo>
          <h1 className="mt-4 text-[clamp(2.1rem,5.2vw,3.7rem)] leading-[1.06]" style={{ fontFamily: "var(--t-titulo)", fontWeight: 700, letterSpacing: "-0.02em" }}>{d.titulo}</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed" style={{ color: "var(--t-muted)" }}>{d.texto}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={todas} className="inline-flex min-h-12 items-center gap-2 rounded-md border px-6 font-bold" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)", borderColor: "var(--t-primary)" }}>
              {d.demo ? "Montar meu orçamento" : "Ver catálogo"} <ArrowRight className="size-4" aria-hidden="true" />
            </a>
            <a href={`${inicio}#como`} className="inline-flex min-h-12 items-center rounded-md border px-6 font-semibold" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>Como funciona</a>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
            {["Nota fiscal", "Entrega agendada", "Cartão personalizado"].map((t) => (
              <li key={t} className="flex items-center gap-2"><span className="size-1.5 rounded-full" style={{ background: "var(--t-primary)" }} aria-hidden="true" />{t}</li>
            ))}
          </ul>
        </div>
        <div className="grid min-w-0 grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-2 sm:gap-3">
          <div className="relative row-span-2 min-h-[260px] overflow-hidden rounded-md border" style={{ borderColor: "var(--t-line)" }}>
            <Foto src={d.heroImagem} alt="" className="absolute inset-0 size-full object-cover" />
          </div>
          <div className="overflow-hidden rounded-md border" style={{ borderColor: "var(--t-line)" }}>
            <Foto src={fotoB} alt="" className="aspect-[4/3] size-full object-cover" />
          </div>
          <div className="overflow-hidden rounded-md border" style={{ borderColor: "var(--t-line)" }}>
            <Foto src={fotoC} alt="" className="aspect-[4/3] size-full object-cover" />
          </div>
        </div>
      </section>

      {!d.demo ? <div className={`${wrapE} pb-10`}><BlocoConfianca /></div> : null}

      {/* Selos informativos */}
      <section className="border-y" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }} aria-label="Condições para empresas">
        <ul className={`${wrapE} grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-4`}>
          {SELOS.map(({ Icone, titulo, texto }, i) => (
            <li key={titulo} className={`flex min-w-0 gap-3 px-1 py-5 sm:px-4 ${i % 2 ? "border-l" : ""} ${i > 1 ? "border-t lg:border-t-0" : ""} ${i > 0 ? "lg:border-l" : ""}`} style={{ borderColor: "var(--t-line)" }}>
              <Icone className="mt-0.5 size-5 shrink-0" style={{ color: "var(--t-primary)" }} aria-hidden="true" />
              <div className="min-w-0 pl-0.5">
                <p className="text-sm font-bold">{titulo}</p>
                <p className="mt-0.5 text-[13px] leading-snug" style={{ color: "var(--t-muted)" }}>{texto}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Como funciona */}
      <section id="como" className={`${wrapE} scroll-mt-4 py-16 sm:py-20`} aria-labelledby="emp-como">
        <Rotulo>Como funciona</Rotulo>
        <h2 id="emp-como" className="mt-3 max-w-2xl text-3xl sm:text-4xl" style={{ fontFamily: "var(--t-titulo)", fontWeight: 700, letterSpacing: "-0.02em" }}>Do pedido à entrega em três passos</h2>
        <ol className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-3">
          {PASSOS.map(({ Icone, titulo, texto }, i) => (
            <li key={titulo} className="relative min-w-0 rounded-md border p-6" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>
              <div className="flex items-start justify-between">
                <span className="text-5xl leading-none tabular-nums" style={{ fontFamily: "var(--t-detalhe)", fontWeight: 700, color: "color-mix(in srgb, var(--t-primary) 30%, var(--t-surface))" }} aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <span className="grid size-10 place-items-center rounded-md" style={{ background: "color-mix(in srgb, var(--t-accent) 45%, var(--t-surface))", color: "var(--t-fg)" }}><Icone className="size-5" aria-hidden="true" /></span>
              </div>
              <h3 className="mt-6 text-xl" style={{ fontFamily: "var(--t-titulo)", fontWeight: 700 }}><span className="sr-only">Passo {i + 1}: </span>{titulo}</h3>
              <p className="mt-2 leading-relaxed" style={{ color: "var(--t-muted)" }}>{texto}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Linhas e cestas */}
      <section className="border-y py-16 sm:py-20" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }} aria-labelledby="emp-cestas">
        <div className={wrapE}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Rotulo>Catálogo</Rotulo>
              <h2 id="emp-cestas" className="mt-3 text-3xl sm:text-4xl" style={{ fontFamily: "var(--t-titulo)", fontWeight: 700, letterSpacing: "-0.02em" }}>Cestas para pedir em quantidade</h2>
            </div>
            <a href={todas} className="inline-flex min-h-11 items-center gap-2 rounded-md border px-4 text-sm font-semibold" style={{ borderColor: "var(--t-primary)", color: "var(--t-primary)" }}>Ver catálogo completo <ArrowRight className="size-4" aria-hidden="true" /></a>
          </div>

          {d.categorias.length ? (
            <div className="mt-7 flex flex-wrap gap-2" aria-label="Linhas por ocasião">
              {d.categorias.map((c) => (
                <a key={c.slug} href={c.href} className="inline-flex min-h-11 items-center rounded-md border px-4 text-sm font-semibold" style={{ borderColor: "var(--t-line)", background: "var(--t-bg)" }}>{c.nome}</a>
              ))}
            </div>
          ) : null}

          <div className="mt-8 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 sm:gap-5 lg:grid-cols-3">
            {mais.map((c, i) => (
              <a key={c.href + i} href={c.href} className="group block min-w-0">
                <div className="overflow-hidden rounded-md border" style={{ borderColor: "var(--t-line)", background: "var(--t-bg)" }}>
                  <Foto src={c.imagem} alt={c.nome} className="aspect-[4/3] w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.03]" />
                  <div className="p-3 sm:p-4">
                    <p className="line-clamp-2 min-h-[2.5em] text-[15px] leading-snug font-bold sm:text-base">{c.nome}</p>
                    {c.serve ? <p className="mt-0.5 text-xs" style={{ color: "var(--t-muted)" }}>{c.serve}</p> : null}
                    <p className="mt-3 flex flex-wrap items-baseline gap-x-2 border-t pt-3" style={{ borderColor: "var(--t-line)" }}>
                      <span className="text-xs" style={{ color: "var(--t-muted)" }}>a partir de</span>
                      <span className="text-lg font-bold tabular-nums" style={{ color: "var(--t-primary)" }}>{brl(c.preco)}</span>
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {!d.demo ? (
        <>
          <div className={`${wrapE} min-w-0 pt-16 sm:pt-20`}><BlocoVitrines base={d.base} Cartao={Cartao} /></div>
          <section className={`${wrapE} min-w-0 pt-16 sm:pt-20`} aria-labelledby="emp-todas">
            <Rotulo>Catálogo completo</Rotulo>
            <h2 id="emp-todas" className="mt-3 mb-8 text-3xl sm:text-4xl" style={{ fontFamily: "var(--t-titulo)", fontWeight: 700, letterSpacing: "-0.02em" }}>Todas as cestas</h2>
            <BlocoGradeOrdenavel base={d.base} Cartao={Cartao} classeGrade="grid gap-2.5" />
          </section>
          <div className={`${wrapE} min-w-0 pt-16 sm:pt-20`}><BlocoAvaliacoes /></div>
          <div className={`${wrapE} min-w-0 pt-16 sm:pt-20`}><BlocoBeneficios /></div>
          <div className={`${wrapE} min-w-0 pt-16 sm:pt-20`}><BlocoCartaozinho /></div>
          <div className={`${wrapE} min-w-0 pt-16 sm:pt-20`}><BlocoFaq /></div>
          <div className={`${wrapE} min-w-0 pt-16 sm:pt-20`}><BlocoWhatsapp /></div>
          <div className={`${wrapE} min-w-0 py-16 sm:py-20`}><BlocoVistos base={d.base} Cartao={Cartao} /></div>
          <JsonLdHome nome={d.loja} />
        </>
      ) : null}

      {/* Tabela de quantidades (exemplo): só na demonstração */}
      {d.demo ? (<>
      <section id="quantidades" className={`${wrapE} scroll-mt-4 grid grid-cols-[minmax(0,1fr)] gap-10 py-16 sm:py-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14`} aria-labelledby="emp-qtd">
        <div className="min-w-0">
          <Rotulo>Tabela de quantidades</Rotulo>
          <h2 id="emp-qtd" className="mt-3 text-3xl sm:text-4xl" style={{ fontFamily: "var(--t-titulo)", fontWeight: 700, letterSpacing: "-0.02em" }}>Quanto mais cestas, melhor a condição</h2>
          <p className="mt-4 text-lg leading-relaxed" style={{ color: "var(--t-muted)" }}>Cada loja define as suas faixas de quantidade. A tabela ao lado mostra como elas aparecem para o cliente.</p>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--t-muted)" }}>Valores de exemplo: servem só para ilustrar o modelo.</p>
        </div>
        <TabelaExemplo d={d} />
      </section>

      {/* Pedido de orçamento */}
      <section id="orcamento" className="scroll-mt-4 border-t py-16 sm:py-20" style={{ borderColor: "var(--t-line)", background: "color-mix(in srgb, var(--t-accent) 14%, var(--t-bg))" }} aria-labelledby="emp-orc">
        <div className={`${wrapE} grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14`}>
          <div className="min-w-0">
            <Rotulo>Pedido de orçamento</Rotulo>
            <h2 id="emp-orc" className="mt-3 text-3xl sm:text-4xl" style={{ fontFamily: "var(--t-titulo)", fontWeight: 700, letterSpacing: "-0.02em" }}>Conte o que a sua empresa precisa</h2>
            <p className="mt-4 text-lg leading-relaxed">Informe quantas cestas e para quando. Se já souber qual cesta quer, escolha no catálogo e adicione ao orçamento.</p>
            <a href={todas} className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-bold underline">Escolher no catálogo <ArrowRight className="size-4" aria-hidden="true" /></a>
          </div>
          <FormOrcamento demo={d.demo} whatsapp={d.whatsapp} base={d.base} loja={d.loja} />
        </div>
      </section>
      </>) : null}
    </main>
  );
}
