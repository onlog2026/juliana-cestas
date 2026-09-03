import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { TENANT_ID } from "@/lib/tenant";

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  active: boolean;
  sortOrder: number;
};

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  active: boolean;
  sort_order: number;
};

const CATEGORY_COLUMNS = "id, slug, name, description, image_url, active, sort_order";

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    active: row.active,
    sortOrder: row.sort_order,
  };
}

/** Categorias visíveis no site, na ordem certa. */
export async function getActiveCategories(): Promise<Category[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("categories")
    .select(CATEGORY_COLUMNS)
    .eq("tenant_id", TENANT_ID)
    .eq("active", true)
    .order("sort_order", { ascending: true });
  return (data ?? []).map(mapCategory);
}

/** Todas as categorias (inclui inativas) -- pro painel admin gerenciar. */
export async function getAllCategoriesAdmin(): Promise<Category[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("categories")
    .select(CATEGORY_COLUMNS)
    .eq("tenant_id", TENANT_ID)
    .order("sort_order", { ascending: true });
  return (data ?? []).map(mapCategory);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("categories")
    .select(CATEGORY_COLUMNS)
    .eq("tenant_id", TENANT_ID)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  return data ? mapCategory(data) : null;
}
