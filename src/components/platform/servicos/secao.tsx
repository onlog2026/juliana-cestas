import type { ReactNode } from "react";

/** Invólucro padrão de seção: largura, respiro e título H2. Fundo "papel", "tinta" ou "linha". */
export function Secao({
  id,
  titulo,
  subtitulo,
  tom = "papel",
  children,
}: {
  id?: string;
  titulo: string;
  subtitulo?: string;
  tom?: "papel" | "tinta" | "linha";
  children: ReactNode;
}) {
  const tinta = tom === "tinta";
  return (
    <section
      id={id}
      className="px-4 py-12 sm:px-6 md:py-20"
      style={{
        background: tinta ? "var(--p-ink, #14110d)" : tom === "linha" ? "var(--p-line, #e4dccd)" : "var(--p-paper, #faf6ee)",
        color: tinta ? "var(--p-paper, #faf6ee)" : "var(--p-ink, #14110d)",
      }}
    >
      <div className="mx-auto w-full max-w-6xl">
        <h2 className="max-w-3xl text-balance text-[clamp(1.6rem,4.6vw,2.4rem)] font-bold leading-tight tracking-tight" style={{ fontFamily: "var(--p-font-display, inherit)" }}>
          {titulo}
        </h2>
        {subtitulo && (
          <p className="mt-4 max-w-2xl text-pretty text-lg leading-relaxed" style={{ opacity: 0.85 }}>
            {subtitulo}
          </p>
        )}
        <div className="mt-8 md:mt-10">{children}</div>
      </div>
    </section>
  );
}
