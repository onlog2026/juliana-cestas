"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { advanceOrderStatus } from "@/modules/orders/actions";

const NEXT_LABEL: Record<string, string> = {
  pago: "Iniciar preparação",
  em_preparacao: "Marcar como pronto",
  pronto: "Saiu para entrega",
  saiu_para_entrega: "Marcar como entregue",
};

export function AdvanceStatusButton({ orderId, status }: { orderId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const label = NEXT_LABEL[status];

  if (!label) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await advanceOrderStatus(orderId);
            if (!result.ok) setError(result.error);
          })
        }
        className="flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        {label}
      </button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
