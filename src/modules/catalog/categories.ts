import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildCategoryTree, type Category, type CategoryNode } from "./category-tree";

export type { Category, CategoryNode } from "./category-tree";

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  active: boolean;
  sort_order: number;
  parent_id: string | null;
};

const CATEGORY_COLUMNS = "id, slug, name, description, image_url, active, sort_order, parent_id";

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    active: row.active,
    sortOrder: row.sort_order,
    parentId: row.parent_id,
  };
}


/** Categorias visíveis no site, na ordem certa. */
export async function getActiveCategories(tenantId: string): Promise<Category[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("categories")
    .select(CATEGORY_COLUMNS)
    .eq("tenant_id", tenantId)
    .eq("active", true)
    .order("sort_order", { ascending: true });
  return (data ?? []).map(mapCategory);
}

/** Todas as categorias (inclui inativas) -- pro painel admin gerenciar. */
export async function getAllCategoriesAdmin(tenantId: string): Promise<Category[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("categories")
    .select(CATEGORY_COLUMNS)
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: true });
  return (data ?? []).map(mapCategory);
}

export async function getCategoryBySlug(tenantId: string, slug: string): Promise<Category | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("categories")
    .select(CATEGORY_COLUMNS)
    .eq("tenant_id", tenantId)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  return data ? mapCategory(data) : null;
}

/** Uma categoria ativa por id (para achar a categoria pai no breadcrumb). */
export async function getCategoryById(tenantId: string, id: string): Promise<Category | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("categories")
    .select(CATEGORY_COLUMNS)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .eq("active", true)
    .maybeSingle();
  return data ? mapCategory(data) : null;
}

/** Árvore de categorias ATIVAS (principal + subcategorias) para o menu da loja. */
export async function getActiveCategoryTree(tenantId: string): Promise<CategoryNode[]> {
  return buildCategoryTree(await getActiveCategories(tenantId));
}

/** Subcategorias ativas de uma categoria principal (para os atalhos na página). */
export async function getSubcategories(tenantId: string, parentId: string): Promise<Category[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("categories")
    .select(CATEGORY_COLUMNS)
    .eq("tenant_id", tenantId)
    .eq("parent_id", parentId)
    .eq("active", true)
    .order("sort_order", { ascending: true });
  return (data ?? []).map(mapCategory);
}

/** Árvore de TODAS as categorias (inclui inativas) para o painel do lojista. */
export async function getAllCategoryTreeAdmin(tenantId: string): Promise<CategoryNode[]> {
  return buildCategoryTree(await getAllCategoriesAdmin(tenantId));
}

/**
 * Os ids da categoria + de todas as subcategorias dela. Uma página de
 * categoria principal usa isto para mostrar os produtos dela E das filhas.
 * Se `category` for uma subcategoria, devolve só o id dela mesma.
 */
export async function getCategoryAndDescendantIds(
  tenantId: string,
  category: Category
): Promise<string[]> {
  if (category.parentId) return [category.id];
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("categories")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("parent_id", category.id)
    .eq("active", true);
  return [category.id, ...((data ?? []) as { id: string }[]).map((r) => r.id)];
}
