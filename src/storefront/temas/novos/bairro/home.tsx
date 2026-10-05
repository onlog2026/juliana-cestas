import { ArrowRight, CalendarCheck, Gift, MousePointerClick, PackageCheck } from "lucide-react";
import { Foto, brl } from "../../kit";
import type { DadosLoja } from "../../types";
import { Horarios, PediuHoje, Regioes, Retirada, SeloEntrega, Whats } from "./pecas";
import { linkWhats } from "./dados";
import { BlocoAvaliacoes, BlocoBannersPromo, BlocoBeneficios, BlocoCartaozinho, BlocoConfianca, BlocoFaq, BlocoGradeOrdenavel, BlocoVistos, BlocoVitrines, BlocoWhatsapp, JsonLdHome } from "../../blocos";
import { Cartao } from "./internas";

/**
 * BAIRRO — loja de vizinhança: abertura com o bloco "Pediu até 14h, chega hoje", chips de ocasião,
 * cartões com selo de entrega, horários + regiões e um grande convite para o WhatsApp.
 */
export function Home({ d }: { d: DadosLoja }) {
  const area = "mx-auto w-full max-w-[2000px] px-4 sm:px-6 lg:px-10";
  const passos: Array<[typeof Gift, string, string]> = [
    [MousePointerClick, "Escolha a cesta", "Veja as opções e adicione ao carrinho."],
    [CalendarCheck, "Marque o dia e a faixa", "Você define a data e o horário da entrega."],
    [PackageCheck, "Receba em casa", "Entregamos na região atendida, com o seu cartão."],
  ];
  return (
    <main>
      {!d.demo ? <BlocoBannersPromo /> : null}
      {!d.demo ? <div className={`${area} pt-4`}><BlocoConfianca /></div> : null}

      {/* Abertura */}
      <section className={`${area} grid grid-cols-[minmax(0,1fr)] items-center gap-8 py-8 sm:py-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14`}>
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide uppercase" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>
            <span className="size-2 rounded-full" style={{ background: "var(--t-accent)" }} aria-hidden="true" /> Loja do bairro
          </p>
          <h1 className="mt-4 text-[clamp(2rem,6.5vw,3.75rem)] leading-[1.05] font-bold [overflow-wrap:anywhere]" style={{ fontFamily: "var(--t-titulo)" }}>{d.titulo}</h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed" style={{ color: "var(--t-muted)" }}>{d.texto}</p>
          <PediuHoje className="mt-6 max-w-xl" />
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a href={`${d.base}/categoria`} className="inline-flex min-h-12 items-center gap-2 rounded-full px-6 font-semibold" style={{ background: "var(--t-fg)", color: "var(--t-bg)" }}>
              Escolher a cesta <ArrowRight className="size-4" aria-hidden="true" />
            </a>
            {linkWhats(d) ? <Whats d={d} texto="Pedir pelo WhatsApp" /> : null}
          </div>
        </div>
        <div className="relative min-w-0">
          <Foto src={d.heroImagem} alt={d.titulo} className="aspect-[5/4] w-full rounded-3xl object-cover sm:aspect-[16/11] lg:aspect-[4/5]" />
          <div className="absolute bottom-3 left-3 flex max-w-[85%] items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold sm:bottom-5 sm:left-5" style={{ background: "var(--t-surface)", borderColor: "var(--t-line)" }}>
            <PackageCheck className="size-5 shrink-0" style={{ color: "var(--t-primary)" }} aria-hidden="true" /> Entrega com data marcada
          </div>
        </div>
      </section>

      {/* Ocasiões */}
      <section className={`${area} py-6`} aria-labelledby="ocasioes">
        <h2 id="ocasioes" className="text-2xl font-bold sm:text-3xl" style={{ fontFamily: "var(--t-titulo)" }}>Escolha por ocasião</h2>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {d.categorias.map((c) => (
            <a key={c.slug} href={c.href} className="inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-sm font-semibold" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>
              {c.nome} <ArrowRight className="size-3.5" aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>

      {!d.demo ? <div className={`${area} py-4`}><BlocoVitrines base={d.base} Cartao={Cartao} /></div> : null}

      {/* Vitrine */}
      <section className={`${area} py-10`} aria-labelledby="vitrine">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="vitrine" className="text-2xl font-bold sm:text-3xl" style={{ fontFamily: "var(--t-titulo)" }}>Prontas para entregar na sua região</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--t-muted)" }}>Escolha o dia e a faixa de horário no pedido.</p>
          </div>
          <a href={`${d.base}/categoria`} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold underline underline-offset-4">Ver todas <ArrowRight className="size-4" aria-hidden="true" /></a>
        </div>
        <div className="mt-6 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 sm:gap-5 lg:grid-cols-4">
          {d.cestas.slice(0, 8).map((c) => (
            <a key={c.href} href={c.href} className="group block min-w-0">
              <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>
                <Foto src={c.imagem} alt={c.nome} className="aspect-[4/5] w-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.04]" />
                <div className="border-t border-dashed p-3" style={{ borderColor: "var(--t-line)" }}>
                  <p className="line-clamp-2 min-h-[2.5rem] text-sm leading-snug font-medium sm:text-base">{c.nome}</p>
                  <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
                    <span className="text-lg font-bold tabular-nums" style={{ fontFamily: "var(--t-titulo)" }}>{brl(c.preco)}</span>
                    {c.precoDe && c.precoDe > c.preco ? <s className="text-xs tabular-nums" style={{ color: "var(--t-muted)" }}>{brl(c.precoDe)}</s> : null}
                  </p>
                  <SeloEntrega className="mt-2" />
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {!d.demo ? (
        <section className={`${area} py-8`} aria-labelledby="todas-cestas">
          <h2 id="todas-cestas" className="sr-only">Todas as cestas</h2>
          <BlocoGradeOrdenavel base={d.base} Cartao={Cartao} titulo="Todas as cestas" classeGrade="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 sm:gap-5 lg:grid-cols-4" />
        </section>
      ) : null}

      {/* Horários e regiões */}
      <section className={`${area} py-6`} aria-labelledby="entrega">
        <h2 id="entrega" className="text-2xl font-bold sm:text-3xl" style={{ fontFamily: "var(--t-titulo)" }}>Como é a entrega</h2>
        <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
          <div className="min-w-0 rounded-2xl border p-5" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>
            <h3 className="mb-3 text-lg font-bold" style={{ fontFamily: "var(--t-titulo)" }}>Horários de entrega</h3>
            <Horarios d={d} />
          </div>
          <div className="min-w-0 rounded-2xl border p-5" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>
            <h3 className="mb-3 text-lg font-bold" style={{ fontFamily: "var(--t-titulo)" }}>Regiões atendidas</h3>
            <Regioes d={d} />
            <div className="mt-5 border-t pt-4" style={{ borderColor: "var(--t-line)" }}>
              <Retirada d={d} />
            </div>
          </div>
        </div>
      </section>

      {/* Passos */}
      <section className={`${area} py-10`} aria-labelledby="passos">
        <h2 id="passos" className="sr-only">Como pedir</h2>
        <ol className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-3">
          {passos.map(([Icone, titulo, texto], i) => (
            <li key={titulo} className="flex min-w-0 items-start gap-4 rounded-2xl p-5" style={{ background: "color-mix(in srgb, var(--t-primary) 8%, var(--t-bg))" }}>
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full text-lg font-bold" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)", fontFamily: "var(--t-titulo)" }}>{i + 1}</span>
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-bold"><Icone className="size-4" style={{ color: "var(--t-primary)" }} aria-hidden="true" /> {titulo}</p>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--t-muted)" }}>{texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {!d.demo ? (
        <div className={`${area} grid gap-8 py-6`}>
          <BlocoAvaliacoes />
          <BlocoBeneficios />
          <BlocoCartaozinho />
          <BlocoFaq />
        </div>
      ) : null}

      {/* WhatsApp */}
      {!d.demo ? <div className={`${area} py-4`}><BlocoWhatsapp /></div> : null}
      {d.demo ? (
      <section className={`${area} pb-4`} aria-labelledby="whats">
        <div className="relative overflow-hidden rounded-3xl px-6 py-10 sm:px-12 sm:py-14" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>
          <svg aria-hidden="true" viewBox="0 0 200 200" className="pointer-events-none absolute -top-10 -right-10 size-56 opacity-20 sm:size-72"><circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 8" /><circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 8" /></svg>
          <div className="relative max-w-2xl">
            <h2 id="whats" className="text-3xl leading-tight font-bold sm:text-4xl" style={{ fontFamily: "var(--t-titulo)" }}>Prefere combinar pelo WhatsApp?</h2>
            <p className="mt-3 text-lg leading-relaxed">Conte para quem é, o dia e o bairro. A gente indica a cesta ideal e confirma o horário.</p>
            <div className="mt-6">
              {linkWhats(d) ? (
                <a href={linkWhats(d, "Olá! Vim pelo site e quero fazer um pedido.") ?? undefined} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-full px-7 font-bold" style={{ background: "var(--t-on-primary)", color: "var(--t-primary)" }}>Chamar no WhatsApp <ArrowRight className="size-4" aria-hidden="true" /></a>
              ) : (
                <p className="inline-block rounded-2xl border border-dashed px-4 py-3 text-sm" style={{ borderColor: "color-mix(in srgb, var(--t-on-primary) 60%, transparent)" }}>Aqui aparece o botão de WhatsApp da loja, com o número que você cadastrar.</p>
              )}
            </div>
          </div>
        </div>
      </section>
      ) : null}

      {!d.demo ? <div className={`${area} py-6`}><BlocoVistos base={d.base} Cartao={Cartao} /></div> : null}
      {!d.demo ? <JsonLdHome nome={d.loja} /> : null}
    </main>
  );
}
