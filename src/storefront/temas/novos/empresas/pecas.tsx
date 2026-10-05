import type { ReactNode } from "react";
import { CalendarCheck, Headset, PenLine, Receipt } from "lucide-react";
import { brl } from "../../kit";
import type { DadosLoja } from "../../types";

/**
 * EMPRESAS — peças compartilhadas (sem hooks): largura, rótulo em caixa-alta, selos
 * informativos e a tabela de quantidades de EXEMPLO (rotulada como exemplo).
 */

export const wrapE = "mx-auto w-full max-w-[2000px] px-4 sm:px-6 lg:px-10 2xl:px-14";

/** Rótulo pequeno em caixa-alta (fonte de detalhe) que antecede os títulos. */
export function Rotulo({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-xs font-semibold tracking-[0.16em] uppercase ${className ?? ""}`} style={{ fontFamily: "var(--t-detalhe)", color: "var(--t-primary)" }}>{children}</p>
  );
}

export const SELOS = [
  { Icone: Receipt, titulo: "Nota fiscal", texto: "Emissão de nota fiscal para a sua empresa." },
  { Icone: CalendarCheck, titulo: "Entrega agendada", texto: "Você escolhe o dia e a janela de horário." },
  { Icone: PenLine, titulo: "Cartão personalizado", texto: "A mensagem da sua empresa em cada cesta." },
  { Icone: Headset, titulo: "Atendimento dedicado", texto: "Um contato para acompanhar o pedido." },
];

/** Faixas de EXEMPLO: o lojista define as dele no painel da loja. */
const FAIXAS_EXEMPLO: ReadonlyArray<{ qtd: string; pct: number | null }> = [
  { qtd: "1 a 9 unidades", pct: 0 },
  { qtd: "10 a 24 unidades", pct: 5 },
  { qtd: "25 a 49 unidades", pct: 8 },
  { qtd: "50 unidades ou mais", pct: null },
];

export function TabelaExemplo({ d }: { d: DadosLoja }) {
  const ref = d.cestas[0];
  return (
    <div className="min-w-0 overflow-hidden rounded-md border" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-3" style={{ borderColor: "var(--t-line)" }}>
        <span className="rounded-sm px-2 py-0.5 text-[11px] font-bold tracking-[0.12em] uppercase" style={{ background: "var(--t-accent)", color: "var(--t-fg)", fontFamily: "var(--t-detalhe)" }}>Exemplo</span>
        <p className="min-w-0 text-sm font-semibold">Exemplo de condição — defina as suas na loja</p>
      </div>
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Exemplo de tabela de quantidades</caption>
        <thead>
          <tr style={{ color: "var(--t-muted)" }}>
            <th scope="col" className="px-4 py-2.5 text-xs font-semibold tracking-wide uppercase">Quantidade</th>
            <th scope="col" className="px-2 py-2.5 text-xs font-semibold tracking-wide uppercase">Condição</th>
            <th scope="col" className="px-4 py-2.5 text-right text-xs font-semibold tracking-wide uppercase">Por unidade</th>
          </tr>
        </thead>
        <tbody>
          {FAIXAS_EXEMPLO.map((f) => (
            <tr key={f.qtd} className="border-t" style={{ borderColor: "var(--t-line)" }}>
              <th scope="row" className="px-4 py-3 font-semibold">{f.qtd}</th>
              <td className="px-2 py-3" style={{ color: "var(--t-muted)" }}>{f.pct === null ? "Sob consulta" : f.pct === 0 ? "Preço de tabela" : `${f.pct}% de desconto`}</td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums">{ref && f.pct !== null ? brl(ref.preco * (1 - f.pct / 100)) : "Sob orçamento"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t px-4 py-3 text-xs leading-relaxed" style={{ borderColor: "var(--t-line)", color: "var(--t-muted)" }}>
        {ref ? <>Valores calculados sobre &quot;{ref.nome}&quot; apenas para ilustrar. </> : null}As faixas e os descontos reais são definidos por cada loja.
      </p>
    </div>
  );
}
