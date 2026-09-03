import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { TENANT_ID } from "@/lib/tenant";

export type Coupon = {
  id: string;
  code: string;
  type: "percent" | "fixed" | "free_shipping";
  percentOff: number | null;
  valueCents: number | null;
  minOrderCents: number;
  usageLimit: number | null;
  perCustomerLimit: number | null;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
};

const COUPON_COLUMNS =
  "id, code, type, percent_off, value_cents, min_order_cents, usage_limit, per_customer_limit, starts_at, ends_at, active";

function mapCoupon(row: {
  id: string;
  code: string;
  type: string;
  percent_off: number | null;
  value_cents: number | null;
  min_order_cents: number;
  usage_limit: number | null;
  per_customer_limit: number | null;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
}): Coupon {
  return {
    id: row.id,
    code: row.code,
    type: row.type as Coupon["type"],
    percentOff: row.percent_off,
    valueCents: row.value_cents,
    minOrderCents: row.min_order_cents,
    usageLimit: row.usage_limit,
    perCustomerLimit: row.per_customer_limit,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    active: row.active,
  };
}

/** Todos os cupons do tenant, pro painel admin (inclui inativos). */
export async function getAllCouponsAdmin(): Promise<Coupon[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("coupons")
    .select(COUPON_COLUMNS)
    .eq("tenant_id", TENANT_ID)
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapCoupon);
}

/** Quantas vezes um cupom já foi usado no total -- pro painel mostrar. */
export async function getCouponRedemptionCounts(): Promise<Record<string, number>> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("coupon_redemptions").select("coupon_id").eq("tenant_id", TENANT_ID);
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.coupon_id] = (counts[row.coupon_id] ?? 0) + 1;
  }
  return counts;
}
