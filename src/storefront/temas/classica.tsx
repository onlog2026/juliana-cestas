import { Gift, Search, ShoppingBag, Truck, User } from "lucide-react";
import { Foto, brl } from "./kit";
import type { DadosLoja } from "./types";

/** CLÁSSICA — a vitrine da Juliana: faixa de aviso, carrossel com texto, categorias em círculo, cartão com moldura. */
export function HomeClassica({ d }: { d: DadosLoja }) {
  return (
    <>
      <div className="px-4 py-2 text-center text-sm" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>{d.aviso}</div>
      <header className="border-b" style={{ borderColor: "var(--t-line)" }}>
        <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-5 py-4">
          <p className="text-3xl whitespace-nowrap" style={{ fontFamily: "var(--t-titulo)", color: "var(--t-primary)" }}>{d.loja}</p>
          <div className="mx-auto hidden h-11 max-w-xl flex-1 items-center gap-2 rounded-full border bg-white px-4 text-sm md:flex" style={{ borderColor: "var(--t-line)", color: "var(--t-muted)" }}>
            <Search className="size-4" aria-hidden="true" /> Buscar cestas, ocasiões…
          </div>
          <div className="ml-auto flex items-center gap-5"><User className="size-5" /><ShoppingBag className="size-5" /></div>
        </div>
        <nav className="mx-auto hidden max-w-[1400px] gap-8 px-5 pb-3 text-sm md:flex" aria-label="Categorias">
          {d.categorias.map((c) => <span key={c.nome}>{c.nome}</span>)}
        </nav>
      </header>

      <section className="relative">
        <Foto src={d.heroImagem} alt="" className="aspect-[4/5] w-full object-cover sm:aspect-[21/8]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 max-w-[1400px] p-6 sm:p-12">
          <h1 className="max-w-3xl text-3xl text-white sm:text-5xl" style={{ fontFamily: "var(--t-titulo)", textShadow: "0 2px 14px rgba(0,0,0,.4)" }}>{d.titulo}</h1>
          <span className="mt-4 inline-flex h-11 items-center rounded-full px-6 text-sm font-semibold" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>Ver cestas</span>
        </div>
      </section>

      <div className="mx-auto max-w-[1400px] px-5">
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

      <footer className="border-t px-5 py-10 text-sm" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)", color: "var(--t-muted)" }}>
        <div className="mx-auto grid max-w-[1400px] gap-6 sm:grid-cols-3">
          <p className="text-xl" style={{ fontFamily: "var(--t-titulo)", color: "var(--t-primary)" }}>{d.loja}</p>
          <p>Atendimento de segunda a sábado<br />WhatsApp e e-mail</p>
          <p>Trocas e devoluções<br />Política de privacidade</p>
        </div>
      </footer>
    </>
  );
}
