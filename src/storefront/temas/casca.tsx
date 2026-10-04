import type { ReactNode } from "react";
import { Gift, Search, ShoppingBag, ShoppingBasket, ShoppingCart, Truck, User, CreditCard, Headphones, ShieldCheck } from "lucide-react";
import { CartIcon } from "./cart-icon";
import { Foto } from "./kit";
import type { DadosLoja } from "./types";

const PASTEIS = ["color-mix(in srgb, var(--t-primary) 14%, white)", "color-mix(in srgb, var(--t-accent) 22%, white)", "color-mix(in srgb, var(--t-primary) 8%, var(--t-accent) 12%)"];

/* Cabeçalho e rodapé de cada modelo — compartilhados pela página inicial e pelas páginas internas (categoria, cesta, carrinho). */

export function CabecalhoClassica({ d }: { d: DadosLoja }) {
  return (
    <>
      <div className="px-4 py-2 text-center text-sm" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>{d.aviso}</div>
      <header className="border-b" style={{ borderColor: "var(--t-line)" }}>
        <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-5 py-4">
          <p className="text-3xl whitespace-nowrap" style={{ fontFamily: "var(--t-titulo)", color: "var(--t-primary)" }}><a href={d.base || "/"}>{d.loja}</a></p>
          <div className="mx-auto hidden h-11 max-w-xl flex-1 items-center gap-2 rounded-full border bg-white px-4 text-sm md:flex" style={{ borderColor: "var(--t-line)", color: "var(--t-muted)" }}>
            <Search className="size-4" aria-hidden="true" /> Buscar cestas, ocasiões…
          </div>
          <div className="ml-auto flex items-center gap-5"><User className="size-5" /><CartIcon base={d.base} icone="sacola" className="size-5" /></div>
        </div>
        <nav className="mx-auto hidden max-w-[1400px] gap-8 px-5 pb-3 text-sm md:flex" aria-label="Categorias">
          {d.categorias.map((c) => <a key={c.nome} href={c.href}>{c.nome}</a>)}
        </nav>
      </header>
    </>
  );
}

export function RodapeClassica({ d }: { d: DadosLoja }) {
  return (
    <>
      <footer className="border-t px-5 py-10 text-sm" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)", color: "var(--t-muted)" }}>
        <div className="mx-auto grid max-w-[1400px] gap-6 sm:grid-cols-3">
          <p className="text-xl" style={{ fontFamily: "var(--t-titulo)", color: "var(--t-primary)" }}><a href={d.base || "/"}>{d.loja}</a></p>
          <p>Atendimento de segunda a sábado<br />WhatsApp e e-mail</p>
          <p>Trocas e devoluções<br />Política de privacidade</p>
        </div>
      </footer>
    </>
  );
}

export function CabecalhoBoutique({ d }: { d: DadosLoja }) {
  return (
    <>
      <p className="py-2 text-center text-[11px] tracking-[0.25em] uppercase" style={{ color: "var(--t-muted)" }}>{d.aviso}</p>
      <header className="relative border-y px-5 py-6 text-center" style={{ borderColor: "var(--t-line)" }}>
        <p className="text-xl tracking-[0.18em] uppercase sm:text-4xl sm:tracking-[0.3em]" style={{ fontFamily: "var(--t-titulo)", fontWeight: 500 }}><a href={d.base || "/"}>{d.loja}</a></p>
        <nav className="mt-3 hidden justify-center gap-10 text-[12px] tracking-[0.2em] uppercase sm:flex" aria-label="Categorias">
          {d.categorias.map((c) => <a key={c.nome} href={c.href}>{c.nome}</a>)}
        </nav>
        <div className="absolute top-1/2 right-5 flex -translate-y-1/2 gap-5"><Search className="size-4" /><CartIcon base={d.base} icone="sacola" className="size-4" /></div>
      </header>
    </>
  );
}

export function RodapeBoutique({ d }: { d: DadosLoja }) {
  return (
    <>
      <footer className="mt-24 border-t px-5 py-14 text-center" style={{ borderColor: "var(--t-line)" }}>
        <p className="text-2xl tracking-[0.3em] uppercase" style={{ fontFamily: "var(--t-titulo)" }}><a href={d.base || "/"}>{d.loja}</a></p>
        <p className="mt-4 text-[12px] tracking-[0.2em] uppercase" style={{ color: "var(--t-muted)" }}>Atendimento · Entregas · Trocas · Instagram</p>
      </footer>
    </>
  );
}

