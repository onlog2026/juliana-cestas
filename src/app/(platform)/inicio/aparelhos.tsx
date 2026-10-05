import { MODELOS } from "@/modules/platform/modelos-catalog";

/**
 * Molduras de aparelho feitas em CSS (src/styles/plataforma.css) com as capturas REAIS dos modelos.
 * As capturas trazem uma faixa de pré-visualização no topo; `.plt-recorte-*` corta essa faixa.
 */

export type Tela = { desktop: string; celular: string; rotulo: string; modelo: string; demo: string };

/** Acha a captura de um modelo/variação; se não achar, usa a primeira disponível (nunca quebra). */
export function achaTela(modelo: string, variacao?: string): Tela {
  const m = MODELOS.find((x) => x.key === modelo) ?? MODELOS[0];
  const t = m.telas.find((x) => x.key === variacao) ?? m.telas[0];
  return { desktop: t.desktop, celular: t.celular, rotulo: t.rotulo, modelo: m.name, demo: t.demo };
}

export function Notebook({ src, alt, prioridade = false }: { src: string; alt: string; prioridade?: boolean }) {
  return (
    <div className="plt-notebook">
      <div className="plt-notebook-tela">
        <div className="plt-notebook-barra" aria-hidden="true"><i /><i /><i /></div>
        <div className="plt-recorte-d">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            width={1400}
            height={875}
            loading={prioridade ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={prioridade ? "high" : undefined}
          />
        </div>
      </div>
      <div className="plt-notebook-base" aria-hidden="true" />
    </div>
  );
}

export function Celular({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="plt-celular">
      <div className="plt-recorte-m">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} width={520} height={885} loading="lazy" decoding="async" />
      </div>
    </div>
  );
}
