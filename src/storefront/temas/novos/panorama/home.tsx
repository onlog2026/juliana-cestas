import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Foto, brl } from "../../kit";
import type { DadosLoja } from "../../types";
import { BlocoAvaliacoes, BlocoBannersPromo, BlocoBeneficios, BlocoCartaozinho, BlocoConfianca, BlocoFaq, BlocoGradeOrdenavel, BlocoVistos, BlocoVitrines, BlocoWhatsapp, JsonLdHome } from "../../blocos";
import { ALTURA_TELA } from "./estilo";
import { Cartao } from "./cartao";

/** Faixa dos blocos reais da loja ao vivo: mesma medida do modelo, título no tipo do modelo. */
function Faixa({ children, fundo = "var(--t-bg)" }: { children: ReactNode; fundo?: string }) {
  return (
    <section className="border-t py-14 sm:py-20" style={{ borderColor: "var(--t-line)", background: fundo }}>
      <div className="mx-auto w-full min-w-0 max-w-[2000px] px-5 sm:px-8">{children}</div>
    </section>
  );
}

/** PANORAMA (início) — seções de tela inteira: foto numa metade, texto na outra, alternando os lados. */

function Metade({ lado, imagem, alt, fundo, children }: { lado: "foto-direita" | "foto-esquerda"; imagem: string; alt: string; fundo: string; children: ReactNode }) {
  const inverte = lado === "foto-esquerda";
  return (
    <section className={`grid grid-cols-[minmax(0,1fr)] lg:grid-cols-2 ${ALTURA_TELA}`} style={{ background: fundo }}>
      <div className={`relative aspect-[4/5] min-w-0 overflow-hidden sm:aspect-[16/10] lg:aspect-auto ${ALTURA_TELA} ${inverte ? "" : "lg:order-2"}`}>
        <Foto src={imagem} alt={alt} className="pn-foto absolute inset-0 size-full object-cover" />
      </div>
      <div className={`flex min-w-0 items-center px-6 py-14 sm:px-12 lg:px-16 xl:px-24 ${inverte ? "" : "lg:order-1"}`}>
        <div className="pn-rev w-full max-w-xl min-w-0">{children}</div>
      </div>
    </section>
  );
}

