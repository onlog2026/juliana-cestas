"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { CouponEditForm } from "@/components/admin/coupon-edit-form";
import { formatCents } from "@/lib/money";
import type { Coupon } from "@/modules/coupons/service";

function describeCoupon(coupon: Coupon): string {
  if (coupon.type === "percent") return `${coupon.percentOff}% de desconto`;
  if (coupon.type === "fixed") return `${formatCents(coupon.valueCents ?? 0)} de desconto`;
  return "Frete grátis";
}

export function CouponsManager({
  coupons,
  redemptionCounts,
}: {
  coupons: Coupon[];
  redemptionCounts: Record<string, number>;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function handleSaved() {
    setEditingId(null);
    setCreating(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {coupons.map((coupon) =>
        editingId === coupon.id ? (
          <CouponEditForm
            key={coupon.id}
            coupon={coupon}
            onSaved={handleSaved}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div
            key={coupon.id}
            className="flex items-center gap-3 rounded-[10px] border border-border bg-background p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{coupon.code}</p>
              <p className="text-xs text-muted-foreground">
                {coupon.active ? "Ativo" : "Inativo"} · {describeCoupon(coupon)}
                {" · "}
                usado {redemptionCounts[coupon.id] ?? 0}
                {coupon.usageLimit !== null ? ` de ${coupon.usageLimit}` : "x"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingId(coupon.id)}
              aria-label="Editar"
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
            >
              <Pencil className="size-4" />
            </button>
          </div>
        )
      )}

      {creating ? (
        <CouponEditForm onSaved={handleSaved} onCancel={() => setCreating(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-border text-sm font-medium text-foreground hover:bg-accent"
        >
          <Plus className="size-4" /> Novo cupom
        </button>
      )}
    </div>
  );
}
