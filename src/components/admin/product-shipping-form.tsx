"use client";

import { useState, useTransition } from "react";
import { Loader2, Check } from "lucide-react";
import { updateProductShipping } from "@/modules/catalog/actions";
import type { DbProduct } from "@/modules/catalog/service";

const input =
  "h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function toDraft(v: number | null): string {
  return v == null ? "" : String(v);
}
function fromDraft(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number.parseInt(t, 10);
  return Number.isNaN(n) ? null : n;
}

/**
 * Envio nacional por transportadora (Fase 2 do frete). Cestas são produto
 * perecível -- por isso isto é opt-in por produto, não uma chave geral da
 * loja: a lojista decide QUAL produto pode viajar de transportadora.
 */
export function ProductShippingForm({ product }: { product: DbProduct }) {
  const [shipsNationally, setShipsNationally] = useState(product.ships_nationally);
  const [weight, setWeight] = useState(toDraft(product.weight_grams));
  const [length, setLength] = useState(toDraft(product.length_cm));
  const [width, setWidth] = useState(toDraft(product.width_cm));
  const [height, setHeight] = useState(toDraft(product.height_cm));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateProductShipping({
        productId: product.id,
        shipsNationally,
        weightGrams: fromDraft(weight),
        lengthCm: fromDraft(length),
        widthCm: fromDraft(width),
        heightCm: fromDraft(height),
      });
      if (!result.ok) setError(result.error);
      else setSaved(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={shipsNationally}
          onChange={(e) => setShipsNationally(e.target.checked)}
          className="size-4 rounded border-border"
        />
        Este produto pode ser enviado pra fora da área local (transportadora)
      </label>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-foreground">Peso (g)</span>
          <input value={weight} onChange={(e) => setWeight(e.target.value)} inputMode="numeric" placeholder="500" className={input} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-foreground">Comprimento (cm)</span>
          <input value={length} onChange={(e) => setLength(e.target.value)} inputMode="numeric" placeholder="30" className={input} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-foreground">Largura (cm)</span>
          <input value={width} onChange={(e) => setWidth(e.target.value)} inputMode="numeric" placeholder="20" className={input} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-foreground">Altura (cm)</span>
          <input value={height} onChange={(e) => setHeight(e.target.value)} inputMode="numeric" placeholder="15" className={input} />
        </label>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : null}
        {saved ? "Salvo" : "Salvar"}
      </button>
    </form>
  );
}