export function Home({ d }: { d: DadosLoja }) {
  const destaques = d.cestas.slice(0, 4);
  const ultima = d.categorias[d.categorias.length - 1];
  return (
    <main>
      <Metade lado="foto-direita" imagem={d.heroImagem} alt="" fundo="var(--t-bg)">
        <p className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "var(--t-primary)" }}>{d.aviso}</p>
        <h1 className="mt-6 text-[clamp(2.5rem,6.2vw,5.75rem)] leading-[0.98] tracking-tight" style={{ fontFamily: "var(--t-titulo)" }}>{d.titulo}</h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed" style={{ color: "var(--t-muted)" }}>{d.texto}</p>
        <a href={`${d.base}/categoria`} className="pn-link mt-10 inline-flex min-h-11 items-center gap-2 font-medium">Ver as cestas <ArrowRight className="size-4" aria-hidden="true" /></a>
      </Metade>

      {!d.demo ? (
        <>
          <BlocoBannersPromo />
          <Faixa fundo="var(--t-surface)"><BlocoConfianca /></Faixa>
        </>
      ) : null}

      {destaques.map((c, n) => (
        <Metade key={c.href} lado={n % 2 === 0 ? "foto-esquerda" : "foto-direita"} imagem={c.imagem} alt={c.nome} fundo={n % 2 === 0 ? "var(--t-surface)" : "var(--t-bg)"}>
          <p className="text-sm tracking-[0.2em] tabular-nums" style={{ color: "var(--t-primary)" }}>{String(n + 1).padStart(2, "0")} / {String(destaques.length).padStart(2, "0")}</p>
          <h2 className="mt-5 text-[clamp(2rem,4.4vw,4rem)] leading-[1.02] tracking-tight" style={{ fontFamily: "var(--t-titulo)" }}>{c.nome}</h2>
          <p className="mt-5 text-lg" style={{ color: "var(--t-muted)" }}>{c.serve || "Entrega com data e horário marcados."}</p>
          <p className="mt-6 text-3xl tabular-nums" style={{ fontFamily: "var(--t-titulo)" }}>
            {c.precoDe ? <s className="mr-3 text-lg" style={{ color: "var(--t-muted)" }}>{brl(c.precoDe)}</s> : null}
            {brl(c.preco)}
          </p>
          <a href={c.href} className="pn-link mt-8 inline-flex min-h-11 items-center gap-2 font-medium">Conhecer a cesta <ArrowRight className="size-4" aria-hidden="true" /></a>
        </Metade>
      ))}

      <section className={`grid grid-cols-[minmax(0,1fr)] lg:grid-cols-2 ${ALTURA_TELA}`} style={{ background: "var(--t-bg)" }} aria-labelledby="colecoes">
        <div className="flex min-w-0 items-center px-6 py-14 sm:px-12 lg:px-16 xl:px-24">
          <div className="pn-rev w-full max-w-xl min-w-0">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "var(--t-primary)" }}>Coleções</p>
            <h2 id="colecoes" className="mt-4 text-[clamp(2rem,4vw,3.5rem)] leading-tight" style={{ fontFamily: "var(--t-titulo)" }}>Escolha pela ocasião</h2>
            <ul className="mt-8 border-t" style={{ borderColor: "var(--t-line)" }}>
              {d.categorias.map((c) => (
                <li key={c.slug} className="border-b" style={{ borderColor: "var(--t-line)" }}>
                  <a href={c.href} className="group flex min-h-16 items-center justify-between gap-4 text-2xl sm:text-3xl" style={{ fontFamily: "var(--t-titulo)" }}>
                    <span className="min-w-0 truncate">{c.nome}</span>
                    <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className={`relative aspect-[4/3] min-w-0 overflow-hidden lg:aspect-auto ${ALTURA_TELA}`}>
          <Foto src={ultima?.imagem ?? d.heroImagem} alt="" className="pn-foto absolute inset-0 size-full object-cover" />
        </div>
      </section>

      {!d.demo ? (
        <>
          <Faixa><BlocoVitrines base={d.base} Cartao={Cartao} /></Faixa>
          <Faixa fundo="var(--t-surface)">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "var(--t-primary)" }}>Catálogo</p>
            <div className="mt-4">
              <BlocoGradeOrdenavel
                base={d.base}
                Cartao={Cartao}
                titulo="Todas as cestas"
                classeGrade="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 lg:grid-cols-4 lg:gap-6"
              />
            </div>
          </Faixa>
          <Faixa><BlocoAvaliacoes /></Faixa>
          <Faixa fundo="var(--t-surface)"><BlocoBeneficios /></Faixa>
          <Faixa><BlocoCartaozinho /></Faixa>
          <Faixa fundo="var(--t-surface)"><BlocoFaq /></Faixa>
          <Faixa><BlocoWhatsapp /></Faixa>
          <Faixa fundo="var(--t-surface)"><BlocoVistos base={d.base} Cartao={Cartao} /></Faixa>
          <JsonLdHome nome={d.loja} />
        </>
      ) : null}

      <section className="px-6 py-24 text-center sm:py-32" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>
        <p className="pn-rev mx-auto max-w-4xl text-[clamp(1.75rem,4vw,3.25rem)] leading-tight" style={{ fontFamily: "var(--t-titulo)" }}>Cada cesta é montada à mão e chega no dia e no horário que você escolher.</p>
        <a href={`${d.base}/categoria`} className="mt-10 inline-flex min-h-12 items-center gap-2 rounded-full border px-8 font-medium" style={{ borderColor: "var(--t-on-primary)" }}>Escolher minha cesta <ArrowRight className="size-4" aria-hidden="true" /></a>
      </section>
    </main>
  );
}
