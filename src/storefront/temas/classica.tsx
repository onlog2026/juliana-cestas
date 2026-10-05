import { Gift, Search, ShoppingBag, Truck, User } from "lucide-react";
import { Foto, brl } from "./kit";
import { BlocoAvaliacoes, BlocoBannersPromo, BlocoBeneficios, BlocoCartaozinho, BlocoConfianca, BlocoFaq, BlocoGradeOrdenavel, BlocoVistos, BlocoVitrines, BlocoWhatsapp, JsonLdHome } from "./blocos";
import { Cartao } from "./internas/classica";
import type { DadosLoja } from "./types";

/** CLÁSSICA — a vitrine da Juliana: faixa de aviso, carrossel com texto, categorias em círculo, cartão com moldura. */
export function HomeClassica({ d }: { d: DadosLoja }) {
  return (
    <>

      <section className="relative">
        <Foto src={d.heroImagem} alt="" className="aspect-[4/5] w-full object-cover sm:aspect-[21/8]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 max-w-[2000px] p-6 sm:p-12">
          <h1 className="max-w-3xl text-3xl text-white sm:text-5xl" style={{ fontFamily: "var(--t-titulo)", textShadow: "0 2px 14px rgba(0,0,0,.4)" }}>{d.titulo}</h1>
          <span className="mt-4 inline-flex h-11 items-center rounded-full px-6 text-sm font-semibold" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>Ver cestas</span>
        </div>
      </section>

      {!d.demo ? <BlocoBannersPromo /> : null}

      <div className="mx-auto max-w-[2000px] px-5">
        <div className="flex flex-wrap gap-6 py-8">
          {d.categorias.map((c) => (
            <div key={c.nome} className="flex w-20 flex-col items-center gap-2 text-center text-xs sm:w-24 sm:text-sm">
              <span className="size-16 overflow-hidden rounded-full border-[3px] sm:size-20" style={{ borderColor: "var(--t-accent)" }}>
                <Foto src={c.imagem} alt="" className="size-full object-cover" />
              </span>
              {c.nome}
            </div>
          ))}
        </div>

        <h2 className="text-2xl sm:text-3xl" style={{ fontFamily: "var(--t-titulo)" }}>Nossas cestas</h2>
        <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4">
          {d.cestas.map((c) => (
            <a key={c.nome} href={c.href} className="block">
              <div className="rounded-2xl border bg-white p-1.5" style={{ borderColor: "var(--t-line)" }}>
                <Foto src={c.imagem} alt={c.nome} className="aspect-[4/5] w-full rounded-[10px] object-cover" />
              </div>
              <p className="mt-3 line-clamp-2 text-[15px] font-semibold">{c.nome}{c.serve ? <span className="ml-1.5 text-xs font-normal" style={{ color: "var(--t-muted)" }}>· {c.serve}</span> : null}</p>
              <p className="mt-1 text-lg font-bold">{brl(c.preco)}</p>
            </a>
          ))}
        </div>

        <div className="my-14 grid gap-4 rounded-2xl p-6 sm:grid-cols-3" style={{ background: "var(--t-surface)" }}>
          {[[Truck, "Entrega com data e horário"], [Gift, "Cartão de mensagem grátis"], [ShoppingBag, "PIX e cartão"]].map(([Icon, t]) => {
            const I = Icon as typeof Truck;
            return <p key={t as string} className="flex items-center gap-3 text-sm"><I className="size-5" style={{ color: "var(--t-primary)" }} />{t as string}</p>;
          })}
        </div>
      </div>

      {!d.demo ? (
        <div className="mx-auto grid max-w-[2000px] gap-14 px-5 pb-14">
          <BlocoConfianca />
          <BlocoVitrines base={d.base} Cartao={Cartao} />
          <BlocoGradeOrdenavel base={d.base} Cartao={Cartao} titulo="Todas as cestas" classeGrade="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4" />
          <BlocoAvaliacoes />
          <BlocoBeneficios />
          <BlocoCartaozinho />
          <BlocoFaq />
          <BlocoWhatsapp />
          <BlocoVistos base={d.base} Cartao={Cartao} />
          <JsonLdHome nome={d.loja} />
        </div>
      ) : null}

    </>
  );
}
