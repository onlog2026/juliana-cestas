"use client";

import { useState, useTransition } from "react";
import { Loader2, Check } from "lucide-react";
import { setFreeShippingThreshold } from "@/modules/delivery/zone-actions";
import { reaisToCents } from "@/components/admin/delivery-zone-edit-form";

const inputClass =
  "h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** "Frete grátis acima de R$__" — grava em delivery_settings. */
export function FreeShippingField({ initialCents }: { initialCents: number | null }) {
  const [value, setValue] = useState(
    initialCents != null ? (initialCents / 100).toFixed(2).replace(".", ",") : ""
  );
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    setSaved(false);
    const t = value.trim();
    const cents = t ? reaisToCents(t) : null;
    if (cents != null && (Number.isNaN(cents) || cents < 0)) {
      setError("Informe um valor válido (ou deixe em branco para desligar).");
      return;
    }
    startTransition(async () => {
      const r = await setFreeShippingThreshold(cents);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="rounded-card border border-border bg-card p-5">
      <p className="text-sm font-semibold text-foreground">Frete grátis acima de um valor</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Pedidos a partir desse valor não pagam frete. Deixe em branco para desligar.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">R$</span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ex.: 300,00"
          inputMode="decimal"
          className={`${inputClass} max-w-[160px]`}
        />
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : null}
          {saved ? "Salvo" : "Salvar"}
        </button>
      </div>
      {error ? <p className="mt-1.5 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
