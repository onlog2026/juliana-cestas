import type { ReactNode } from "react";

/* REVISTA — peças editoriais compartilhadas (sem estado). */

/** Matérias de exemplo: dicas curtas e genéricas; cada uma leva para uma categoria da loja (não existem páginas de artigo). */
export const MATERIAS: ReadonlyArray<{ kicker: string; titulo: string; resumo: string }> = [
  { kicker: "Mesa", titulo: "Como montar uma mesa de café para duas pessoas", resumo: "Poucos itens, bem escolhidos, e uma mesa que parece de hotel." },
  { kicker: "Cartão", titulo: "O que escrever no cartão: cinco frases curtas", resumo: "Um bilhete simples costuma valer mais do que um discurso." },
  { kicker: "Guia", titulo: "Presente sem erro: três perguntas antes de escolher", resumo: "Para quem é, em que dia e com qual clima. O resto fica fácil." },
  { kicker: "Combinações", titulo: "Flores e doces: o que combina com o quê", resumo: "Cores e sabores que se completam, sem exagero." },
  { kicker: "Planejamento", titulo: "Entrega marcada: por que escolher a data com calma", resumo: "Quem planeja com antecedência recebe a cesta no dia certo." },
];

/** Rótulo pequeno em caixa-alta (kicker). */
export function Kicker({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-[11px] font-bold tracking-[0.2em] uppercase ${className}`} style={{ fontFamily: "var(--t-detalhe)", color: "var(--t-accent)" }}>{children}</p>
  );
}

/** Filete duplo de jornal: um traço grosso e um fino. */
export function Regua({ className = "" }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <div className="h-[3px]" style={{ background: "var(--t-fg)" }} />
      <div className="mt-[3px] h-px" style={{ background: "var(--t-fg)" }} />
    </div>
  );
}

/** Título de seção com régua por cima. */
export function TituloSecao({ id, children, direita }: { id?: string; children: ReactNode; direita?: ReactNode }) {
  return (
    <div className="border-t-[3px] pt-3" style={{ borderColor: "var(--t-fg)" }}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id={id} className="text-2xl leading-tight sm:text-3xl" style={{ fontFamily: "var(--t-titulo)" }}>{children}</h2>
        {direita ? <div className="text-sm" style={{ color: "var(--t-muted)" }}>{direita}</div> : null}
      </div>
    </div>
  );
}
