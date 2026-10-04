import { Search, ShoppingBag } from "lucide-react";
import { Foto, brl } from "./kit";
import type { DadosLoja } from "./types";

/** NOIR — escuro e dourado: barra preta, foto em tela cheia com título serifado, cartões com fio dourado. */
export function HomeNoir({ d }: { d: DadosLoja }) {
  return (
    <>
      <header className="border-b" style={{ borderColor: "color-mix(in srgb, var(--t-primary) 35%, transparent)" }}>
        <div className="mx-auto flex max-w-[1400px] items-center gap-8 px-6 py-5">
          <p className="text-2xl tracking-[0.35em] uppercase" style={{ fontFamily: "var(--t-titulo)", color: "var(--t-primary)" }}>{d.loja}</p>
          <nav className="hidden gap-8 text-[12px] tracking-[0.25em] uppercase md:flex" style={{ color: "var(--t-muted)" }} aria-label="Categorias">
            {d.categorias.map((c) => <span key={c.nome}>{c.nome}</span>)}
          </nav>
          <div className="ml-auto flex gap-5" style={{ color: "var(--t-primary)" }}><Search className="size-4" /><ShoppingBag className="size-4" /></div>
        </div>
      </header>

      <section className="relative">
        <Foto src={d.heroImagem} alt="" className="aspect-[3/4] w-full object-cover sm:aspect-[16/7]" style={{ filter: "brightness(.55) saturate(.9)" }} />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-[1400px] px-6 sm:px-12">
            <p className="text-[12px] tracking-[0.4em] uppercase" style={{ color: "var(--t-primary)" }}>{d.aviso}</p>
            <h1 className="mt-5 max-w-3xl text-5xl leading-[1.02] sm:text-7xl" style={{ fontFamily: "var(--t-titulo)" }}>{d.titulo}</h1>
            <span className="mt-8 inline-flex h-12 items-center border px-8 text-[12px] tracking-[0.3em] uppercase" style={{ borderColor: "var(--t-primary)", color: "var(--t-primary)" }}>Conhecer a coleção</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 py-20">
        <div className="flex items-center gap-6">
          <span className="h-px flex-1" style={{ background: "var(--t-line)" }} />
          <h2 className="text-3xl italic" style={{ fontFamily: "var(--t-titulo)" }}>A coleção</h2>
          <span className="h-px flex-1" style={{ background: "var(--t-line)" }} />
        </div>
        <div className="mt-12 grid grid-cols-2 gap-5 lg:grid-cols-3">
          {d.cestas.slice(0, 6).map((c) => (
            <a key={c.nome} href={c.href} className="block border p-3" style={{ background: "var(--t-surface)", borderColor: "color-mix(in srgb, var(--t-primary) 40%, transparent)" }}>
              <Foto src={c.imagem} alt={c.nome} className="aspect-[4/5] w-full object-cover" />
              <div className="flex flex-wrap items-baseline justify-between gap-2 px-1 pt-4 pb-1">
                <p className="text-xl" style={{ fontFamily: "var(--t-titulo)" }}>{c.nome}</p>
                <p className="text-sm tracking-wider" style={{ color: "var(--t-primary)" }}>{brl(c.preco)}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="px-6 py-20 text-center" style={{ background: "var(--t-surface)" }}>
        <p className="mx-auto max-w-3xl text-3xl leading-snug italic sm:text-4xl" style={{ fontFamily: "var(--t-titulo)" }}>“{d.texto}”</p>
        <p className="mt-6 text-[12px] tracking-[0.35em] uppercase" style={{ color: "var(--t-primary)" }}>{d.loja}</p>
      </section>

      <footer className="px-6 py-12 text-center text-[12px] tracking-[0.25em] uppercase" style={{ color: "var(--t-muted)" }}>
        <span className="mx-auto mb-6 block h-px w-24" style={{ background: "var(--t-primary)" }} />
        Atendimento exclusivo · Entregas agendadas · Presentes corporativos
      </footer>
    </>
  );
}
