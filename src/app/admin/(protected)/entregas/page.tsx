import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { TENANT_ID } from "@/lib/tenant";
import { requireStaff } from "@/lib/auth/require-staff";
import { StatusBadge } from "@/components/admin/status-badge";
import { AdvanceStatusButton } from "@/components/admin/advance-status-button";
import { saoPauloDateStr } from "@/lib/time/sao-paulo";

export default async function AdminEntregasPage(props: {
  searchParams: Promise<{ data?: string }>;
}) {
  await requireStaff();
  const { data: dateParam } = await props.searchParams;
  const date = dateParam ?? saoPauloDateStr();

  const admin = createAdminClient();
  const { data: orders } = await admin
    .from("orders")
    .select("id, number, status, recipient_name, delivery_type, delivery_slot_start, delivery_slot_end, street, address_number, neighborhood, zone_name")
    .eq("tenant_id", TENANT_ID)
    .eq("delivery_date", date)
    .in("status", ["pronto", "saiu_para_entrega", "entregue"])
    .order("delivery_slot_start", { ascending: true });

  const grouped = new Map<string, typeof orders>();
  for (const order of orders ?? []) {
    const key = `${order.delivery_slot_start.slice(0, 5)}–${order.delivery_slot_end.slice(0, 5)}`;
    grouped.set(key, [...(grouped.get(key) ?? []), order]);
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Entregas</h1>

      <form method="get" className="mt-4 flex items-center gap-2">
        <input
          type="date"
          name="data"
          defaultValue={date}
          className="h-10 rounded-[10px] border border-border bg-card px-3 text-sm text-foreground"
        />
        <button type="submit" className="h-10 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-accent">
          Ver
        </button>
      </form>

      {(orders ?? []).length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">Nenhuma entrega prevista para essa data.</p>
      ) : (
        <div className="mt-6 space-y-6">
          {Array.from(grouped.entries()).map(([slot, group]) => (
            <div key={slot}>
              <h2 className="text-sm font-semibold text-foreground">{slot}</h2>
              <div className="mt-2 space-y-2">
                {group?.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col gap-2 rounded-card border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <Link href={`/admin/pedidos/${order.id}`} className="font-medium text-primary hover:underline">
                        #{order.number}
                      </Link>
                      <span className="ml-2 text-sm text-foreground">{order.recipient_name}</span>
                      <p className="text-xs text-muted-foreground">
                        {order.delivery_type === "pickup"
                          ? "Retirada na loja"
                          : `${order.street ?? ""}, ${order.address_number ?? ""} — ${order.neighborhood ?? ""} (${order.zone_name ?? ""})`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={order.status} />
                      <AdvanceStatusButton orderId={order.id} status={order.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
