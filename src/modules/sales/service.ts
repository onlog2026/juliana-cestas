import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { TENANT_ID } from "@/lib/tenant";

export type SalesSummary = {
  revenueCents: number;
  ordersCount: number;
  avgTicketCents: number;
};

export type SalesDay = {
  day: string;
  revenueCents: number;
  ordersCount: number;
};

export type TopProduct = {
  name: string;
  qty: number;
  revenueCents: number;
};

export type LowStockProduct = {
  id: string;
  name: string;
  stockQuantity: number;
  lowStockThreshold: number;
};

/** from/to em "YYYY-MM-DD", ambos inclusive, no calendário de Brasília. */
export async function getSalesSummary(from: string, to: string): Promise<SalesSummary> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .rpc("sales_summary", { p_tenant: TENANT_ID, p_from: from, p_to: to })
    .single();
  const row = data as { revenue_cents: number; orders_count: number } | null;

  const revenueCents = Number(row?.revenue_cents ?? 0);
  const ordersCount = Number(row?.orders_count ?? 0);
  return {
    revenueCents,
    ordersCount,
    avgTicketCents: ordersCount > 0 ? Math.round(revenueCents / ordersCount) : 0,
  };
}

export async function getSalesByDay(from: string, to: string): Promise<SalesDay[]> {
  const supabase = createAdminClient();
  const { data } = await supabase.rpc("sales_by_day", { p_tenant: TENANT_ID, p_from: from, p_to: to });
  return (data ?? []).map((row: { day: string; revenue_cents: number; orders_count: number }) => ({
    day: row.day,
    revenueCents: Number(row.revenue_cents),
    ordersCount: Number(row.orders_count),
  }));
}

export async function getTopProducts(from: string, to: string, limit = 5): Promise<TopProduct[]> {
  const supabase = createAdminClient();
  const { data } = await supabase.rpc("sales_top_products", {
    p_tenant: TENANT_ID,
    p_from: from,
    p_to: to,
    p_limit: limit,
  });
  return (data ?? []).map((row: { name: string; qty: number; revenue_cents: number }) => ({
    name: row.name,
    qty: Number(row.qty),
    revenueCents: Number(row.revenue_cents),
  }));
}

export async function getLowStockProducts(): Promise<LowStockProduct[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("products")
    .select("id, name, stock_quantity, low_stock_threshold")
    .eq("tenant_id", TENANT_ID)
    .eq("active", true)
    .not("stock_quantity", "is", null)
    .not("low_stock_threshold", "is", null);

  return (data ?? [])
    .filter((p) => p.stock_quantity !== null && p.low_stock_threshold !== null && p.stock_quantity <= p.low_stock_threshold)
    .map((p) => ({
      id: p.id,
      name: p.name,
      stockQuantity: p.stock_quantity as number,
      lowStockThreshold: p.low_stock_threshold as number,
    }));
}
