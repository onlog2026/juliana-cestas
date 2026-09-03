import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { TENANT_ID } from "@/lib/tenant";
import { formatCents } from "@/lib/money";

export type ValidatedCoupon = {
  id: string;
  code: string;
  type: "percent" | "fixed" | "free_shipping";
  percentOff: number | null;
  valueCents: number | null;
};

/**
 * Confere um cupom contra o banco -- validade, valor mínimo, limite de uso
 * total e por cliente. Nunca confia no que o cliente mandou sobre o cupom,
 * só o código; tudo o mais (tipo, desconto, limites) vem do banco.
 */
export async function validateCoupon(input: {
  code: string;
  buyerEmail: string;
  merchandiseCents: number;
}): Promise<{ ok: true; coupon: ValidatedCoupon } | { ok: false; error: string }> {
  const code = input.code.trim().toUpperCase();
  if (!code) return { ok: false, error: "Informe um cupom." };

  const admin = createAdminClient();
  const { data: coupon } = await admin
    .from("coupons")
    .select(
      "id, code, type, percent_off, value_cents, min_order_cents, usage_limit, per_customer_limit, starts_at, ends_at, active"
    )
    .eq("tenant_id", TENANT_ID)
    .ilike("code", code)
    .maybeSingle();

  if (!coupon || !coupon.active) return { ok: false, error: "Cupom inválido." };

  const now = new Date();
  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    return { ok: false, error: "Esse cupom ainda não começou a valer." };
  }
  if (coupon.ends_at && new Date(coupon.ends_at) < now) {
    return { ok: false, error: "Esse cupom expirou." };
  }
  if (input.merchandiseCents < coupon.min_order_cents) {
    return { ok: false, error: `Esse cupom exige pedido mínimo de ${formatCents(coupon.min_order_cents)}.` };
  }

  if (coupon.usage_limit !== null) {
    const { count } = await admin
      .from("coupon_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("coupon_id", coupon.id);
    if ((count ?? 0) >= coupon.usage_limit) return { ok: false, error: "Esse cupom já atingiu o limite de uso." };
  }

  if (coupon.per_customer_limit !== null) {
    const { count } = await admin
      .from("coupon_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("coupon_id", coupon.id)
      .ilike("buyer_email", input.buyerEmail);
    if ((count ?? 0) >= coupon.per_customer_limit) {
      return { ok: false, error: "Você já usou esse cupom o máximo de vezes permitido." };
    }
  }

  return {
    ok: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type as ValidatedCoupon["type"],
      percentOff: coupon.percent_off,
      valueCents: coupon.value_cents,
    },
  };
}

/** Free shipping não entra aqui -- ele zera o frete direto no quote.ts. */
export function computeDiscount(coupon: ValidatedCoupon, merchandiseCents: number): number {
  if (coupon.type === "percent") return Math.round((merchandiseCents * (coupon.percentOff ?? 0)) / 100);
  if (coupon.type === "fixed") return Math.min(coupon.valueCents ?? 0, merchandiseCents);
  return 0;
}
