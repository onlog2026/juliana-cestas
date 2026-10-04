import { ShoppingBag } from "lucide-react";
import { Foto, brl } from "./kit";
import type { DadosLoja } from "./types";

const PASTEIS = ["color-mix(in srgb, var(--t-primary) 14%, white)", "color-mix(in srgb, var(--t-accent) 22%, white)", "color-mix(in srgb, var(--t-primary) 8%, var(--t-accent) 12%)"];

/** FESTA — colorido e arredondado: pílulas, formas na abertura, cartões pastel e preço em etiqueta. */
export function HomeFesta({ d }: { d: DadosLoja }) {
  return (
    <>

      <section className="relative mx-3 overflow-hidden rounded-[2.5rem] sm:mx-5" style={{ background: "var(--t-primary)" }}>
        <span className="absolute -top-10 -left-10 size-48 rounded-full opacity-70" style={{ background: "var(--t-accent)" }} aria-hidden="true" />
        <span className="absolute right-[40%] -bottom-16 size-40 rounded-full bg-white/25" aria-hidden="true" />
        <span className="absolute top-8 right-8 size-16 rounded-full bg-white/30" aria-hidden="true" />
        <div className="relative grid items-center gap-8 p-8 sm:p-14 md:grid-cols-2">
          <div style={{ color: "var(--t-on-primary)" }}>
            <h1 className="text-4xl leading-[0.98] font-extrabold sm:text-6xl" style={{ fontFamily: "var(--t-titulo)" }}>{d.titulo}</h1>
            <p className="mt-4 text-lg opacity-95">{d.texto}</p>
            <span className="mt-6 inline-flex h-12 items-center rounded-full bg-white px-7 font-extrabold" style={{ color: "var(--t-primary)" }}>Quero a minha!</span>
          </div>
          <Foto src={d.heroImagem} alt="" className="mx-auto aspect-square w-full max-w-md rotate-3 rounded-[2rem] border-8 border-white object-cover shadow-xl" />
        </div>
      </section>

      <div className="mx-auto max-w-[1300px] px-5">
        <div className="flex flex-wrap justify-center gap-5 py-10">
          {d.categorias.map((c, i) => (
            <div key={c.nome} className="flex flex-col items-center gap-2 text-sm font-bold">
              <span className="size-20 overflow-hidden rounded-full border-4 sm:size-24" style={{ borderColor: i % 2 ? "var(--t-accent)" : "var(--t-primary)" }}>
                <Foto src={c.imagem} alt="" className="size-full object-cover" />
              </span>
              {c.nome}
            </div>
          ))}
        </div>

        <h2 className="text-center text-4xl font-extrabold" style={{ fontFamily: "var(--t-titulo)" }}>As mais animadas</h2>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {d.cestas.map((c, i) => (
            <a key={c.nome + i} href={c.href} className="relative block rounded-[1.75rem] p-3 pb-5" style={{ background: PASTEIS[i % 3] }}>
              <Foto src={c.imagem} alt={c.nome} className="aspect-square w-full rounded-[1.25rem] object-cover" />
              <span className="absolute top-5 right-5 -rotate-6 rounded-full px-3 py-1 text-sm font-extrabold shadow" style={{ background: "var(--t-accent)", color: "var(--t-fg)" }}>{brl(c.preco)}</span>
              <p className="mt-3 px-1 text-base leading-tight font-extrabold" style={{ fontFamily: "var(--t-titulo)" }}>{c.nome}</p>
              {c.serve ? <p className="px-1 text-xs" style={{ color: "var(--t-muted)" }}>{c.serve}</p> : null}
            </a>
          ))}
        </div>
      </div>

    </>
  );
}
