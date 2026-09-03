"use client";

import { useState, useTransition } from "react";
import { Loader2, X } from "lucide-react";
import { cancelOrder } from "@/modules/orders/actions";

const NON_CANCELABLE = new Set(["entregue", "cancelado", "reembolsado"]);

export function CancelOrderButton({ orderId, status }: { orderId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (NON_CANCELABLE.has(status)) return null;

  function handleCancel() {
    const reason = window.prompt("Motivo do cancelamento (opcional):") ?? "";
    if (!window.confirm("Cancelar este pedido? Essa ação não pode ser desfeita.")) return;
    startTransition(async () => {
      setError(null);
      const result = await cancelOrder(orderId, reason);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={handleCancel}
        className="flex h-10 items-center gap-1.5 rounded-full border border-destructive/40 px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
        Cancelar pedido
      </button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
