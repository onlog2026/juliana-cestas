"use client";

import { useEffect, useState } from "react";

/** PROMO — contador regressivo até as 23:59:59 de hoje (horário do visitante). Começa vazio para não divergir do servidor. */
function restante() {
  const agora = new Date();
  const fim = new Date(agora);
  fim.setHours(23, 59, 59, 999);
  const s = Math.max(0, Math.floor((fim.getTime() - agora.getTime()) / 1000));
  return { h: Math.floor(s / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}
const dois = (n: number) => String(n).padStart(2, "0");

export default function Contador({ className }: { className?: string }) {
  const [t, setT] = useState<ReturnType<typeof restante> | null>(null);
  useEffect(() => {
    setT(restante());
    const id = window.setInterval(() => setT(restante()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const caixas: Array<[string, string]> = [["horas", t ? dois(t.h) : "--"], ["min", t ? dois(t.m) : "--"], ["seg", t ? dois(t.s) : "--"]];
  return (
    <div className={className}>
      <p className="text-sm font-semibold tracking-wide uppercase">Ofertas terminam hoje às 23:59</p>
      <div className="mt-2 flex items-center gap-2" role="timer" aria-label={t ? `Faltam ${t.h} horas, ${t.m} minutos e ${t.s} segundos` : "Contador das ofertas"}>
        {caixas.map(([rot, v], i) => (
          <div key={rot} className="flex items-center gap-2">
            <div className="flex min-w-14 flex-col items-center px-2 py-1.5" style={{ background: "var(--t-fg)", color: "var(--t-bg)", borderRadius: 4 }}>
              <span className="text-2xl leading-none font-bold tabular-nums" style={{ fontFamily: "var(--t-titulo)" }}>{v}</span>
              <span className="mt-0.5 text-[10px] tracking-wider uppercase">{rot}</span>
            </div>
            {i < 2 ? <span className="text-xl font-bold" aria-hidden="true">:</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
