/** "O problema": título e parágrafo, em fundo de linha para quebrar o ritmo da página. */
export function Problema({ titulo, texto, etiqueta = "O problema" }: { titulo: string; texto: string; etiqueta?: string }) {
  return (
    <section className="px-4 py-12 sm:px-6 md:py-16" style={{ background: "var(--p-line, #e4dccd)", color: "var(--p-ink, #14110d)" }}>
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--p-ink, #14110d)", opacity: 0.75 }}>
          {etiqueta}
        </p>
        <h2 className="mt-3 text-balance text-[clamp(1.5rem,4.4vw,2.2rem)] font-bold leading-tight tracking-tight" style={{ fontFamily: "var(--p-font-display, inherit)" }}>
          {titulo}
        </h2>
        <p className="mt-4 text-pretty text-lg leading-relaxed">{texto}</p>
      </div>
    </section>
  );
}
