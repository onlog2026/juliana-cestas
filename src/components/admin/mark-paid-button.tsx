"use client";

import { useState, useTransition } from "react";
import { Loader2, CircleDollarSign } from "lucide-react";
import { markOrderPaid } from "@/modules/orders/actions";

export function MarkPaidButton({ orderId, status }: { orderId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (status !== "aguardando_pagamento" && status !== "novo") return null;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await markOrderPaid(orderId);
            if (!result.ok) setError(result.error);
          })
        }
        className="flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <CircleDollarSign className="size-4" />}
        Marcar como pago
      </button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
