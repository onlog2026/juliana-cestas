"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
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
  galleryUrls: string[];
  videoUrl: string;
  description: string;
  shortDescription: string;
  seoTitle: string;
  seoDescription: string;
  imageAlt: string;
  socialCaption: string;
};

/** Cria uma cesta em branco (o admin preenche o resto na tela de edição). */
export async function createProduct(): Promise<
  { ok: true; id: string } | { ok: false; error: string }
> {
  const staff = await requireStaff();

  const admin = createAdminClient();
  const slug = `nova-cesta-${Date.now().toString(36)}`;
  const { data, error } = await admin
    .from("products")
    .insert({
      tenant_id: staff.tenantId,
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
  const staff = await requireStaff();

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
  if (input.galleryUrls.length > 4) {
    return { ok: false, error: "No máximo 4 fotos extras (5 no total, com a capa)." };
  }
  // Mesmos tetos da migração 0036 -- checar aqui também evita depender só do
  // CHECK do banco recusar em silêncio (a mensagem fica clara pra lojista).
  if (input.description.length > 4000) return { ok: false, error: "Descrição muito longa." };
  if (input.shortDescription.length > 300) return { ok: false, error: "Descrição curta muito longa." };
  if (input.seoTitle.length > 160) return { ok: false, error: "Título de SEO muito longo." };
  if (input.seoDescription.length > 300) return { ok: false, error: "Descrição de SEO muito longa." };
  if (input.imageAlt.length > 200) return { ok: false, error: "Texto alternativo muito longo." };
  if (input.socialCaption.length > 600) return { ok: false, error: "Legenda muito longa." };

  const admin = createAdminClient();
  const slug = slugify(input.slug || input.name).slice(0, 80) || input.id;

  const { data, error } = await admin
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
      gallery_urls: input.galleryUrls,
      video_url: input.videoUrl.trim() || null,
      description: input.description.trim() || null,
      short_description: input.shortDescription.trim() || null,
      seo_title: input.seoTitle.trim() || null,
      seo_description: input.seoDescription.trim() || null,
      image_alt: input.imageAlt.trim() || null,
      social_caption: input.socialCaption.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .eq("tenant_id", staff.tenantId)
    .select("id");

  if (error) {
    if (error.code === "23505") return { ok: false, error: "Já existe uma cesta com esse link (slug)." };
    return { ok: false, error: "Não foi possível salvar." };
  }
  // RLS pode recusar em silêncio (0 linhas, sem exceção) -- sem checar isso a
  // tela diria "salvo!" e nada teria mudado.
  if (!data || data.length === 0) {
    return { ok: false, error: "Não foi possível salvar: a cesta não pertence a esta loja." };
  }

  revalidatePath("/");
  revalidatePath("/checkout", "layout");
  revalidatePath("/produto", "layout");
  revalidatePath("/admin/produtos");
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const staff = await requireStaff();

  const admin = createAdminClient();
  // Soft delete: pedidos antigos referenciam product_id, apagar de vez
  // quebraria o histórico. Desativar já tira do site.
  const { error } = await admin
    .from("products")
    .update({ active: false })
    .eq("id", id)
    .eq("tenant_id", staff.tenantId);

  if (error) return { ok: false, error: "Não foi possível remover." };

  revalidatePath("/");
  revalidatePath("/admin/produtos");
  return { ok: true };
}

export async function updateProductDelivery(input: {
  productId: string;
  deliveryFeeCents: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const staff = await requireStaff();

  if (!Number.isInteger(input.deliveryFeeCents) || input.deliveryFeeCents < 0) {
    return { ok: false, error: "Valor de entrega inválido." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("products")
    .update({ delivery_fee_cents: input.deliveryFeeCents })
    .eq("id", input.productId)
    .eq("tenant_id", staff.tenantId);

  if (error) return { ok: false, error: "Não foi possível salvar." };

  revalidatePath("/checkout", "layout");
  revalidatePath("/admin/produtos");
  return { ok: true };
}

export async function updateProductUpsells(input: {
  productId: string;
  upsellProductIds: string[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const staff = await requireStaff();

  const admin = createAdminClient();

  // O produto que recebe os upsells precisa ser DESTA loja -- o id vem do
  // navegador e sem esta checagem um admin poderia editar produto alheio.
  const { data: target } = await admin
    .from("products")
    .select("id")
    .eq("id", input.productId)
    .eq("tenant_id", staff.tenantId)
    .maybeSingle();
  if (!target) return { ok: false, error: "Produto não encontrado nesta loja." };

  // Substitui a lista inteira: apaga o que existia e insere de novo --
  // mais simples e seguro do que calcular diff, e a tabela é pequena.
  const { error: deleteError } = await admin
    .from("product_upsells")
    .delete()
    .eq("tenant_id", staff.tenantId)
    .eq("product_id", input.productId);
  if (deleteError) return { ok: false, error: "Não foi possível salvar." };

  const requested = input.upsellProductIds.filter((id) => id !== input.productId);

  // Os ids dos upsells também vêm do navegador: só entram os que realmente
  // pertencem a esta loja. Id de outra loja é descartado em silêncio (a tela
  // só oferece produtos próprios -- quem manda outro está forçando a barra).
  let ids: string[] = [];
  if (requested.length > 0) {
    const { data: owned } = await admin
      .from("products")
      .select("id")
      .eq("tenant_id", staff.tenantId)
      .in("id", requested);
    const ownedIds = new Set((owned ?? []).map((p) => p.id));
    ids = requested.filter((id) => ownedIds.has(id));
  }

  if (ids.length > 0) {
    const { error: insertError } = await admin.from("product_upsells").insert(
      ids.map((upsellProductId, index) => ({
        tenant_id: staff.tenantId,
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
