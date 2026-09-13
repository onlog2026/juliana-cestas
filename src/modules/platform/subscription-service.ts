import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type SellerPlan = {
  slug: string;
  name: string;
  monthlyCents: number;
  annualDiscountPct: number;
};

/** Planos visíveis que o lojista pode assinar, na ordem da vitrine. */
export async function getSellerPlans(): Promise<SellerPlan[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("subscription_plans")
    .select("slug, name, monthly_cents, annual_discount_pct, is_visible, sort_order")
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });
  return (data ?? [])
    .map((r) => ({
      slug: r.slug as string,
      name: r.name as string,
      monthlyCents: (r.monthly_cents as number | null) ?? 0,
      annualDiscountPct: Number(r.annual_discount_pct) || 0,
    }))
    .filter((p) => p.monthlyCents > 0);
}

/** Preço próprio da loja (ex.: Juliana R$299), se houver. */
export async function getSellerCustomPriceCents(tenantId: string): Promise<number | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("tenants")
    .select("custom_subscription_cents")
    .eq("id", tenantId)
    .maybeSingle();
  return (data?.custom_subscription_cents as number | null) ?? null;
}
