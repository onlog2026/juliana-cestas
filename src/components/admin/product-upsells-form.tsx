"use client";

import { useState, useTransition } from "react";
import { Loader2, Check } from "lucide-react";
import { updateProductUpsells } from "@/modules/catalog/actions";
import { formatCents } from "@/lib/money";

type OtherProduct = { id: string; name: string; price_cents: number };

export function ProductUpsellsForm({
  productId,
  otherProducts,
  selectedIds,
}: {
  productId: string;
  otherProducts: OtherProduct[];
  selectedIds: string[];
}) {
  const [selected, setSelected] = useState<string[]>(selectedIds);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function toggle(id: string) {
    setSaved(false);
    setSelected((current) => (current.includes(id) ? current.filter((i) => i !== id) : [...current, id]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateProductUpsells({ productId, upsellProductIds: selected });
      if (!result.ok) setError(result.error);
      else setSaved(true);
    });
  }

  if (otherProducts.length === 0) {
    return <p className="text-sm text-muted-foreground">Não há outros produtos cadastrados para sugerir.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        {otherProducts.map((product) => (
          <label
            key={product.id}
            className="flex items-center justify-between gap-2 rounded-[10px] border border-border px-3.5 py-2.5"
          >
            <span className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={selected.includes(product.id)}
                onChange={() => toggle(product.id)}
                className="size-4 rounded border-border"
              />
              {product.name}
            </span>
            <span className="text-sm text-muted-foreground">{formatCents(product.price_cents)}</span>
          </label>
        ))}
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
