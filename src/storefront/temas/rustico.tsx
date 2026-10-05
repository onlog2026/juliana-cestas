import { ShoppingBasket } from "lucide-react";
import { Foto, brl } from "./kit";
import { BlocoAvaliacoes, BlocoBannersPromo, BlocoBeneficios, BlocoCartaozinho, BlocoConfianca, BlocoFaq, BlocoGradeOrdenavel, BlocoVistos, BlocoVitrines, BlocoWhatsapp, JsonLdHome } from "./blocos";
import { Cartao } from "./internas/rustico";
import type { DadosLoja } from "./types";

const PAPEL = {
  backgroundImage:
    "radial-gradient(color-mix(in srgb, var(--t-fg) 7%, transparent) 1px, transparent 1px), radial-gradient(color-mix(in srgb, var(--t-fg) 5%, transparent) 1px, transparent 1px)",
  backgroundSize: "18px 18px, 27px 27px",
  backgroundPosition: "0 0, 9px 13px",
};

/** RÚSTICO — papel kraft, polaroids inclinadas, bilhete escrito à mão e selo de feito à mão. */
export function HomeRustico({ d }: { d: DadosLoja }) {
  return (
    <div style={PAPEL}>
      {!d.demo ? <BlocoBannersPromo /> : null}

      <section className="mx-auto grid max-w-[2000px] items-center gap-10 px-6 py-12 md:grid-cols-[1.1fr_1fr]">
        <div className="relative mx-auto w-full max-w-xl -rotate-2 bg-white p-3 pb-14 shadow-[0_18px_40px_-18px_rgba(60,40,20,.5)]">
          <Foto src={d.heroImagem} alt="" className="aspect-[4/3] w-full object-cover" />
          <p className="absolute bottom-3 left-0 w-full text-center text-2xl" style={{ fontFamily: "var(--t-detalhe)", color: "var(--t-fg)" }}>feito hoje cedinho</p>
        </div>
        <div className="relative">
          <span className="absolute -top-20 right-0 hidden size-24 rotate-12 items-center sm:flex justify-center rounded-full border-2 border-dashed text-center text-xs leading-tight font-bold uppercase" style={{ borderColor: "var(--t-accent)", color: "var(--t-accent)" }}>Feito<br />à mão</span>
          <h1 className="text-3xl leading-tight sm:text-5xl" style={{ fontFamily: "var(--t-titulo)", fontWeight: 600 }}>{d.titulo}</h1>
          <p className="mt-4 text-lg" style={{ color: "var(--t-muted)" }}>{d.texto}</p>
          <div className="mt-6 inline-block rotate-1 px-5 py-3 text-2xl shadow-sm" style={{ background: "#fff8c7", fontFamily: "var(--t-detalhe)" }}>Encomende até as 16h ♡</div>
        </div>
      </section>

      <section className="mx-auto max-w-[2000px] px-6 pb-16">
        <h2 className="text-center text-4xl" style={{ fontFamily: "var(--t-detalhe)", color: "var(--t-primary)" }}>Nossas cestas da semana</h2>
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-3">
          {d.cestas.slice(0, 6).map((c, i) => (
            <a key={c.nome} href={c.href} className={`block bg-white p-2.5 pb-4 shadow-[0_12px_28px_-16px_rgba(60,40,20,.55)] ${i % 2 ? "rotate-[1.5deg]" : "-rotate-[1.5deg]"}`}>
              <Foto src={c.imagem} alt={c.nome} className="aspect-square w-full object-cover" />
              <p className="mt-3 text-center text-2xl leading-none" style={{ fontFamily: "var(--t-detalhe)" }}>{c.nome}</p>
              <p className="mt-1 text-center text-base" style={{ fontFamily: "var(--t-titulo)", color: "var(--t-accent)", fontWeight: 600 }}>{brl(c.preco)}</p>
            </a>
          ))}
        </div>
      </section>

      {!d.demo ? (
        <div className="mx-auto max-w-[2000px] px-6 pb-16">
          <BlocoConfianca />
          <div className="mt-14"><BlocoVitrines Cartao={Cartao} /></div>
          <section className="mt-16" aria-labelledby="todas-rustico">
            <h2 id="todas-rustico" className="mb-10 text-center text-4xl" style={{ fontFamily: "var(--t-detalhe)", color: "var(--t-primary)" }}>Todas as cestas da casa</h2>
            <BlocoGradeOrdenavel Cartao={Cartao} classeGrade="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-5 gap-y-10 px-1 sm:gap-x-8 lg:grid-cols-3 xl:grid-cols-4" />
          </section>
          <div className="mt-16"><BlocoAvaliacoes /></div>
          <div className="mt-16"><BlocoBeneficios /></div>
          <div className="mt-16"><BlocoCartaozinho /></div>
          <div className="mt-16"><BlocoFaq /></div>
          <div className="mt-16"><BlocoWhatsapp /></div>
          <div className="mt-16"><BlocoVistos Cartao={Cartao} /></div>
          <JsonLdHome />
        </div>
      ) : null}

    </div>
  );
}
