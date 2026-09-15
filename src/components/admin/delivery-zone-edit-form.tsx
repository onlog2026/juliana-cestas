"use client";

import { useState, useTransition } from "react";
import { Loader2, Check } from "lucide-react";
import { upsertDeliveryZone } from "@/modules/delivery/zone-actions";
import type { DeliveryZoneAdmin } from "@/modules/delivery/settings";

const inputClass =
  "h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Centavos -> "10,00" para preencher o campo ao editar. */
function centsToReais(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

/** "10", "10,00", "R$ 10,50" -> centavos. NaN se não der para entender. */
export function reaisToCents(raw: string): number {
  const s = raw.trim().replace(/[^\d.,]/g, "");
  if (!s) return 0;
  const normalized = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  const value = Number.parseFloat(normalized);
  if (Number.isNaN(value)) return Number.NaN;
  return Math.round(value * 100);
}

export function DeliveryZoneEditForm({
  zone,
  onSaved,
  onCancel,
}: {
  zone?: DeliveryZoneAdmin;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(zone?.name ?? "");
  const [price, setPrice] = useState(zone ? centsToReais(zone.fee_cents) : "");
  const [active, setActive] = useState(zone?.active ?? true);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Dê um nome para a área (bairro ou região).");
      return;
    }
    const feeCents = reaisToCents(price);
    if (Number.isNaN(feeCents) || feeCents < 0) {
      setError("Informe um preço válido. Use 0 para frete grátis.");
      return;
    }

    startTransition(async () => {
      const result = await upsertDeliveryZone({ id: zone?.id, name, feeCents, active });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSaved();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[10px] border border-border bg-background p-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">Bairro ou região</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Taguatinga Norte/Sul"
          className={inputClass}
          autoFocus
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">Preço do frete</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">R$</span>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0,00"
            inputMode="decimal"
            className={inputClass}
          />
        </div>
        <span className="mt-1 block text-xs text-muted-foreground">
          Deixe <strong>0</strong> (ou 0,00) para frete grátis nessa área.
        </span>
      </label>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="size-4 rounded border-border"
        />
        Ativa (aparece para o cliente escolher no checkout)
      </label>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Salvar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-10 items-center rounded-full border border-border px-5 text-sm font-medium text-foreground hover:bg-accent"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
