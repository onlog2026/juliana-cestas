"use client";

import { useState, useTransition } from "react";
import { Loader2, CircleDollarSign } from "lucide-react";
import { markGroupPaid, markOrderPaid } from "@/modules/orders/actions";
import { useConfirm } from "@/components/ui/confirm-dialog";

export function MarkPaidButton({
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

  if (status !== "aguardando_pagamento" && status !== "novo") return null;

  async function handleClick() {
    setError(null);
    // Pedido de um carrinho: pergunta se o pagamento foi só desta cesta ou de todas
    // (todas = um único e-mail de confirmação com todas as cestas).
    let all = false;
    if (groupCount > 1) {
      const r = await confirm({
        title: "Marcar como pago",
        description: "Este pedido faz parte de um carrinho. O cliente recebe um e-mail de pagamento confirmado.",
        confirmLabel: "Marcar como pago",
        cancelLabel: "Voltar",
        choices: [
          { value: "one", label: "Só esta cesta" },
          { value: "all", label: `Todas as ${groupCount} cestas do carrinho`, hint: "Um único e-mail para o cliente." },
        ],
      });
      if (!r.ok) return;
      all = r.choice === "all";
    }
    startTransition(async () => {
      const result = all ? await markGroupPaid(orderId) : await markOrderPaid(orderId);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={handleClick}
        className="flex h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <CircleDollarSign className="size-4" />}
        Marcar como pago
      </button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
