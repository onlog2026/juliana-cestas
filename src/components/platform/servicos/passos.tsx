import { Secao } from "./secao";

/** "Como funciona em 3 passos": lista ordenada de verdade (<ol>), número grande decorativo. */
export function Passos({ titulo = "Como funciona em 3 passos", itens }: { titulo?: string; itens: Array<{ titulo: string; texto: string }> }) {
  return (
    <Secao titulo={titulo} tom="tinta">
      <ol className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-3 md:gap-8">
        {itens.map((p, i) => (
          <li key={p.titulo} className="min-w-0 border-t pt-5" style={{ borderColor: "rgba(250,246,238,.35)" }}>
            <span className="block text-5xl font-bold leading-none" style={{ color: "var(--p-accent, #f2a93b)", fontFamily: "var(--p-font-display, inherit)" }} aria-hidden="true">
              {i + 1}
            </span>
            <h3 className="mt-4 text-xl font-bold leading-snug">
              <span className="sr-only">Passo {i + 1}: </span>
              {p.titulo}
            </h3>
            <p className="mt-2 leading-relaxed" style={{ opacity: 0.85 }}>{p.texto}</p>
          </li>
        ))}
      </ol>
    </Secao>
  );
}
