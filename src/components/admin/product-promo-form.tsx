"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { updateProductPromo } from "@/modules/catalog/actions";
import { discountPercent, resolveRibbon, type FlagsConfig } from "@/modules/flags/logic";
import { ProductRibbon } from "@/components/loja/product-ribbon";

const inputClass =
  "h-11 rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const brl = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function inputToCents(raw: string): number | null {
  const clean = raw.trim().replace(/\./g, "").replace(",", ".");
  if (!clean) return null;
  const value = Number.parseFloat(clean);
  return Number.isFinite(value) ? Math.round(value * 100) : null;
}

/**
 * "Promoção e flag" da cesta. O dono digita o PREÇO PROMOCIONAL (menor que o
 * normal): a cesta passa a custar esse valor e o normal aparece riscado, com o %
 * de desconto automático. Apagar o campo termina a promoção e devolve o normal.
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
  /** Preço que a cesta cobra HOJE (com promoção ativa, é o promocional). */
  priceCents: number;
  imageUrl: string | null;
  /** Preço normal guardado ("de"); só existe com promoção ativa. */
  initialCompareAtCents: number | null;
  initialFlagId: string | null;
  flags: FlagsConfig;
  /** false = a migração 0051 ainda não rodou (o formulário avisa em vez de falhar). */
  available: boolean;
}) {
  const promoActive = Boolean(initialCompareAtCents && initialCompareAtCents > priceCents);
  const normalCents = promoActive ? (initialCompareAtCents as number) : priceCents;

  const [promo, setPromo] = useState(promoActive ? centsToInput(priceCents) : "");
  const [flagId, setFlagId] = useState(initialFlagId ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const promoCents = inputToCents(promo);
  const invalid = promoCents !== null && (promoCents >= normalCents || promoCents < 500);
  const validPromo = promoCents !== null && !invalid ? promoCents : null;
  const pct = validPromo !== null ? discountPercent(validPromo, normalCents) : null;
  const ribbon = resolveRibbon(
    {
      priceCents: validPromo ?? normalCents,
      compareAtCents: validPromo !== null ? normalCents : null,
      flagId: flagId || null,
    },
    flags
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (invalid) {
      setError(
        promoCents !== null && promoCents < 500
          ? "O preço mínimo é R$ 5,00."
          : "O preço promocional precisa ser MENOR que o preço normal."
      );
      return;
    }
    startTransition(async () => {
      const result = await updateProductPromo({ productId, promoPriceCents: promoCents, flagId: flagId || null });
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

      <p className="rounded-lg bg-secondary/60 p-3 text-sm text-foreground">
        Preço normal da cesta: <strong>{brl(normalCents)}</strong>
        {promoActive ? (
          <>
            {" "}
            · em promoção por <strong>{brl(priceCents)}</strong>
          </>
        ) : null}
      </p>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">Preço promocional (R$) — opcional</span>
        <input
          value={promo}
          onChange={(e) => {
            setPromo(e.target.value);
            setSaved(false);
          }}
          inputMode="decimal"
          placeholder={`Menor que ${centsToInput(normalCents)}`}
          aria-invalid={invalid}
          className={inputClass}
          style={{ width: "100%" }}
        />
        <span className="mt-1 block text-xs text-muted-foreground">
          {pct && validPromo !== null ? (
            <strong className="text-foreground">
              A cesta passa a custar {brl(validPromo)} (de {brl(normalCents)}) — desconto de {pct}% aparece automático.
            </strong>
          ) : (
            "Digite um valor MENOR que o normal: é o que o cliente vai pagar. Apague o campo para terminar a promoção."
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
        <div className="relative ml-2 mt-2 h-36 w-36">
          <div className="relative size-full overflow-hidden rounded-card bg-secondary">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- prévia pequena no painel
              <img src={imageUrl} alt="" className="size-full object-cover" />
            ) : null}
          </div>
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
