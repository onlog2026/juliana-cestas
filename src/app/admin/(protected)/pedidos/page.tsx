import Link from "next/link";
import { listOrders } from "@/modules/orders/actions";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatCents } from "@/lib/money";

export default async function AdminPedidosPage(props: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await props.searchParams;
  const orders = await listOrders(status ? { status } : undefined);

  const filters = [
    { value: "", label: "Todos" },
    { value: "aguardando_pagamento", label: "Aguardando pagamento" },
    { value: "pago", label: "Pago" },
    { value: "em_preparacao", label: "Em preparação" },
    { value: "pronto", label: "Pronto" },
    { value: "saiu_para_entrega", label: "Saiu para entrega" },
    { value: "entregue", label: "Entregue" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Pedidos</h1>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {filters.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/admin/pedidos?status=${f.value}` : "/admin/pedidos"}
            className={`shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
              (status ?? "") === f.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-accent"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">Nenhum pedido encontrado.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-card border border-border bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Pedido</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Entrega</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                  <td className="px-4 py-3">
                    <Link href={`/admin/pedidos/${order.id}`} className="font-medium text-primary hover:underline">
                      #{order.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-foreground">{order.buyer_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {order.delivery_date.split("-").reverse().slice(0, 2).join("/")} ·{" "}
                    {order.delivery_slot_start.slice(0, 5)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">
                    {formatCents(order.total_cents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