export function CabecalhoMercado({ d }: { d: DadosLoja }) {
  return (
    <>
      <div className="px-4 py-1.5 text-center text-xs font-semibold" style={{ background: "var(--t-fg)", color: "var(--t-bg)" }}>{d.aviso}</div>
      <header className="bg-white">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-4 px-4 py-4">
          <p className="text-2xl font-black tracking-tight" style={{ fontFamily: "var(--t-titulo)", color: "var(--t-primary)" }}><a href={d.base || "/"}>{d.loja}</a></p>
          <div className="order-3 flex h-12 w-full overflow-hidden rounded-lg border-2 sm:order-none sm:w-auto sm:flex-1" style={{ borderColor: "var(--t-primary)" }}>
            <span className="flex flex-1 items-center gap-2 px-3 text-sm" style={{ color: "var(--t-muted)" }}><Search className="size-4" />O que você procura?</span>
            <span className="flex items-center px-5 text-sm font-bold" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>Buscar</span>
          </div>
          <div className="ml-auto flex gap-5 text-xs"><span className="flex flex-col items-center"><User className="size-5" />Entrar</span><span className="flex flex-col items-center"><CartIcon base={d.base} icone="carrinho" className="size-5" />Carrinho</span></div>
        </div>
        <nav className="border-t" style={{ borderColor: "var(--t-line)" }} aria-label="Categorias">
          <div className="mx-auto flex max-w-[1400px] gap-2 overflow-x-auto px-4 py-2 text-sm font-semibold">
            {d.categorias.map((c) => <a key={c.nome} href={c.href} className="shrink-0 rounded-md px-3 py-2" style={{ background: "var(--t-bg)" }}>{c.nome}</a>)}
          </div>
        </nav>
      </header>
    </>
  );
}

export function RodapeMercado({ d }: { d: DadosLoja }) {
  return (
    <>
      <footer className="mt-10 px-4 py-10 text-sm" style={{ background: "var(--t-fg)", color: "var(--t-bg)" }}>
        <div className="mx-auto grid max-w-[1400px] gap-6 sm:grid-cols-4">
          <p className="text-xl font-black" style={{ fontFamily: "var(--t-titulo)" }}><a href={d.base || "/"}>{d.loja}</a></p>
          <p>Institucional<br />Sobre nós<br />Trabalhe conosco</p>
          <p>Ajuda<br />Entregas<br />Trocas</p>
          <p>Pagamento<br />PIX · Cartão · Boleto</p>
        </div>
      </footer>
    </>
  );
}

export function CabecalhoFesta({ d }: { d: DadosLoja }) {
  return (
    <>
      <div className="px-4 py-2 text-center text-sm font-bold" style={{ background: "var(--t-accent)", color: "var(--t-fg)" }}>{d.aviso}</div>
      <header className="mx-auto flex max-w-[1300px] flex-wrap items-center gap-4 px-5 py-5">
        <p className="text-2xl font-extrabold sm:text-4xl" style={{ fontFamily: "var(--t-titulo)", color: "var(--t-primary)" }}><a href={d.base || "/"}>{d.loja}</a></p>
        <nav className="hidden flex-wrap gap-2 md:flex" aria-label="Categorias">
          {d.categorias.map((c, i) => (
            <a key={c.nome} href={c.href} className="rounded-full px-4 py-2 text-sm font-bold" style={{ background: PASTEIS[i % 3] }}>{c.nome}</a>
          ))}
        </nav>
        <span className="ml-auto flex size-12 items-center justify-center rounded-full" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}><CartIcon base={d.base} icone="sacola" className="size-5" /></span>
      </header>
    </>
  );
}

