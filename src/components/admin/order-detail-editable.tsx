"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import type { AdminOrderDetail } from "@/modules/orders/actions";
import { podeAlterarPedido } from "@/modules/orders/rules";
import { OrderEditForm } from "@/components/admin/order-edit-form";

/**
 * A parte do pedido que pode ser editada: entrega, cartãozinho, observações.
 * "Comprador" e os itens/valores ficam de fora de propósito (ver
 * `atualizarDadosPedido` em `orders/actions.ts`) e continuam só-leitura na
 * página, fora deste componente.
 */
export function OrderDetailEditable({ order }: { order: AdminOrderDetail }) {
  const [editando, setEditando] = useState(false);

  const addressLine =
    order.delivery_type === "pickup"
      ? "Retirada na loja"
      : [order.street, order.address_number, order.complement].filter(Boolean).join(", ") +
        (order.neighborhood ? ` — ${order.neighborhood}` : "") +
        (order.zone_name ? ` (${order.zone_name})` : "");

  const podeEditar = podeAlterarPedido(order.status);

  if (editando) {
    return <OrderEditForm order={order} onCancel={() => setEditando(false)} />;
  }

  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-card border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">Entrega</h2>
            {podeEditar ? (
              <button
                type="button"
                onClick={() => setEditando(true)}
                aria-label="Editar dados do pedido"
                title="Editar dados do pedido"
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Pencil className="size-4" />
              </button>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-foreground">Para {order.recipient_name}</p>
          {order.recipient_phone ? <p className="text-sm text-muted-foreground">{order.recipient_phone}</p> : null}
          <p className="text-sm text-muted-foreground">{addressLine}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {order.delivery_date.split("-").reverse().join("/")}, entre {order.delivery_slot_start.slice(0, 5)} e{" "}
            {order.delivery_slot_end.slice(0, 5)}
          </p>
        </div>

        <div className="rounded-card border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Cartãozinho ({order.card_template})</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{order.card_message}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Para {order.card_recipient}
            {order.card_sender ? `, de ${order.card_sender}` : ""}.
          </p>
        </div>
      </div>

      {order.notes ? (
        <div className="mt-4 rounded-card border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Observações</h2>
          <p className="mt-2 text-sm text-foreground">{order.notes}</p>
        </div>
      ) : null}

      {!podeEditar ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Esse pedido já foi encerrado (entregue, cancelado ou reembolsado) e não pode mais ser alterado.
        </p>
      ) : null}
    </>
  );
}
