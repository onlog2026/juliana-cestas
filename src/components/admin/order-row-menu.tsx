"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import { cancelOrder, cancelOrderGroup, excluirGrupo, excluirPedido } from "@/modules/orders/actions";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { PEDIDO_ENCERRADO } from "@/modules/orders/rules";

/**
 * Menu "⋯" de cada pedido na lista: Ver e editar / Cancelar / Excluir, com a
 * mesma caixa de confirmação do detalhe (e a escolha "só esta cesta / todas do
 * carrinho" quando o pedido faz parte de um carrinho).
 */
export function OrderRowMenu({
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
  const [open, setOpen] = useState(false);
  // Menu com posição FIXA na tela: a caixa da tabela tem rolagem própria (overflow) e cortaria
  // um menu absoluto, criando uma barra de rolagem por dentro da lista.
  const [pos, setPos] = useState<{ top?: number; bottom?: number; right: number } | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    // Rolar a página ou redimensionar fecha o menu (senão ele ficaria solto no lugar velho).
    const dismiss = () => setOpen(false);
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [open]);

  function toggle(e: React.MouseEvent<HTMLButtonElement>) {
    if (open) {
      setOpen(false);
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    const right = Math.max(8, window.innerWidth - r.right);
    // Sem espaço embaixo (~170px do menu), abre PARA CIMA.
    setPos(
      window.innerHeight - r.bottom < 180
        ? { bottom: window.innerHeight - r.top + 4, right }
        : { top: r.bottom + 4, right }
    );
    setOpen(true);
  }

  const encerrado = PEDIDO_ENCERRADO.has(status);
  const choices =
    groupCount > 1
      ? [
          { value: "one", label: "Só esta cesta" },
          { value: "all", label: `Todas as ${groupCount} cestas do carrinho` },
        ]
      : undefined;

  async function cancelar() {
    setOpen(false);
    setError(null);
    const jaPago = status !== "aguardando_pagamento";
    const r = await confirm({
      title: `Cancelar o pedido #${orderNumber}?`,
      tone: "danger",
      confirmLabel: "Sim, cancelar",
      cancelLabel: "Voltar",
      description: jaPago
        ? "Este pedido já foi pago: o reembolso NÃO é automático, é preciso devolver o valor pelo Asaas. Não dá para desfazer."
        : "O pedido continua no histórico, mas sai da fila de trabalho. Não dá para desfazer.",
      input: { label: "Motivo (opcional)", optional: true },
      choices,
    });
    if (!r.ok) return;
    startTransition(async () => {
      const res =
        r.choice === "all" ? await cancelOrderGroup(orderId, r.value ?? "") : await cancelOrder(orderId, r.value ?? "");
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  async function excluir() {
    setOpen(false);
    setError(null);
    const exigeNumero = status !== "aguardando_pagamento" && status !== "cancelado";
    const r = await confirm({
      title: `Excluir o pedido #${orderNumber}?`,
      tone: "danger",
      confirmLabel: "Excluir de vez",
      cancelLabel: "Voltar",
      description: "Essa ação NÃO tem volta. Se você só quer tirar o pedido da fila, use Cancelar.",
      requireText: exigeNumero
        ? { text: String(orderNumber), label: `Este pedido já andou na fila. Para confirmar, digite ${orderNumber}` }
        : undefined,
      choices,
    });
    if (!r.ok) return;
    startTransition(async () => {
      const res = r.choice === "all" ? await excluirGrupo(orderId) : await excluirPedido(orderId);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  const item =
    "flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm hover:bg-accent disabled:opacity-40 disabled:hover:bg-transparent";

  return (
    <div ref={box} className="relative inline-block">
      <button
        type="button"
        onClick={toggle}
        aria-label={`Ações do pedido ${orderNumber}`}
        aria-expanded={open}
        className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-5" />}
      </button>
      {open && pos ? (
        <div
          className="fixed z-[70] w-52 overflow-hidden rounded-card border border-border bg-card shadow-lg"
          style={{ top: pos.top, bottom: pos.bottom, right: pos.right }}
        >
          <Link href={`/admin/pedidos/${orderId}`} className={item}>
            <Pencil className="size-4" /> Ver e editar
          </Link>
          <button
            type="button"
            onClick={cancelar}
            disabled={encerrado}
            title={encerrado ? "Pedido já encerrado" : undefined}
            className={`${item} text-destructive`}
          >
            <X className="size-4" /> Cancelar pedido
          </button>
          <button type="button" onClick={excluir} className={`${item} text-destructive`}>
            <Trash2 className="size-4" /> Excluir
          </button>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="fixed bottom-4 right-4 z-[70] w-72 max-w-[calc(100vw-2rem)] rounded-card border border-destructive/30 bg-card p-3 text-sm text-destructive shadow-lg">
          {error}
        </p>
      ) : null}
    </div>
  );
}
