"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { TENANT_ID } from "@/lib/tenant";
import { requireStaff } from "@/lib/auth/require-staff";

export type CategoryInput = {
  id?: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  active: boolean;
};

function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function upsertCategory(
  input: CategoryInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();

  if (!input.name.trim()) return { ok: false, error: "Dê um nome para a categoria." };

  const admin = createAdminClient();
  const slug = slugify(input.slug || input.name).slice(0, 60) || crypto.randomUUID().slice(0, 8);

  const row = {
    tenant_id: TENANT_ID,
    slug,
    name: input.name.trim(),
    description: input.description.trim() || null,
    image_url: input.imageUrl.trim() || null,
    active: input.active,
    updated_at: new Date().toISOString(),
  };

  const query = input.id
    ? admin.from("categories").update(row).eq("id", input.id).eq("tenant_id", TENANT_ID)
    : admin.from("categories").insert({ ...row, sort_order: await nextSortOrder(admin) });

  const { error } = await query;
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Já existe uma categoria com esse link (slug)." };
    return { ok: false, error: "Não foi possível salvar a categoria." };
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/cms");
  revalidatePath("/admin/produtos", "layout");
  return { ok: true };
}

async function nextSortOrder(admin: ReturnType<typeof createAdminClient>): Promise<number> {
  const { data } = await admin
    .from("categories")
    .select("sort_order")
    .eq("tenant_id", TENANT_ID)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.sort_order ?? 0) + 1;
}

export async function deleteCategory(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();

  const admin = createAdminClient();
  const { error } = await admin.from("categories").delete().eq("id", id).eq("tenant_id", TENANT_ID);
  if (error) {
    // FK de products.category_id é RESTRICT de propósito: apagar uma
    // categoria com cesta vinculada apagaria silenciosamente o vínculo.
    if (error.code === "23503") {
      return { ok: false, error: "Essa categoria tem cestas vinculadas. Mude a categoria delas antes de excluir." };
    }
    return { ok: false, error: "Não foi possível excluir." };
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/cms");
  return { ok: true };
}

export async function reorderCategories(
  orderedIds: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();

  const admin = createAdminClient();
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      admin.from("categories").update({ sort_order: index }).eq("id", id).eq("tenant_id", TENANT_ID)
    )
  );
  if (results.some((r) => r.error)) return { ok: false, error: "Não foi possível reordenar." };

  revalidatePath("/", "layout");
  revalidatePath("/admin/cms");
  return { ok: true };
}
