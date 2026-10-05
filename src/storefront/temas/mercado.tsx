import { CreditCard, Headphones, Search, ShieldCheck, ShoppingCart, Truck, User } from "lucide-react";
import { Foto, brl } from "./kit";
import { BlocoAvaliacoes, BlocoBannersPromo, BlocoBeneficios, BlocoCartaozinho, BlocoConfianca, BlocoFaq, BlocoGradeOrdenavel, BlocoVistos, BlocoVitrines, BlocoWhatsapp, JsonLdHome } from "./blocos";
import { Cartao } from "./internas/mercado";
import type { DadosLoja } from "./types";

/** MERCADO — utilitário e denso: busca larga, banners em grade, ofertas com botão Adicionar. */
export function HomeMercado({ d }: { d: DadosLoja }) {
  const [b1, b2, b3] = d.cestas;
  const card = (c: DadosLoja["cestas"][number], i: number) => {
    const desconto = c.precoDe && c.precoDe > c.preco ? Math.round((1 - c.preco / c.precoDe) * 100) : i % 3 === 0 ? 10 : 0;
    const de = c.precoDe && c.precoDe > c.preco ? c.precoDe : desconto ? c.preco / (1 - desconto / 100) : 0;
    return (
      <a key={c.nome + i} href={c.href} className="flex flex-col rounded-lg border bg-white p-3" style={{ borderColor: "var(--t-line)" }}>
        <div className="relative">
          <Foto src={c.imagem} alt={c.nome} className="aspect-square w-full rounded-md object-cover" />
          {desconto ? <span className="absolute top-2 left-2 rounded px-1.5 py-0.5 text-xs font-bold" style={{ background: "var(--t-accent)", color: "#141414" }}>-{desconto}%</span> : null}
        </div>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-snug">{c.nome}</p>
        {de ? <p className="mt-1 text-xs line-through" style={{ color: "var(--t-muted)" }}>{brl(de)}</p> : <p className="mt-1 text-xs" style={{ color: "var(--t-muted)" }}>&nbsp;</p>}
        <p className="text-lg font-extrabold" style={{ fontFamily: "var(--t-titulo)" }}>{brl(c.preco)}</p>
        <p className="text-xs" style={{ color: "var(--t-muted)" }}>ou 3x de {brl(c.preco / 3)}</p>
        <span className="mt-3 inline-flex h-10 items-center justify-center rounded-md text-sm font-semibold" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>Adicionar</span>
      </a>
    );
  };
  return (
    <>

      {!d.demo ? <BlocoBannersPromo /> : null}
      <div className="mx-auto max-w-[2000px] px-4 py-5">
        <section className="grid gap-3 md:grid-cols-3 md:grid-rows-2">
          {[b1, b2, b3].map((b, i) => b ? (
            <div key={b.nome} className={`relative overflow-hidden rounded-lg ${i === 0 ? "md:col-span-2 md:row-span-2" : ""}`}>
              <Foto src={i === 0 ? d.heroImagem : b.imagem} alt="" className={`w-full object-cover ${i === 0 ? "aspect-[16/9] md:h-full" : "aspect-[16/7]"}`} />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
              <div className="absolute inset-y-0 left-0 flex flex-col justify-center p-5 text-white sm:p-8">
                <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--t-accent)" }}>{i === 0 ? "Destaque" : "Oferta"}</p>
                <p className={`mt-1 max-w-sm font-extrabold leading-tight ${i === 0 ? "text-3xl sm:text-4xl" : "text-xl"}`} style={{ fontFamily: "var(--t-titulo)" }}>{i === 0 ? d.titulo : b.nome}</p>
                <span className="mt-3 inline-flex h-9 w-fit items-center rounded-md px-4 text-sm font-bold" style={{ background: "var(--t-accent)", color: "#141414" }}>Comprar</span>
              </div>
            </div>
          ) : null)}
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3 rounded-lg bg-white p-4 text-sm sm:grid-cols-4">
          {[[Truck, "Entrega agendada"], [CreditCard, "3x sem juros"], [ShieldCheck, "Compra segura"], [Headphones, "Atendimento rápido"]].map(([I, t]) => {
            const Icon = I as typeof Truck;
            return <p key={t as string} className="flex items-center gap-2 font-semibold"><Icon className="size-5" style={{ color: "var(--t-primary)" }} />{t as string}</p>;
          })}
        </section>

        <div className="mt-8 flex items-end justify-between">
          <h2 className="text-2xl font-extrabold" style={{ fontFamily: "var(--t-titulo)" }}>Ofertas da semana</h2>
          <span className="text-sm font-semibold" style={{ color: "var(--t-primary)" }}>Ver todas</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{d.cestas.slice(0, 10).map(card)}</div>
      </div>

      {!d.demo ? (
        <div className="mx-auto grid max-w-[2000px] gap-8 px-4 pt-8">
          <BlocoConfianca />
          <BlocoVitrines base={d.base} Cartao={Cartao} />
          <BlocoGradeOrdenavel base={d.base} Cartao={Cartao} titulo="Todas as cestas" classeGrade="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" />
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
