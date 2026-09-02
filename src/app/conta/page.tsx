import Link from "next/link";
import { Package } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCustomerOrders } from "@/modules/customers/service";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatCents } from "@/lib/money";
import { LogoutButton } from "@/components/conta/logout-button";

export const metadata = { title: "Meus pedidos | Juliana Cestas" };

export default async function ContaPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // proxy.ts já redireciona quem não está logado, mas o TS não sabe disso.
  if (!user) return null;

  const orders = await getCustomerOrders(user.id, user.email ?? null);
  const displayName = (user.user_metadata?.name as string | undefined) || user.email || "";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-2xl text-primary">Juliana Cestas</p>
          <h1 className="mt-1 text-lg font-semibold text-foreground">Olá, {displayName}</h1>
        </div>
        <LogoutButton />
      </div>

      <h2 className="mt-8 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Package className="size-4" /> Meus pedidos
      </h2>

      {orders.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Você ainda não tem pedidos com este e-mail.{" "}
          <Link href="/" className="text-primary hover:underline">
            Ver as cestas
          </Link>
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/conta/pedidos/${order.id}`}
              className="jc-nav-hover flex items-center justify-between rounded-card border border-border bg-card p-4"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  Pedido #{order.number} — {order.recipient_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {order.delivery_date.split("-").reverse().join("/")} às {order.delivery_slot_start.slice(0, 5)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">{formatCents(order.total_cents)}</span>
                <StatusBadge status={order.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
