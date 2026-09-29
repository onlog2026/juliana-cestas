"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { updateProductPromo } from "@/modules/catalog/actions";
import { discountPercent, resolveRibbon, type FlagsConfig } from "@/modules/flags/logic";
import { ProductRibbon } from "@/components/loja/product-ribbon";

const inputClass =
  "h-11 rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function centsToInput(cents: number | null): string {
  return cents ? (cents / 100).toFixed(2).replace(".", ",") : "";
}

function inputToCents(raw: string): number | null {
  const clean = raw.trim().replace(/\./g, "").replace(",", ".");
  if (!clean) return null;
  const value = Number.parseFloat(clean);
  return Number.isFinite(value) ? Math.round(value * 100) : null;
}

/**
 * "Promoção e flag" da cesta: preço "de" + uma flag. Mostra a prévia da tarja
 * exatamente como fica na foto, e o % de desconto calculado.
 */
export function ProductPromoForm({
  productId,
  priceCents,
  imageUrl,
  initialCompareAtCents,
  initialFlagId,
  flags,
  available,
}: {
  productId: string;
  priceCents: number;
  imageUrl: string | null;
  initialCompareAtCents: number | null;
  initialFlagId: string | null;
  flags: FlagsConfig;
  /** false = a migração 0051 ainda não rodou (o formulário avisa em vez de falhar). */
  available: boolean;
}) {
  const [compare, setCompare] = useState(centsToInput(initialCompareAtCents));
  const [flagId, setFlagId] = useState(initialFlagId ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const compareCents = inputToCents(compare);
  const pct = discountPercent(priceCents, compareCents);
  const ribbon = resolveRibbon({ priceCents, compareAtCents: compareCents, flagId: flagId || null }, flags);
  const invalidCompare = compareCents !== null && compareCents <= priceCents;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (invalidCompare) {
      setError('O preço "de" precisa ser maior que o preço atual.');
      return;
    }
    startTransition(async () => {
      const result = await updateProductPromo({
        productId,
        compareAtPriceCents: compareCents,
        flagId: flagId || null,
      });
      if (!result.ok) setError(result.error);
      else setSaved(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!available ? (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Promoções ainda não estão liberadas no banco (falta rodar o SQL 0051). Você já pode ver como fica, mas o
          botão Salvar só funciona depois.
        </p>
      ) : null}

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">Preço &quot;de&quot; (R$) — opcional</span>
        <input
          value={compare}
          onChange={(e) => {
            setCompare(e.target.value);
            setSaved(false);
          }}
          inputMode="decimal"
          placeholder="Ex.: 300,00"
          className={inputClass}
          style={{ width: "100%" }}
        />
        <span className="mt-1 block text-xs text-muted-foreground">
          O preço atual da cesta ({(priceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}) é o
          &quot;por&quot;.{" "}
          {pct ? (
            <strong className="text-foreground">Desconto de {pct}% aparece automático.</strong>
          ) : (
            "Deixe vazio se não há promoção."
          )}
        </span>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">Flag (tarja na foto)</span>
        <select
          value={flagId}
          onChange={(e) => {
            setFlagId(e.target.value);
            setSaved(false);
          }}
          className={inputClass}
          style={{ width: "100%" }}
        >
          <option value="">Nenhuma{pct ? " (mostra o desconto automático)" : ""}</option>
          {flags.items
            .filter((f) => f.enabled || f.id === flagId)
            .map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
        </select>
      </label>

      <div>
        <p className="mb-1.5 text-sm font-medium text-foreground">Prévia</p>
        <div className="relative h-36 w-36 overflow-hidden rounded-card bg-secondary">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- prévia pequena no painel
            <img src={imageUrl} alt="" className="size-full object-cover" />
          ) : null}
          {ribbon ? <ProductRibbon {...ribbon} size={80} /> : null}
        </div>
        {!ribbon ? <p className="mt-1 text-xs text-muted-foreground">Sem tarja para este produto.</p> : null}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : null}
        {saved ? "Salvo" : "Salvar promoção"}
      </button>
    </form>
  );
}
