import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Foto, brl } from "../../kit";
import type { DadosLoja } from "../../types";
import { BlocoAvaliacoes, BlocoBannersPromo, BlocoBeneficios, BlocoCartaozinho, BlocoConfianca, BlocoFaq, BlocoGradeOrdenavel, BlocoVistos, BlocoVitrines, BlocoWhatsapp, JsonLdHome } from "../../blocos";
import Contador from "./contador";
import { Cartao as CartaoProduto } from "./internas";

/** PROMO — banners empilhados com contador do dia, "Mais vendidas" em grade densa, selos de desconto só quando há preço "de". */

type Cesta = DadosLoja["cestas"][number];
const pct = (c: Cesta) => (c.precoDe && c.precoDe > c.preco ? Math.round((1 - c.preco / c.precoDe) * 100) : null);

function Selo({ valor }: { valor: number }) {
  return (
    <span className="absolute top-2 left-2 flex size-14 -rotate-6 flex-col items-center justify-center rounded-full text-center leading-none font-bold" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)", fontFamily: "var(--t-titulo)" }}>
      <span className="text-xl">-{valor}%</span>
      <span className="text-[9px] tracking-wider uppercase">off</span>
    </span>
  );
}

function Cartao({ c }: { c: Cesta }) {
  const desc = pct(c);
  return (
    <a href={c.href} className="group flex min-w-0 flex-col">
      <div className="relative overflow-hidden rounded-md border-2" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>
        <Foto src={c.imagem} alt={c.nome} className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {desc ? <Selo valor={desc} /> : null}
      </div>
      <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-snug font-medium">{c.nome}</p>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
        {c.precoDe ? <s className="text-xs" style={{ color: "var(--t-muted)" }}>{brl(c.precoDe)}</s> : null}
        <span className="text-xl leading-tight font-bold tabular-nums" style={{ fontFamily: "var(--t-titulo)", color: "var(--t-primary)" }}>{brl(c.preco)}</span>
      </div>
      <span className="mt-2 inline-flex min-h-11 items-center justify-center rounded text-sm font-bold tracking-wide uppercase" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>Adicionar</span>
    </a>
  );
}

/** Contêiner dos blocos reais da loja ao vivo: anula o respiro do <main> (os blocos já trazem o seu). */
function Faixa({ children }: { children: ReactNode }) {
  return <div className="-mx-4 mt-6 sm:-mx-6">{children}</div>;
}

