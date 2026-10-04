import { Search, ShoppingBag } from "lucide-react";
import { Foto, brl } from "./kit";
import type { DadosLoja } from "./types";

/** BOUTIQUE — branco, respiro, logo centralizado, foto de abertura limpa, cartões altos sem moldura. */
export function HomeBoutique({ d }: { d: DadosLoja }) {
  const [destaque, ...resto] = d.cestas;
  return (
    <>

      <Foto src={d.heroImagem} alt="" className="aspect-[4/5] w-full object-cover sm:aspect-[16/7]" />
      <section className="mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="text-3xl leading-tight sm:text-5xl" style={{ fontFamily: "var(--t-titulo)", fontWeight: 400 }}>{d.titulo}</h1>
        <p className="mt-4" style={{ color: "var(--t-muted)" }}>{d.texto}</p>
        <span className="mt-6 inline-block border-b pb-1 text-[12px] tracking-[0.25em] uppercase" style={{ borderColor: "var(--t-fg)" }}>Ver coleção</span>
      </section>

      <section className="mx-auto max-w-[1300px] px-5">
        <p className="text-center text-[11px] tracking-[0.3em] uppercase" style={{ color: "var(--t-accent)" }}>Seleção da casa</p>
        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-14 md:grid-cols-3">
          {resto.slice(0, 6).map((c) => (
            <a key={c.nome} href={c.href} className="block text-center">
              <Foto src={c.imagem} alt={c.nome} className="aspect-[3/4] w-full object-cover" />
              <p className="mt-4 text-xl" style={{ fontFamily: "var(--t-titulo)" }}>{c.nome}</p>
              <p className="mt-1 text-sm" style={{ color: "var(--t-muted)" }}>{brl(c.preco)}</p>
            </a>
          ))}
        </div>
      </section>

      {destaque ? (
        <section className="mx-auto mt-24 grid max-w-[1300px] items-center gap-10 px-5 md:grid-cols-2">
          <Foto src={destaque.imagem} alt={destaque.nome} className="aspect-square w-full object-cover" />
          <div className="md:px-10">
            <p className="text-[11px] tracking-[0.3em] uppercase" style={{ color: "var(--t-accent)" }}>A mais pedida</p>
            <p className="mt-4 text-4xl italic" style={{ fontFamily: "var(--t-titulo)" }}>“{destaque.nome}”</p>
            <p className="mt-4" style={{ color: "var(--t-muted)" }}>Montada no dia da entrega, com cartão escrito à mão.</p>
            <p className="mt-6 text-lg">{brl(destaque.preco)}</p>
          </div>
        </section>
      ) : null}

    </>
  );
}
