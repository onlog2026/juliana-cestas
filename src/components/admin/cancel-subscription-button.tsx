"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelMySubscription } from "@/modules/platform/subscription-actions";
import { useConfirm } from "@/components/ui/confirm-dialog";

/** "Cancelar assinatura": confirma no meio da tela; nada é apagado, só para a cobrança. */
export function CancelSubscriptionButton() {
  const confirm = useConfirm();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [feito, setFeito] = useState(false);

  async function onClick() {
    setErro(null);
    const r = await confirm({
      title: "Cancelar a assinatura?",
      description:
        "A cobrança para de vir. Sua loja e todos os seus dados continuam guardados, e você pode assinar de novo quando quiser. O acesso aos recursos segue as regras da sua validade atual.",
      confirmLabel: "Cancelar assinatura",
      cancelLabel: "Manter assinatura",
      tone: "danger",
    });
    if (!r.ok) return;
    start(async () => {
      const res = await cancelMySubscription();
      if (!res.ok) setErro(res.error);
      else {
        setFeito(true);
        router.refresh();
      }
    });
  }

  if (feito) return <p className="mt-3 text-sm text-muted-foreground">Assinatura cancelada. A situação atualiza em instantes.</p>;
  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex h-11 items-center rounded-full border border-destructive/50 px-5 text-sm font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-60"
      >
        {pending ? "Cancelando…" : "Cancelar assinatura"}
      </button>
      {erro ? <p className="mt-2 text-sm text-destructive">{erro}</p> : null}
    </div>
  );
}