export function Home({ d }: { d: DadosLoja }) {
  const [b1, b2] = d.cestas;
  const vendidas = d.cestas.slice(0, 10);
  return (
    <main className="mx-auto max-w-[2000px] px-4 py-5 sm:px-6 sm:py-8">
      {/* Banner principal + contador */}
      <section className="grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-lg border-2 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]" style={{ borderColor: "var(--t-fg)" }} aria-label="Oferta do dia">
        <div className="flex min-w-0 flex-col justify-center gap-5 p-6 sm:p-10" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>
          <p className="w-fit rounded px-3 py-1 text-xs font-bold tracking-widest uppercase" style={{ background: "var(--t-on-primary)", color: "var(--t-primary)" }}>Oferta do dia</p>
          <h1 className="text-[clamp(2.4rem,6vw,4.8rem)] leading-[0.95] font-bold uppercase" style={{ fontFamily: "var(--t-titulo)" }}>{d.titulo}</h1>
          <p className="max-w-md text-base sm:text-lg">{d.texto}</p>
          <div className="w-fit rounded-md p-3" style={{ background: "var(--t-bg)", color: "var(--t-fg)" }}>
            <Contador />
          </div>
          <a href={`${d.base}/categoria`} className="inline-flex min-h-12 w-fit items-center gap-2 rounded border-2 px-6 text-sm font-bold tracking-wide uppercase" style={{ background: "var(--t-bg)", color: "var(--t-fg)", borderColor: "var(--t-bg)" }}>
            Ver todas as ofertas <ArrowRight className="size-4" aria-hidden="true" />
          </a>
        </div>
        <Foto src={d.heroImagem} alt="" className="aspect-[4/3] size-full object-cover lg:aspect-auto lg:min-h-[420px]" />
      </section>

      {!d.demo ? <Faixa><BlocoBannersPromo /></Faixa> : null}
      {!d.demo ? <Faixa><BlocoConfianca /></Faixa> : null}

      {/* Dois banners */}
      <section className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2" aria-label="Destaques">
        {[b1, b2].map((b, i) => b ? (
          <a key={b.href} href={b.href} className="group block min-w-0">
            <div className="relative overflow-hidden rounded-lg border-2" style={{ borderColor: "var(--t-line)" }}>
              <Foto src={b.imagem} alt={b.nome} className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              {pct(b) ? <Selo valor={pct(b) as number} /> : null}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-4 py-3" style={{ background: "var(--t-fg)", color: "var(--t-bg)" }}>
                <div className="min-w-0">
                  <p className="text-xs font-bold tracking-widest uppercase">{i === 0 ? "Destaque 1" : "Destaque 2"}</p>
                  <p className="truncate text-lg font-bold uppercase" style={{ fontFamily: "var(--t-titulo)" }}>{b.nome}</p>
                </div>
                <p className="shrink-0 text-right text-sm"><span className="block text-[11px] uppercase">a partir de</span><span className="text-xl font-bold tabular-nums" style={{ fontFamily: "var(--t-titulo)" }}>{brl(b.preco)}</span></p>
              </div>
            </div>
          </a>
        ) : null)}
      </section>

      {/* Categorias em blocos */}
      <section className="mt-10" aria-labelledby="deptos">
        <h2 id="deptos" className="text-2xl font-bold uppercase sm:text-3xl" style={{ fontFamily: "var(--t-titulo)" }}>Compre por departamento</h2>
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {d.categorias.map((c) => (
            <a key={c.slug} href={c.href} className="group block min-w-0">
              <div className="relative overflow-hidden rounded-md border-2" style={{ borderColor: "var(--t-line)" }}>
                <Foto src={c.imagem} alt="" className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute inset-x-0 bottom-0 px-3 py-2 text-sm font-bold uppercase" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)", fontFamily: "var(--t-titulo)" }}>{c.nome}</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Mais vendidas */}
      <section className="mt-10" aria-labelledby="vendidas">
        <div className="flex items-end justify-between gap-4 border-b-4 pb-2" style={{ borderColor: "var(--t-primary)" }}>
          <h2 id="vendidas" className="text-2xl font-bold uppercase sm:text-3xl" style={{ fontFamily: "var(--t-titulo)" }}>Mais vendidas</h2>
          <a href={`${d.base}/categoria`} className="inline-flex min-h-11 items-center text-sm font-bold uppercase underline">Ver todas</a>
        </div>
        <div className="mt-5 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
          {vendidas.map((c) => <Cartao key={c.href} c={c} />)}
        </div>
      </section>

      {!d.demo ? (
        <>
          <Faixa><BlocoVitrines base={d.base} Cartao={CartaoProduto} /></Faixa>
          <section className="mt-10" aria-labelledby="todas">
            <div className="border-b-4 pb-2" style={{ borderColor: "var(--t-primary)" }}>
              <h2 id="todas" className="text-2xl font-bold uppercase sm:text-3xl" style={{ fontFamily: "var(--t-titulo)" }}>Todas as ofertas</h2>
            </div>
            <div className="mt-5">
              <BlocoGradeOrdenavel
                base={d.base}
                Cartao={CartaoProduto}
                classeGrade="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-5"
              />
            </div>
          </section>
          <Faixa><BlocoAvaliacoes /></Faixa>
        </>
      ) : null}

      {/* Frete e entrega */}
      <section className="mt-12 rounded-lg p-5 sm:p-8" style={{ background: "var(--t-surface)" }} aria-labelledby="entrega">
        <h2 id="entrega" className="text-2xl font-bold uppercase sm:text-3xl" style={{ fontFamily: "var(--t-titulo)" }}>Frete e entrega</h2>
        <ol className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-3">
          {[["1", "Escolha a cesta", "Veja as ofertas do dia e adicione ao carrinho."], ["2", "Marque dia e horário", "A entrega chega quando você escolher."], ["3", "Escreva o cartão", "Sua mensagem vai junto, escrita à mão."]].map(([n, t, x]) => (
            <li key={n} className="flex min-w-0 items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full text-2xl font-bold" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)", fontFamily: "var(--t-titulo)" }}>{n}</span>
              <div className="min-w-0"><p className="font-bold uppercase">{t}</p><p className="text-sm" style={{ color: "var(--t-muted)" }}>{x}</p></div>
            </li>
          ))}
        </ol>
      </section>

      {!d.demo ? (
        <>
          <Faixa><BlocoBeneficios /></Faixa>
          <Faixa><BlocoCartaozinho /></Faixa>
          <Faixa><BlocoFaq /></Faixa>
          <Faixa><BlocoWhatsapp /></Faixa>
          <Faixa><BlocoVistos base={d.base} Cartao={CartaoProduto} /></Faixa>
          <JsonLdHome nome={d.loja} />
        </>
      ) : null}
    </main>
  );
}
