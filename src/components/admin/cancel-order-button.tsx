"use client";

import { useState, useTransition } from "react";
import { Loader2, X } from "lucide-react";
import { cancelOrder, cancelOrderGroup } from "@/modules/orders/actions";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { PEDIDO_ENCERRADO } from "@/modules/orders/rules";

export function CancelOrderButton({
  orderId,
  status,
  groupCount = 1,
}: {
  orderId: string;
  status: string;
  /** Quantas cestas tem o carrinho deste pedido (1 = pedido avulso). */
  groupCount?: number;
}) {
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (PEDIDO_ENCERRADO.has(status)) return null;

  async function handleCancel() {
    setError(null);
    const jaPago = status !== "aguardando_pagamento";
    const r = await confirm({
      title: "Cancelar este pedido?",
      tone: "danger",
      confirmLabel: "Sim, cancelar",
      cancelLabel: "Voltar",
      description: (
        <>
          O pedido continua no histórico, mas sai da fila de trabalho. Não dá para desfazer.
          {jaPago ? (
            <strong className="mt-2 block text-foreground">
              Este pedido já foi pago: o reembolso NÃO é automático, é preciso devolver o valor pelo Asaas.
            </strong>
          ) : null}
        </>
      ),
      input: { label: "Motivo (opcional)", placeholder: "Ex.: cliente desistiu", optional: true },
      choices:
        groupCount > 1
          ? [
              { value: "one", label: "Só esta cesta" },
              { value: "all", label: `Todas as ${groupCount} cestas do carrinho` },
            ]
          : undefined,
    });
    if (!r.ok) return;
    startTransition(async () => {
      const result =
        r.choice === "all" ? await cancelOrderGroup(orderId, r.value ?? "") : await cancelOrder(orderId, r.value ?? "");
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={handleCancel}
        className="flex h-11 items-center gap-1.5 rounded-full border border-destructive/40 px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
        Cancelar pedido
      </button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
