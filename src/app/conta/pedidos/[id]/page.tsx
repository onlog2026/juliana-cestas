import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Check } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCustomerOrderDetail } from "@/modules/customers/service";
import { getCardTemplate } from "@/modules/cards/templates";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatCents } from "@/lib/money";

export const metadata = { title: "Meu pedido | Juliana Cestas" };

export default async function ContaPedidoPage(props: PageProps<"/conta/pedidos/[id]">) {
  const { id } = await props.params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const order = await getCustomerOrderDetail(user.id, id);
  if (!order) notFound();

  const template = getCardTemplate(order.card_template);
  const addressLine =
    order.delivery_type === "pickup"
      ? "Retirada na loja"
      : [order.street, order.address_number, order.complement].filter(Boolean).join(", ") +
        (order.neighborhood ? ` — ${order.neighborhood}` : "") +
        (order.zone_name ? ` (${order.zone_name})` : "");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/conta" className="hover:text-primary">
          Meus pedidos
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">#{order.number}</span>
      </nav>

      <div className="mt-3 flex items-center justify-between">
        <h1 className="font-display text-2xl text-foreground">Pedido #{order.number}</h1>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-6 rounded-card border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Entrega</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Para <strong className="text-foreground">{order.recipient_name}</strong>
        </p>
        <p className="text-sm text-muted-foreground">{addressLine}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {order.delivery_date.split("-").reverse().join("/")}, entre {order.delivery_slot_start.slice(0, 5)} e{" "}
          {order.delivery_slot_end.slice(0, 5)}
        </p>
      </div>

      <div className="mt-4 rounded-card border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Itens</h2>
        <ul className="mt-3 space-y-1.5">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between text-sm text-muted-foreground">
              <span>{item.name}</span>
              <span>{formatCents(item.unit_price_cents * item.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-border pt-3 text-base font-semibold text-foreground">
          <span>Total</span>
          <span>{formatCents(order.total_cents)}</span>
        </div>
      </div>

      <div
        className={`mt-4 rounded-2xl border px-8 py-8 ${template.paperClass} ${template.borderClass}`}
        style={{ boxShadow: "var(--jc-shadow)" }}
      >
        <p className="font-display text-lg leading-relaxed text-[#3a3226]">{order.card_message}</p>
        <p className="mt-6 font-display text-base text-[#3a3226]">
          Para {order.card_recipient}
          {order.card_sender ? `, de ${order.card_sender}` : ""}.
        </p>
        <p className="mt-8 text-xs uppercase tracking-[0.12em] text-[#8a7d5f]">Juliana Cestas</p>
      </div>

      <p className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
        <Check className="mt-0.5 size-3.5 shrink-0" />
        Este pedido fica salvo na sua conta — pode voltar aqui quando quiser.
      </p>
    </div>
  );
}
