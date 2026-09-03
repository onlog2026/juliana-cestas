"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { TENANT_ID } from "@/lib/tenant";
import { requireStaff } from "@/lib/auth/require-staff";

function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type ProductDetailsInput = {
  id: string;
  name: string;
  slug: string;
  serves: string;
  size: string;
  priceCents: number;
  items: string[];
  packaging: string;
  imageUrl: string;
  badge: string;
  active: boolean;
  categoryId: string | null;
  costCents: number | null;
  sku: string;
  barcode: string;
  stockQuantity: number | null;
  lowStockThreshold: number | null;
  ncm: string;
  cest: string;
};

/** Cria uma cesta em branco (o admin preenche o resto na tela de edição). */
export async function createProduct(): Promise<
  { ok: true; id: string } | { ok: false; error: string }
> {
  await requireStaff();

  const admin = createAdminClient();
  const slug = `nova-cesta-${Date.now().toString(36)}`;
  const { data, error } = await admin
    .from("products")
    .insert({
      tenant_id: TENANT_ID,
      slug,
      name: "Nova cesta",
      price_cents: 500,
      active: false,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: "Não foi possível criar o produto." };

  revalidatePath("/admin/produtos");
  return { ok: true, id: data.id };
}

export async function updateProductDetails(
  input: ProductDetailsInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();

  if (!input.name.trim()) return { ok: false, error: "Dê um nome para a cesta." };
  if (!Number.isInteger(input.priceCents) || input.priceCents < 500) {
    return { ok: false, error: "O preço mínimo é R$ 5,00." };
  }
  if (input.costCents !== null && (!Number.isInteger(input.costCents) || input.costCents < 0)) {
    return { ok: false, error: "Custo inválido." };
  }
  if (input.stockQuantity !== null && (!Number.isInteger(input.stockQuantity) || input.stockQuantity < 0)) {
    return { ok: false, error: "Estoque inválido." };
  }
  if (
    input.lowStockThreshold !== null &&
    (!Number.isInteger(input.lowStockThreshold) || input.lowStockThreshold < 0)
  ) {
    return { ok: false, error: "Limite de estoque baixo inválido." };
  }

  const admin = createAdminClient();
  const slug = slugify(input.slug || input.name).slice(0, 80) || input.id;

  const { error } = await admin
    .from("products")
    .update({
      name: input.name.trim(),
      slug,
      serves: input.serves.trim() || null,
      size: input.size.trim() || null,
      price_cents: input.priceCents,
      items: input.items,
      packaging: input.packaging.trim() || null,
      image_url: input.imageUrl.trim() || null,
      badge: input.badge.trim() || null,
      active: input.active,
      category_id: input.categoryId,
      cost_cents: input.costCents,
      sku: input.sku.trim() || null,
      barcode: input.barcode.trim() || null,
      stock_quantity: input.stockQuantity,
      low_stock_threshold: input.lowStockThreshold,
      ncm: input.ncm.trim() || null,
      cest: input.cest.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .eq("tenant_id", TENANT_ID);

  if (error) {
    if (error.code === "23505") return { ok: false, error: "Já existe uma cesta com esse link (slug)." };
    return { ok: false, error: "Não foi possível salvar." };
  }

  revalidatePath("/");
  revalidatePath("/checkout", "layout");
  revalidatePath("/produto", "layout");
  revalidatePath("/admin/produtos");
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();

  const admin = createAdminClient();
  // Soft delete: pedidos antigos referenciam product_id, apagar de vez
  // quebraria o histórico. Desativar já tira do site.
  const { error } = await admin
    .from("products")
    .update({ active: false })
    .eq("id", id)
    .eq("tenant_id", TENANT_ID);

  if (error) return { ok: false, error: "Não foi possível remover." };

  revalidatePath("/");
  revalidatePath("/admin/produtos");
  return { ok: true };
}

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
