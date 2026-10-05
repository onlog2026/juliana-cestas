"use client";

import { useId, useState, type FormEvent } from "react";
import { Send } from "lucide-react";

/**
 * EMPRESAS — formulário visual de pedido de orçamento (componente cliente pequeno).
 * Na demo o envio é desligado e dizemos isso. Na loja real, se houver WhatsApp, abre a
 * conversa com os dados preenchidos; sem WhatsApp, orienta a usar o carrinho (Orçamento).
 */
export function FormOrcamento({ demo, whatsapp, base, loja }: { demo: boolean; whatsapp?: string; base: string; loja: string }) {
  const uid = useId();
  const [msg, setMsg] = useState("");
  const zap = whatsapp ? whatsapp.replace(/\D/g, "") : "";

  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (demo) {
      setMsg("Loja de demonstração: o envio do orçamento está desligado. Na sua loja, você define para onde o pedido vai.");
      return;
    }
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "").trim();
    if (zap) {
      const texto = `Olá, ${loja}! Quero um orçamento.\nNome: ${v("nome")}\nEmpresa: ${v("empresa")}\nQuantidade: ${v("quantidade")}\nData da entrega: ${v("data") || "a combinar"}\nObservações: ${v("obs") || "-"}`;
      window.open(`https://wa.me/${zap}?text=${encodeURIComponent(texto)}`, "_blank", "noopener,noreferrer");
      setMsg("Abrimos o WhatsApp com os dados do seu pedido. É só enviar a mensagem.");
      return;
    }
    setMsg("Para pedir o orçamento, adicione as cestas desejadas e finalize no carrinho.");
  }

  const campo = "mt-1.5 block min-h-11 w-full rounded-md border px-3 text-base";
  const estilo = { borderColor: "var(--t-line)", background: "var(--t-bg)", color: "var(--t-fg)" } as const;
  const rot = "text-sm font-semibold";

  return (
    <form onSubmit={enviar} className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 rounded-md border p-5 sm:grid-cols-2 sm:p-7" style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }} aria-label="Pedido de orçamento">
      <label className={`${rot} min-w-0`} htmlFor={`${uid}-nome`}>Seu nome
        <input id={`${uid}-nome`} name="nome" required autoComplete="name" className={campo} style={estilo} />
      </label>
      <label className={`${rot} min-w-0`} htmlFor={`${uid}-empresa`}>Empresa
        <input id={`${uid}-empresa`} name="empresa" required autoComplete="organization" className={campo} style={estilo} />
      </label>
      <label className={`${rot} min-w-0`} htmlFor={`${uid}-qtd`}>Quantidade de cestas
        <input id={`${uid}-qtd`} name="quantidade" type="number" inputMode="numeric" min={1} required className={campo} style={estilo} />
      </label>
      <label className={`${rot} min-w-0`} htmlFor={`${uid}-data`}>Data da entrega <span style={{ color: "var(--t-muted)" }} className="font-normal">(opcional)</span>
        <input id={`${uid}-data`} name="data" type="date" className={campo} style={estilo} />
      </label>
      <label className={`${rot} min-w-0 sm:col-span-2`} htmlFor={`${uid}-obs`}>Observações <span style={{ color: "var(--t-muted)" }} className="font-normal">(opcional)</span>
        <textarea id={`${uid}-obs`} name="obs" rows={3} className={`${campo} py-2`} style={estilo} />
      </label>
      <div className="min-w-0 sm:col-span-2">
        <button type="submit" aria-disabled={demo} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border px-6 text-base font-bold aria-disabled:cursor-not-allowed aria-disabled:opacity-80 sm:w-auto" style={{ background: "var(--t-primary)", color: "var(--t-on-primary)", borderColor: "var(--t-primary)" }}>
          <Send className="size-4" aria-hidden="true" /> {demo ? "Pedir orçamento (desligado na demo)" : "Pedir orçamento"}
        </button>
        <p role="status" aria-live="polite" className="mt-3 text-sm leading-relaxed" style={{ color: msg ? "var(--t-fg)" : "var(--t-muted)" }}>
          {msg || (demo ? "Na demonstração nada é enviado nem cobrado." : "Informe a quantidade e a data para receber valores e prazo.")}
        </p>
        {!demo && !zap ? <a href={`${base}/categoria`} className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold underline">Escolher as cestas</a> : null}
      </div>
    </form>
  );
}
