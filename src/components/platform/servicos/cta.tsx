import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** CTA final de página: fundo de tinta, botão âmbar para /cadastro e link para /planos. */
export function CtaFinal({
  titulo = "Crie a sua loja e teste por 7 dias grátis",
  texto = "Escolha um modelo, cadastre as suas cestas e veja a loja funcionando antes de decidir o plano.",
  textoBotao = "Criar loja grátis",
}: {
  titulo?: string;
  texto?: string;
  textoBotao?: string;
}) {
  return (
    <section className="px-4 py-14 sm:px-6 md:py-20" style={{ background: "var(--p-ink, #14110d)", color: "var(--p-paper, #faf6ee)" }}>
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        <h2 className="text-balance text-[clamp(1.7rem,5vw,2.6rem)] font-bold leading-tight tracking-tight" style={{ fontFamily: "var(--p-font-display, inherit)" }}>
          {titulo}
        </h2>
        <p className="mt-4 max-w-xl text-pretty text-lg leading-relaxed" style={{ opacity: 0.85 }}>{texto}</p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/cadastro"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-8 text-base font-bold transition-transform motion-safe:hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ background: "var(--p-accent, #f2a93b)", color: "var(--p-ink, #14110d)", outlineColor: "var(--p-paper, #faf6ee)" }}
          >
            {textoBotao}
            <ArrowRight aria-hidden="true" size={18} />
          </Link>
          <Link
            href="/planos"
            className="inline-flex min-h-12 items-center justify-center rounded-full border px-6 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ borderColor: "rgba(250,246,238,.5)", outlineColor: "var(--p-paper, #faf6ee)" }}
          >
            Ver planos
          </Link>
        </div>
      </div>
    </section>
  );
}
