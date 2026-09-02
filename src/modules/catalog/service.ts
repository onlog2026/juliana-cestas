import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { TENANT_ID } from "@/lib/tenant";
import type { Product } from "@/lib/mock-content";

export type DbProduct = {
  id: string;
  slug: string;
  name: string;
  serves: string | null;
  size: string | null;
  price_cents: number;
  items: string[];
  packaging: string | null;
  image_url: string | null;
  badge: string | null;
};

export type DbProductAddon = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
};

/** Catálogo público (home, categoria, página de produto) — vem sempre do banco. */
export async function getAllProducts(): Promise<Product[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("products")
    .select("id, slug, name, serves, size, price_cents, items, packaging, image_url, badge")
    .eq("tenant_id", TENANT_ID)
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];

  return data.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    serves: p.serves ?? "",
    size: p.size ?? "",
    price: p.price_cents / 100,
    items: p.items ?? [],
    packaging: p.packaging ?? "",
    image: p.image_url ?? "",
    badge: p.badge ?? undefined,
  }));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await getAllProducts();
  return products.find((p) => p.slug === slug) ?? null;
}

export async function getProductForCheckout(slug: string) {
  const supabase = createAdminClient();

  const { data: product, error } = await supabase
    .from("products")
    .select(
      "id, slug, name, serves, size, price_cents, items, packaging, image_url, badge"
    )
    .eq("tenant_id", TENANT_ID)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error || !product) return null;

  const { data: addons } = await supabase
    .from("product_addons")
    .select("id, slug, name, price_cents")
    .eq("product_id", product.id)
    .eq("active", true);

  return {
    product: product as DbProduct,
    addons: (addons ?? []) as DbProductAddon[],
  };
}
