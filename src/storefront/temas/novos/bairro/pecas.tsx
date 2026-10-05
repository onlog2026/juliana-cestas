import { Clock, MapPin, MessageCircle, Store, Truck } from "lucide-react";
import type { DadosLoja } from "../../types";
import { HORARIOS, linkWhats, regioes } from "./dados";

/* BAIRRO — peças compartilhadas (sem estado): WhatsApp, selo de entrega, horários e regiões. */

/** Botão de WhatsApp. Sem número informado, vira um aviso (nunca link vazio nem número inventado). */
export function Whats({ d, texto, className = "", compacto = false }: { d: DadosLoja; texto: string; className?: string; compacto?: boolean }) {
  const href = linkWhats(d, "Olá! Vim pelo site e quero fazer um pedido.");
  const estilo = { background: "var(--t-primary)", color: "var(--t-on-primary)" } as const;
  const base = `inline-flex items-center justify-center gap-2 rounded-full font-semibold ${compacto ? "min-h-11 px-4 text-sm" : "min-h-12 px-6"}`;
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={`${base} ${className}`} style={estilo}>
        <MessageCircle className="size-5 shrink-0" aria-hidden="true" /> {texto}
      </a>
    );
  }
  if (!d.demo) return null;
  return (
    <p className={`inline-flex items-center gap-2 rounded-full border border-dashed px-4 py-2 text-sm ${className}`} style={{ borderColor: "var(--t-line)", color: "var(--t-muted)" }}>
      <MessageCircle className="size-4 shrink-0" aria-hidden="true" /> O botão de WhatsApp da sua loja aparece aqui
    </p>
  );
}

/** Selo fixo das cestas. */
export function SeloEntrega({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${className}`} style={{ background: "color-mix(in srgb, var(--t-primary) 12%, var(--t-surface))", color: "var(--t-fg)" }}>
      <Truck className="size-3.5 shrink-0" style={{ color: "var(--t-primary)" }} aria-hidden="true" /> Entrega com data marcada
    </span>
  );
}

/** Tabela de horários de entrega. */
export function Horarios({ d }: { d: DadosLoja }) {
  return (
    <div>
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Horários de entrega</caption>
        <thead>
          <tr className="text-xs uppercase" style={{ color: "var(--t-muted)" }}>
            <th scope="col" className="pb-2 font-semibold">Faixa</th>
            <th scope="col" className="pb-2 font-semibold">Entrega</th>
            <th scope="col" className="pb-2 font-semibold">Prazo do pedido</th>
          </tr>
        </thead>
        <tbody>
          {HORARIOS.map(([faixa, hora, prazo]) => (
            <tr key={faixa} className="border-t" style={{ borderColor: "var(--t-line)" }}>
              <th scope="row" className="py-2.5 pr-2 font-semibold">{faixa}</th>
              <td className="py-2.5 pr-2 tabular-nums">{hora}</td>
              <td className="py-2.5" style={{ color: "var(--t-muted)" }}>{prazo}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs" style={{ color: "var(--t-muted)" }}>
        {d.demo ? "Exemplo de horários — cada loja define os seus." : "Os horários disponíveis aparecem ao escolher a data no pedido."}
      </p>
    </div>
  );
}

/** Bloco "Pediu até 14h, chega hoje". */
export function PediuHoje({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-start gap-4 rounded-2xl border-2 border-dashed p-4 sm:p-5 ${className}`} style={{ borderColor: "var(--t-primary)", background: "var(--t-surface)" }}>
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)" }}>
        <Clock className="size-6" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xl leading-tight font-bold sm:text-2xl" style={{ fontFamily: "var(--t-titulo)" }}>Pediu até 14h, chega hoje</p>
        <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--t-muted)" }}>Pedidos feitos até as 14h são entregues no mesmo dia, dentro da região atendida.</p>
      </div>
    </div>
  );
}

/** Lista de regiões atendidas (ou aviso, na loja real sem lista). */
export function Regioes({ d, className = "" }: { d: DadosLoja; className?: string }) {
  const lista = regioes(d);
  if (!lista.length) {
    return <p className={`text-sm ${className}`} style={{ color: "var(--t-muted)" }}>Confira se entregamos na sua região ao informar o CEP no pedido.</p>;
  }
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {lista.map((r) => (
        <li key={r} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm" style={{ borderColor: "var(--t-line)", background: "var(--t-bg)" }}>
          <MapPin className="size-3.5 shrink-0" style={{ color: "var(--t-primary)" }} aria-hidden="true" /> {r}
        </li>
      ))}
    </ul>
  );
}

/** Retirada na loja — só informativa. */
export function Retirada({ d }: { d: DadosLoja }) {
  return (
    <p className="flex items-start gap-2 text-sm" style={{ color: "var(--t-muted)" }}>
      <Store className="mt-0.5 size-4 shrink-0" style={{ color: "var(--t-primary)" }} aria-hidden="true" />
      <span>{d.demo ? "Retirada na loja: combine o horário com a gente (informação de exemplo)." : "Retirada na loja: combine o horário com a loja."}</span>
    </p>
  );
}
