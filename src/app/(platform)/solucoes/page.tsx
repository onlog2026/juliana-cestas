import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PlataformaShell } from "@/components/platform/site/shell";
import { SOLUCOES } from "@/modules/platform/solucoes";
import { Secao } from "@/components/platform/servicos/secao";
import { CtaFinal } from "@/components/platform/servicos/cta";

const TITULO = "Soluções para quem vende cestas, flores e presentes";
const DESCRICAO =
  "Vende só pelo Instagram, já tem loja virtual, atende empresas ou trabalha com flores e café colonial? Veja como a plataforma ajuda em cada caso.";

export const metadata: Metadata = {
  title: { absolute: TITULO },
  description: DESCRICAO,
  alternates: { canonical: "/solucoes" },
  openGraph: { title: TITULO, description: DESCRICAO, type: "website", locale: "pt_BR", url: "/solucoes" },
};

export default function SolucoesIndexPage() {
  return (
    <PlataformaShell>
      <main className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <section className="px-4 pb-6 pt-10 sm:px-6 md:pt-16" style={{ background: "var(--p-paper, #faf6ee)", color: "var(--p-ink, #14110d)" }}>
          <div className="mx-auto w-full max-w-6xl">
            <h1 className="max-w-3xl text-balance text-[clamp(2rem,6.2vw,3.5rem)] font-bold leading-[1.05] tracking-tight" style={{ fontFamily: "var(--p-font-display, inherit)" }}>
              Qual é a sua situação hoje?
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed" style={{ color: "var(--p-muted, #5c554a)" }}>
              Cada negócio de presentes vende de um jeito. Escolha o que mais se parece com o seu e veja o que muda com uma loja própria.
            </p>
          </div>
        </section>
        <Secao titulo="Escolha o seu caminho" tom="papel">
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SOLUCOES.map((s) => (
              <li key={s.slug} className="min-w-0">
                <Link
                  href={`/solucoes/${s.slug}`}
                  className="group flex h-full min-h-11 flex-col gap-3 rounded-2xl border bg-white p-6 transition-shadow motion-safe:hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ borderColor: "var(--p-line, #e4dccd)", color: "var(--p-ink, #14110d)", outlineColor: "var(--p-ink, #14110d)" }}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="text-xl font-bold leading-snug">{s.titulo}</span>
                    <ArrowUpRight aria-hidden="true" size={20} className="mt-1 shrink-0" />
                  </span>
                  <span className="leading-relaxed" style={{ color: "var(--p-muted, #5c554a)" }}>{s.resumo}</span>
                  <span className="mt-auto text-sm font-semibold">{s.paraQuem}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Secao>
        <CtaFinal />
      </main>
    </PlataformaShell>
  );
}
