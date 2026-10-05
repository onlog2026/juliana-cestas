import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Icone } from "./icone";

/**
 * Herói de página de serviço/solução: promessa + CTA "Criar loja grátis" + captura real do modelo
 * em moldura de aparelho feita em CSS. Variáveis do escopo [data-surface="plataforma"] com fallback.
 */
export type HeroImagem = { src: string; alt: string; formato: "desktop" | "celular" };

export function MolduraAparelho({ imagem, prioridade = false }: { imagem: HeroImagem; prioridade?: boolean }) {
  const celular = imagem.formato === "celular";
  return (
    <div
      className={
        celular
          ? "mx-auto w-[min(62vw,15rem)] rounded-[2.2rem] border-[6px] shadow-[0_2px_4px_rgba(20,17,13,.08),0_14px_32px_-8px_rgba(20,17,13,.22),0_40px_70px_-30px_rgba(20,17,13,.3)]"
          : "mx-auto w-full max-w-xl overflow-hidden rounded-xl border shadow-[0_2px_4px_rgba(20,17,13,.08),0_14px_32px_-8px_rgba(20,17,13,.22),0_40px_70px_-30px_rgba(20,17,13,.3)]"
      }
      style={{ borderColor: "var(--p-ink, #14110d)", background: "var(--p-ink, #14110d)" }}
    >
      {!celular && (
        <div className="flex h-7 items-center gap-1.5 px-3" aria-hidden="true">
          <span className="size-2 rounded-full bg-white/30" />
          <span className="size-2 rounded-full bg-white/30" />
          <span className="size-2 rounded-full bg-white/30" />
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element -- capturas já em WebP; o otimizador está desligado */}
      <img
        src={imagem.src}
        alt={imagem.alt}
        width={celular ? 520 : 1400}
        height={celular ? 885 : 875}
        loading={prioridade ? "eager" : "lazy"}
        decoding="async"
        className={celular ? "block h-auto w-full rounded-[1.7rem]" : "block h-auto w-full"}
        style={{ aspectRatio: celular ? "520 / 885" : "1400 / 875" }}
      />
    </div>
  );
}

export function ServicoHero({
  etiqueta,
  icone,
  titulo,
  texto,
  imagem,
  emBreve = false,
  aviso,
  ctaTexto = "Criar loja grátis",
}: {
  etiqueta: string;
  icone?: string;
  titulo: string;
  texto: string;
  imagem: HeroImagem;
  emBreve?: boolean;
  aviso?: string;
  ctaTexto?: string;
}) {
  return (
    <section className="px-4 pb-12 pt-8 sm:px-6 md:pb-20 md:pt-14" style={{ background: "var(--p-paper, #faf6ee)", color: "var(--p-ink, #14110d)" }}>
      <div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-10 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] md:gap-14">
        <div className="min-w-0">
          <p className="inline-flex min-h-8 items-center gap-2 rounded-full border px-3 text-sm font-semibold" style={{ borderColor: "var(--p-line, #e4dccd)" }}>
            {icone && <Icone nome={icone} size={16} />}
            <span>{etiqueta}</span>
            {emBreve && (
              <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: "var(--p-accent, #f2a93b)", color: "var(--p-ink, #14110d)" }}>
                Em breve
              </span>
            )}
          </p>
          <h1 className="mt-5 text-balance text-[clamp(2rem,6.2vw,3.5rem)] font-bold leading-[1.05] tracking-tight" style={{ fontFamily: "var(--p-font-display, inherit)" }}>
            {titulo}
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed" style={{ color: "var(--p-muted, #5c554a)" }}>
            {texto}
          </p>
          {aviso && (
            <p className="mt-5 max-w-xl rounded-lg border-l-4 p-4 text-base font-medium" style={{ borderColor: "var(--p-accent, #f2a93b)", background: "var(--p-line, #e4dccd)" }}>
              {aviso}
            </p>
          )}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/cadastro"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 text-base font-bold transition-transform motion-safe:hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ background: "var(--p-accent, #f2a93b)", color: "var(--p-ink, #14110d)", outlineColor: "var(--p-ink, #14110d)" }}
            >
              {ctaTexto}
              <ArrowRight aria-hidden="true" size={18} />
            </Link>
            <p className="text-sm" style={{ color: "var(--p-muted, #5c554a)" }}>7 dias grátis para testar.</p>
          </div>
        </div>
        <div className="min-w-0">
          <MolduraAparelho imagem={imagem} prioridade />
        </div>
      </div>
    </section>
  );
}
