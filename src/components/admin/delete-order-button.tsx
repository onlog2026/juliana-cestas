"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { excluirPedido } from "@/modules/orders/actions";

/**
 * "Excluir pedido" -- diferente de "Cancelar pedido". Cancelar guarda o
 * registro; excluir apaga de vez. O banco recusa excluir um pedido que já
 * tem pagamento ou chamado de suporte (ver o comentário de `excluirPedido`
 * em `orders/actions.ts`) -- quando isso acontece, a mensagem de erro já vem
 * pronta explicando e sugerindo "Cancelar" no lugar.
 */
export function DeleteOrderButton({ orderId, orderNumber }: { orderId: string; orderNumber: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    if (
      !confirm(
        `Excluir o pedido #${orderNumber} de vez? Essa ação NÃO tem volta -- ao contrário de cancelar, não fica nenhum registro depois.`
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await excluirPedido(orderId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/admin/pedidos");
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={handleDelete}
        className="flex h-10 items-center gap-1.5 rounded-full text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        Excluir
      </button>
      {error ? <span className="max-w-xs text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
