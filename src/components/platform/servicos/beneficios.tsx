import { Check } from "lucide-react";
import { Secao } from "./secao";

/** Um bloco de benefício: número, título e texto. */
export function BlocoBeneficio({ titulo, texto, numero }: { titulo: string; texto: string; numero: number }) {
  return (
    <li className="min-w-0 rounded-2xl border p-6" style={{ borderColor: "var(--p-line, #e4dccd)", background: "#fff" }}>
      <span className="inline-flex size-10 items-center justify-center rounded-full font-bold" style={{ background: "var(--p-ink, #14110d)", color: "var(--p-paper, #faf6ee)" }} aria-hidden="true">
        {numero}
      </span>
      <h3 className="mt-4 text-xl font-bold leading-snug" style={{ color: "var(--p-ink, #14110d)" }}>{titulo}</h3>
      <p className="mt-2 leading-relaxed" style={{ color: "var(--p-muted, #5c554a)" }}>{texto}</p>
    </li>
  );
}

export function Beneficios({
  titulo,
  subtitulo,
  itens,
}: {
  titulo: string;
  subtitulo?: string;
  itens: Array<{ titulo: string; texto: string }>;
}) {
  return (
    <Secao titulo={titulo} subtitulo={subtitulo}>
      <ul className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-3 md:gap-6">
        {itens.map((b, i) => (
          <BlocoBeneficio key={b.titulo} titulo={b.titulo} texto={b.texto} numero={i + 1} />
        ))}
      </ul>
    </Secao>
  );
}

/** Lista com marcador de "check" (usada nas soluções para os ganhos). */
export function ListaGanhos({ itens }: { itens: Array<{ titulo: string; texto: string }> }) {
  return (
    <ul className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-2">
      {itens.map((g) => (
        <li key={g.titulo} className="flex min-w-0 gap-3">
          <span className="mt-1 inline-flex size-6 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--p-accent, #f2a93b)", color: "var(--p-ink, #14110d)" }}>
            <Check aria-hidden="true" size={14} strokeWidth={3} />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-bold leading-snug">{g.titulo}</h3>
            <p className="mt-1 leading-relaxed" style={{ color: "var(--p-muted, #5c554a)" }}>{g.texto}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
