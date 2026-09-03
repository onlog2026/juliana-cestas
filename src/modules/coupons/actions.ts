"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { TENANT_ID } from "@/lib/tenant";
import { requireStaff } from "@/lib/auth/require-staff";

export type CouponInput = {
  id?: string;
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

export async function upsertCoupon(
  input: CouponInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();

  const code = input.code.trim().toUpperCase();
  if (!code) return { ok: false, error: "Dê um código para o cupom." };
  if (input.type === "percent" && (!input.percentOff || input.percentOff <= 0 || input.percentOff > 100)) {
    return { ok: false, error: "Informe um percentual entre 1 e 100." };
  }
  if (input.type === "fixed" && (!input.valueCents || input.valueCents <= 0)) {
    return { ok: false, error: "Informe um valor de desconto." };
  }

  const admin = createAdminClient();
  const row = {
    tenant_id: TENANT_ID,
    code,
    type: input.type,
    percent_off: input.type === "percent" ? input.percentOff : null,
    value_cents: input.type === "fixed" ? input.valueCents : null,
    min_order_cents: input.minOrderCents,
    usage_limit: input.usageLimit,
    per_customer_limit: input.perCustomerLimit,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    active: input.active,
    updated_at: new Date().toISOString(),
  };

  const query = input.id
    ? admin.from("coupons").update(row).eq("id", input.id).eq("tenant_id", TENANT_ID)
    : admin.from("coupons").insert(row);

  const { error } = await query;
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Já existe um cupom com esse código." };
    return { ok: false, error: "Não foi possível salvar o cupom." };
  }

  revalidatePath("/admin/cupons");
  return { ok: true };
}
