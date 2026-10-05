import { ChevronDown } from "lucide-react";
import { Secao } from "./secao";

/** Perguntas frequentes com <details>/<summary>: funciona sem JavaScript e com teclado. */
export function Faq({ itens, titulo = "Perguntas frequentes" }: { itens: Array<{ pergunta: string; resposta: string }>; titulo?: string }) {
  return (
    <Secao titulo={titulo}>
      <div className="max-w-3xl border-y" style={{ borderColor: "var(--p-line, #e4dccd)" }}>
        {itens.map((f, i) => (
          <details key={f.pergunta} className="group border-t first:border-t-0" style={{ borderColor: "var(--p-line, #e4dccd)" }} data-indice={i}>
            <summary
              className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-left text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden"
              style={{ outlineColor: "var(--p-ink, #14110d)" }}
            >
              <span className="min-w-0">{f.pergunta}</span>
              <ChevronDown aria-hidden="true" size={20} className="shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
            </summary>
            <p className="pb-5 pr-8 leading-relaxed" style={{ color: "var(--p-muted, #5c554a)" }}>{f.resposta}</p>
          </details>
        ))}
      </div>
    </Secao>
  );
}
