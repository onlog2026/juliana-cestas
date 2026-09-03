"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { TENANT_ID } from "@/lib/tenant";
import { requireStaff } from "@/lib/auth/require-staff";

export async function updateProductDelivery(input: {
  productId: string;
  deliveryFeeCents: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();

  if (!Number.isInteger(input.deliveryFeeCents) || input.deliveryFeeCents < 0) {
    return { ok: false, error: "Valor de entrega inválido." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("products")
    .update({ delivery_fee_cents: input.deliveryFeeCents })
    .eq("id", input.productId)
    .eq("tenant_id", TENANT_ID);

  if (error) return { ok: false, error: "Não foi possível salvar." };

  revalidatePath("/checkout", "layout");
  revalidatePath("/admin/produtos");
  return { ok: true };
}

export async function updateProductUpsells(input: {
  productId: string;
  upsellProductIds: string[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();

  const admin = createAdminClient();

  // Substitui a lista inteira: apaga o que existia e insere de novo --
  // mais simples e seguro do que calcular diff, e a tabela é pequena.
  const { error: deleteError } = await admin
    .from("product_upsells")
    .delete()
    .eq("product_id", input.productId);
  if (deleteError) return { ok: false, error: "Não foi possível salvar." };

  const ids = input.upsellProductIds.filter((id) => id !== input.productId);
  if (ids.length > 0) {
    const { error: insertError } = await admin.from("product_upsells").insert(
      ids.map((upsellProductId, index) => ({
        tenant_id: TENANT_ID,
        product_id: input.productId,
        upsell_product_id: upsellProductId,
        sort_order: index,
      }))
    );
    if (insertError) return { ok: false, error: "Não foi possível salvar." };
  }

  revalidatePath("/checkout", "layout");
  revalidatePath("/admin/produtos");
  return { ok: true };
}
