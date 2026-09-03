"use client";

import { useState, useTransition } from "react";
import { Loader2, Check } from "lucide-react";
import { upsertCoupon, type CouponInput } from "@/modules/coupons/actions";
import type { Coupon } from "@/modules/coupons/service";

function centsToReais(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function reaisToCents(raw: string): number {
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
}

function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

type Draft = {
  code: string;
  type: "percent" | "fixed" | "free_shipping";
  percentOff: string;
  value: string;
  minOrder: string;
  usageLimit: string;
  perCustomerLimit: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
};

function toDraft(coupon?: Coupon): Draft {
  return {
    code: coupon?.code ?? "",
    type: coupon?.type ?? "percent",
    percentOff: coupon?.percentOff !== null && coupon?.percentOff !== undefined ? String(coupon.percentOff) : "",
    value: coupon?.valueCents !== null && coupon?.valueCents !== undefined ? centsToReais(coupon.valueCents) : "",
    minOrder: coupon ? centsToReais(coupon.minOrderCents) : "0,00",
    usageLimit: coupon?.usageLimit !== null && coupon?.usageLimit !== undefined ? String(coupon.usageLimit) : "",
    perCustomerLimit:
      coupon?.perCustomerLimit !== null && coupon?.perCustomerLimit !== undefined
        ? String(coupon.perCustomerLimit)
        : "",
    startsAt: toDateInput(coupon?.startsAt ?? null),
    endsAt: toDateInput(coupon?.endsAt ?? null),
    active: coupon?.active ?? true,
  };
}

export function CouponEditForm({
  coupon,
  onSaved,
  onCancel,
}: {
  coupon?: Coupon;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(toDraft(coupon));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const input: CouponInput = {
      id: coupon?.id,
      code: draft.code,
      type: draft.type,
      percentOff: draft.type === "percent" ? Number.parseInt(draft.percentOff, 10) || null : null,
      valueCents: draft.type === "fixed" ? reaisToCents(draft.value) : null,
      minOrderCents: reaisToCents(draft.minOrder),
      usageLimit: draft.usageLimit.trim() ? Number.parseInt(draft.usageLimit, 10) : null,
      perCustomerLimit: draft.perCustomerLimit.trim() ? Number.parseInt(draft.perCustomerLimit, 10) : null,
      startsAt: draft.startsAt ? new Date(`${draft.startsAt}T00:00:00`).toISOString() : null,
      endsAt: draft.endsAt ? new Date(`${draft.endsAt}T23:59:59`).toISOString() : null,
      active: draft.active,
    };
    startTransition(async () => {
      const result = await upsertCoupon(input);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSaved();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[10px] border border-border bg-background p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Código</span>
          <input
            value={draft.code}
            onChange={(e) => set("code", e.target.value.toUpperCase())}
            placeholder="BEMVINDO10"
            className="h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm uppercase text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Tipo</span>
          <select
            value={draft.type}
            onChange={(e) => set("type", e.target.value as Draft["type"])}
            className="h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="percent">Percentual (%)</option>
            <option value="fixed">Valor fixo (R$)</option>
            <option value="free_shipping">Frete grátis</option>
          </select>
        </label>

        {draft.type === "percent" ? (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">Percentual de desconto</span>
            <input
              value={draft.percentOff}
              onChange={(e) => set("percentOff", e.target.value)}
              inputMode="numeric"
              placeholder="10"
              className="h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        ) : null}
        {draft.type === "fixed" ? (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">Valor do desconto (R$)</span>
            <input
              value={draft.value}
              onChange={(e) => set("value", e.target.value)}
              inputMode="decimal"
              placeholder="20,00"
              className="h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        ) : null}

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Pedido mínimo (R$)</span>
          <input
            value={draft.minOrder}
            onChange={(e) => set("minOrder", e.target.value)}
            inputMode="decimal"
            className="h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Limite de uso total (em branco = sem limite)</span>
          <input
            value={draft.usageLimit}
            onChange={(e) => set("usageLimit", e.target.value)}
            inputMode="numeric"
            placeholder="Sem limite"
            className="h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Limite por cliente (em branco = sem limite)</span>
          <input
            value={draft.perCustomerLimit}
            onChange={(e) => set("perCustomerLimit", e.target.value)}
            inputMode="numeric"
            placeholder="Sem limite"
            className="h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Começa em (opcional)</span>
          <input
            type="date"
            value={draft.startsAt}
            onChange={(e) => set("startsAt", e.target.value)}
            className="h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Expira em (opcional)</span>
          <input
            type="date"
            value={draft.endsAt}
            onChange={(e) => set("endsAt", e.target.value)}
            className="h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={draft.active}
          onChange={(e) => set("active", e.target.checked)}
          className="size-4 rounded border-border"
        />
        Ativo (aceita ser usado no checkout)
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