export function RodapeFesta({ d }: { d: DadosLoja }) {
  return (
    <>
      <svg viewBox="0 0 1440 60" className="mt-16 block w-full" aria-hidden="true" preserveAspectRatio="none" style={{ height: 40 }}>
        <path d="M0 30 Q 60 0 120 30 T 240 30 T 360 30 T 480 30 T 600 30 T 720 30 T 840 30 T 960 30 T 1080 30 T 1200 30 T 1320 30 T 1440 30 V60 H0 Z" fill="var(--t-primary)" />
      </svg>
      <footer className="px-5 pb-12 pt-6 text-center" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>
        <p className="text-3xl font-extrabold" style={{ fontFamily: "var(--t-titulo)" }}><a href={d.base || "/"}>{d.loja}</a></p>
        <p className="mt-2 text-sm opacity-90">Entregas com data marcada · PIX e cartão · Fale no WhatsApp</p>
      </footer>
    </>
  );
}

export function CabecalhoNoir({ d }: { d: DadosLoja }) {
  return (
    <>
      <header className="border-b" style={{ borderColor: "color-mix(in srgb, var(--t-primary) 35%, transparent)" }}>
        <div className="mx-auto flex max-w-[1400px] items-center gap-8 px-6 py-5">
          <p className="text-base tracking-[0.2em] uppercase sm:text-2xl sm:tracking-[0.35em]" style={{ fontFamily: "var(--t-titulo)", color: "var(--t-primary)" }}><a href={d.base || "/"}>{d.loja}</a></p>
          <nav className="hidden gap-8 text-[12px] tracking-[0.25em] uppercase md:flex" style={{ color: "var(--t-muted)" }} aria-label="Categorias">
            {d.categorias.map((c) => <a key={c.nome} href={c.href}>{c.nome}</a>)}
          </nav>
          <div className="ml-auto flex gap-5" style={{ color: "var(--t-primary)" }}><Search className="size-4" /><CartIcon base={d.base} icone="sacola" className="size-4" /></div>
        </div>
      </header>
    </>
  );
}

export function RodapeNoir({ d }: { d: DadosLoja }) {
  return (
    <>
      <footer className="px-6 py-12 text-center text-[12px] tracking-[0.25em] uppercase" style={{ color: "var(--t-muted)" }}>
        <span className="mx-auto mb-6 block h-px w-24" style={{ background: "var(--t-primary)" }} />
        Atendimento exclusivo · Entregas agendadas · Presentes corporativos
      </footer>
    </>
  );
}

export function CabecalhoRustico({ d }: { d: DadosLoja }) {
  return (
    <>
      <header className="relative px-5 pt-6 pb-8 text-center" style={{ background: "var(--t-surface)", clipPath: "polygon(0 0,100% 0,100% 88%,96% 100%,92% 90%,88% 100%,84% 91%,80% 100%,76% 90%,72% 100%,68% 91%,64% 100%,60% 90%,56% 100%,52% 91%,48% 100%,44% 90%,40% 100%,36% 91%,32% 100%,28% 90%,24% 100%,20% 91%,16% 100%,12% 90%,8% 100%,4% 91%,0 100%)" }}>
        <p className="text-4xl" style={{ fontFamily: "var(--t-titulo)", color: "var(--t-primary)", fontWeight: 600 }}><a href={d.base || "/"}>{d.loja}</a></p>
        <p className="text-2xl" style={{ fontFamily: "var(--t-detalhe)", color: "var(--t-accent)" }}>{d.aviso}</p>
        <nav className="mt-3 hidden justify-center gap-7 text-sm sm:flex" aria-label="Categorias">
          {d.categorias.map((c) => <a key={c.nome} href={c.href}>{c.nome}</a>)}
        </nav>
        <CartIcon base={d.base} icone="cesta" className="absolute top-6 right-6 size-6" style={{ color: "var(--t-primary)" }} />
      </header>
    </>
  );
}

export function RodapeRustico({ d }: { d: DadosLoja }) {
  return (
    <>
      <footer className="mx-5 mb-6 rounded-xl border-2 border-dashed px-6 py-10 text-center" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>
        <p className="text-3xl" style={{ fontFamily: "var(--t-titulo)", color: "var(--t-primary)", fontWeight: 600 }}><a href={d.base || "/"}>{d.loja}</a></p>
        <p className="mt-2 text-xl" style={{ fontFamily: "var(--t-detalhe)" }}>Receitas de família, entregues com carinho</p>
      </footer>
    </>
  );
}
