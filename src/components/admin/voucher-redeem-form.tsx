"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Gift, Loader2 } from "lucide-react";
import { redeemVoucher } from "@/modules/platform/redeem-actions";

/** Campo de resgate de cortesia. O código é a única coisa que sai daqui. */
export function VoucherRedeemForm() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!codigo.trim() || enviando) return;
    setEnviando(true);
    setErro(null);
    setOk(null);

    const resultado = await redeemVoucher(codigo);
    setEnviando(false);

    if (!resultado.ok) {
      setErro(resultado.error);
      return;
    }

    const ate = new Date(resultado.ate).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
    setOk(`Cortesia aplicada. Seu acesso está liberado até ${ate}.`);
    setCodigo("");
    router.refresh();
  }

  return (
    <form onSubmit={enviar} className="mt-3">
      <label htmlFor="codigo-cortesia" className="block text-sm font-medium text-foreground">
        Código da cortesia
      </label>
      <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
        <input
          id="codigo-cortesia"
          name="codigo"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          placeholder="CESTA-4K9P"
          autoComplete="off"
          spellCheck={false}
          className="h-12 w-full rounded-[10px] border border-border bg-card px-3.5 font-mono text-sm tracking-wider text-foreground uppercase focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:max-w-xs"
        />
        <button
          type="submit"
          disabled={enviando || !codigo.trim()}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {enviando ? <Loader2 className="size-5 animate-spin" /> : <Gift className="size-5" />}
          {enviando ? "Aplicando…" : "Aplicar cortesia"}
        </button>
      </div>

      {erro ? <p className="mt-2 text-sm text-destructive">{erro}</p> : null}
      {ok ? (
        <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-primary">
          <Check className="size-4" /> {ok}
        </p>
      ) : null}
    </form>
  );
}
