"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { excluirGrupo, excluirPedido } from "@/modules/orders/actions";
import { useConfirm } from "@/components/ui/confirm-dialog";

/**
 * "Excluir pedido" -- diferente de "Cancelar pedido". Cancelar guarda o
 * registro; excluir apaga de vez. O banco recusa excluir um pedido que já
 * tem pagamento ou chamado de suporte (ver o comentário de `excluirPedido`
 * em `orders/actions.ts`) -- quando isso acontece, a mensagem de erro já vem
 * pronta explicando e sugerindo "Cancelar" no lugar.
 *
 * Pedido já pago (ou adiante na fila) exige DIGITAR o número do pedido: é o
 * único caso em que um clique distraído apagaria o rastro de dinheiro.
 */
export function DeleteOrderButton({
  orderId,
  orderNumber,
  status,
  groupCount = 1,
}: {
  orderId: string;
  orderNumber: number;
  status: string;
  groupCount?: number;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    const exigeNumero = status !== "aguardando_pagamento" && status !== "cancelado";
    const r = await confirm({
      title: `Excluir o pedido #${orderNumber}?`,
      tone: "danger",
      confirmLabel: "Excluir de vez",
      cancelLabel: "Voltar",
      description:
        "Essa ação NÃO tem volta: ao contrário de cancelar, não fica nenhum registro depois. Se você só quer tirar o pedido da fila, use Cancelar.",
      requireText: exigeNumero
        ? { text: String(orderNumber), label: `Este pedido já andou na fila. Para confirmar, digite ${orderNumber}` }
        : undefined,
      choices:
        groupCount > 1
          ? [
              { value: "one", label: "Só esta cesta" },
              { value: "all", label: `Todas as ${groupCount} cestas do carrinho`, hint: "Tudo ou nada: se uma não puder ser excluída, nenhuma é." },
            ]
          : undefined,
    });
    if (!r.ok) return;
    startTransition(async () => {
      const result = r.choice === "all" ? await excluirGrupo(orderId) : await excluirPedido(orderId);
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
        className="flex h-11 items-center gap-1.5 rounded-full text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        Excluir
      </button>
      {error ? <span className="max-w-xs text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
