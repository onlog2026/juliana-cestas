"use client";

import { useState, useTransition } from "react";
import { Loader2, Check } from "lucide-react";
import { updateProductDelivery } from "@/modules/catalog/actions";

function centsToReais(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function reaisToCents(raw: string): number {
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
}

export function ProductDeliveryForm({
  productId,
  deliveryFeeCents,
}: {
  productId: string;
  deliveryFeeCents: number;
}) {
  const [raw, setRaw] = useState(centsToReais(deliveryFeeCents));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateProductDelivery({ productId, deliveryFeeCents: reaisToCents(raw) });
      if (!result.ok) setError(result.error);
      else setSaved(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">Valor de entrega (R$)</span>
        <input
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          inputMode="decimal"
          placeholder="0,00"
          className="h-11 w-40 rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : null}
        {saved ? "Salvo" : "Salvar"}
      </button>

      {error ? <p className="w-full text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
