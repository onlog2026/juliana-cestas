import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getOrderDetail } from "@/modules/orders/actions";
import { StatusBadge } from "@/components/admin/status-badge";
import { AdvanceStatusButton } from "@/components/admin/advance-status-button";
import { CancelOrderButton } from "@/components/admin/cancel-order-button";
import { MarkPaidButton } from "@/components/admin/mark-paid-button";
import { formatCents } from "@/lib/money";

export default async function AdminPedidoDetailPage(props: PageProps<"/admin/pedidos/[id]">) {
  const { id } = await props.params;
  const order = await getOrderDetail(id);
  if (!order) notFound();

  const addressLine =
    order.delivery_type === "pickup"
      ? "Retirada na loja"
      : [order.street, order.address_number, order.complement].filter(Boolean).join(", ") +
        (order.neighborhood ? ` — ${order.neighborhood}` : "") +
        (order.zone_name ? ` (${order.zone_name})` : "");

  return (
    <div className="max-w-3xl">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/admin/pedidos" className="hover:text-primary">
          Pedidos
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">#{order.number}</span>
      </nav>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-foreground">Pedido #{order.number}</h1>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          <MarkPaidButton orderId={order.id} status={order.status} />
          <AdvanceStatusButton orderId={order.id} status={order.status} />
          <CancelOrderButton orderId={order.id} status={order.status} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-card border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Comprador</h2>
          <p className="mt-2 text-sm text-foreground">{order.buyer_name}</p>
          <p className="text-sm text-muted-foreground">{order.buyer_phone}</p>
          {order.buyer_email ? <p className="text-sm text-muted-foreground">{order.buyer_email}</p> : null}
          <p className="text-sm text-muted-foreground">CPF: {order.buyer_cpf}</p>
        </div>

        <div className="rounded-card border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Entrega</h2>
          <p className="mt-2 text-sm text-foreground">Para {order.recipient_name}</p>
          {order.recipient_phone ? <p className="text-sm text-muted-foreground">{order.recipient_phone}</p> : null}
          <p className="text-sm text-muted-foreground">{addressLine}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {order.delivery_date.split("-").reverse().join("/")}, entre{" "}
            {order.delivery_slot_start.slice(0, 5)} e {order.delivery_slot_end.slice(0, 5)}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-card border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Itens</h2>
        <ul className="mt-3 space-y-1.5">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between text-sm text-muted-foreground">
              <span>
                {item.qty}x {item.name}
              </span>
              <span>{formatCents(item.unit_price_cents * item.qty)}</span>
            </li>
          ))}
          {order.delivery_fee_cents > 0 ? (
            <li className="flex justify-between text-sm text-muted-foreground">
              <span>Entrega</span>
              <span>{formatCents(order.delivery_fee_cents)}</span>
            </li>
          ) : null}
          {order.discount_cents > 0 ? (
            <li className="flex justify-between text-sm text-primary">
              <span>Cupom {order.coupon_code}</span>
              <span>- {formatCents(order.discount_cents)}</span>
            </li>
          ) : null}
        </ul>
        <div className="mt-3 flex justify-between border-t border-border pt-3 text-sm font-semibold text-foreground">
          <span>Total</span>
          <span>{formatCents(order.total_cents)}</span>
        </div>
      </div>

      <div className="mt-4 rounded-card border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Cartãozinho ({order.card_template})</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{order.card_message}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Para {order.card_recipient}
          {order.card_sender ? `, de ${order.card_sender}` : ""}.
        </p>
      </div>

      {order.notes ? (
        <div className="mt-4 rounded-card border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Observações</h2>
          <p className="mt-2 text-sm text-foreground">{order.notes}</p>
        </div>
      ) : null}

      <div className="mt-4 rounded-card border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Histórico</h2>
        <ul className="mt-3 space-y-2">
          {order.events.length === 0 ? (
            <li className="text-sm text-muted-foreground">Sem eventos.</li>
          ) : (
            order.events.map((event) => (
              <li key={event.id} className="text-sm text-muted-foreground">
                <span className="text-foreground">{event.type}</span> — {event.actor} —{" "}
                {new Date(event.created_at).toLocaleString("pt-BR")}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
