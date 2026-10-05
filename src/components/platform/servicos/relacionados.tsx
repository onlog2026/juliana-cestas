import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Icone } from "./icone";
import { Secao } from "./secao";

export type ItemRelacionado = { slug: string; titulo: string; resumo: string; icone: string; emBreve?: boolean };

/** Cartões de serviços. Todo link aponta para /recursos/<slug>, que existe (generateStaticParams). */
export function Relacionados({ titulo = "Serviços que andam juntos", subtitulo, itens, tom = "linha" }: { titulo?: string; subtitulo?: string; itens: ItemRelacionado[]; tom?: "papel" | "linha" }) {
  if (itens.length === 0) return null;
  return (
    <Secao titulo={titulo} subtitulo={subtitulo} tom={tom}>
      <ul className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {itens.map((r) => (
          <li key={r.slug} className="min-w-0">
            <Link
              href={`/recursos/${r.slug}`}
              className="group flex h-full min-h-11 flex-col gap-3 rounded-2xl border bg-white p-5 transition-shadow motion-safe:hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ borderColor: "var(--p-line, #e4dccd)", color: "var(--p-ink, #14110d)", outlineColor: "var(--p-ink, #14110d)" }}
            >
              <span className="flex items-center justify-between">
                <Icone nome={r.icone} />
                <ArrowUpRight aria-hidden="true" size={18} />
              </span>
              <span className="text-lg font-bold leading-snug">
                {r.titulo}
                {r.emBreve && (
                  <span className="ml-2 rounded-full px-2 py-0.5 align-middle text-xs font-bold" style={{ background: "var(--p-accent, #f2a93b)" }}>
                    Em breve
                  </span>
                )}
              </span>
              <span className="text-sm leading-relaxed" style={{ color: "var(--p-muted, #5c554a)" }}>{r.resumo}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Secao>
  );
}
