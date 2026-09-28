"use client";

import Image from "next/image";
import { AlertTriangle, Pencil, Trash2 } from "lucide-react";
import type { CartItem } from "@/modules/cart/types";
import { giftIssues } from "@/modules/cart/validate";
import { formatCents } from "@/lib/money";

/** "2026-09-30" -> "30/09" */
function formatShortDate(iso: string): string {
  if (!iso) return "";
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

type Props = {
  gift: CartItem;
  onEdit: () => void;
  onRemove: () => void;
};

export function CartItemRow({ gift, onEdit, onRemove }: Props) {
  const issues = giftIssues(gift);
  const isComplete = issues.length === 0;
  const dateLabel = gift.delivery.deliveryDate
    ? `${formatShortDate(gift.delivery.deliveryDate)}${gift.delivery.deliverySlotStart ? ` às ${gift.delivery.deliverySlotStart}` : ""}`
    : null;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-[10px] bg-secondary">
        {gift.display.imageUrl ? (
          <Image src={gift.display.imageUrl} alt={gift.display.name} fill sizes="64px" className="object-cover" />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{gift.display.name}</p>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {gift.recipient.name ? `Para ${gift.recipient.name}` : "Destinatário não preenchido"}
        </p>
        {dateLabel ? <p className="text-xs text-muted-foreground">{dateLabel}</p> : null}

        {!isComplete ? (
          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-destructive">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            Falta: {issues.join(", ")}
          </p>
        ) : null}

        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <Pencil className="size-3.5" /> Editar
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1 text-sm font-medium text-destructive hover:underline"
          >
            <Trash2 className="size-3.5" /> Remover
          </button>
        </div>
      </div>

      <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
        {gift.estimatedCents !== null ? formatCents(gift.estimatedCents) : "—"}
      </p>
    </div>
  );
}
