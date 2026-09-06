import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Product } from "@/modules/catalog/product";

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
  delivery_fee_cents: number;
  active: boolean;
  category_id: string | null;
  cost_cents: number | null;
  sku: string | null;
  barcode: string | null;
  stock_quantity: number | null;
  low_stock_threshold: number | null;
  ncm: string | null;
  cest: string | null;
  gallery_urls: string[];
  video_url: string | null;
  description: string | null;
  short_description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  image_alt: string | null;
  social_caption: string | null;
};

const ADMIN_PRODUCT_COLUMNS =
  "id, slug, name, serves, size, price_cents, items, packaging, image_url, badge, delivery_fee_cents, active, category_id, cost_cents, sku, barcode, stock_quantity, low_stock_threshold, ncm, cest, gallery_urls, video_url, description, short_description, seo_title, seo_description, image_alt, social_caption";

export type UpsellProduct = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  image_url: string | null;
};

export type DbProductAddon = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
};

const PUBLIC_PRODUCT_COLUMNS =
  "id, slug, name, serves, size, price_cents, items, packaging, image_url, badge, gallery_urls, video_url, description, short_description, seo_title, seo_description, image_alt";

function mapPublicProduct(p: {
  id: string;
  slug: string;
  name: string;
  serves: string | null;
  size: string | null;
  price_cents: number;
  items: string[] | null;
  packaging: string | null;
  image_url: string | null;
  badge: string | null;
  gallery_urls: string[] | null;
  video_url: string | null;
  description?: string | null;
  short_description?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  image_alt?: string | null;
}): Product {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    serves: p.serves ?? "",
    size: p.size ?? "",
    price: p.price_cents / 100,
    items: p.items ?? [],
    packaging: p.packaging ?? "",
    image: p.image_url ?? "",
    images: [p.image_url, ...(p.gallery_urls ?? [])].filter((url): url is string => Boolean(url)),
    videoUrl: p.video_url ?? undefined,
    badge: p.badge ?? undefined,
    description: p.description ?? undefined,
    shortDescription: p.short_description ?? undefined,
    seoTitle: p.seo_title ?? undefined,
    seoDescription: p.seo_description ?? undefined,
    imageAlt: p.image_alt ?? undefined,
  };
}

/** Catálogo público (home, categoria, página de produto) — vem sempre do banco. */
export async function getAllProducts(tenantId: string): Promise<Product[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("products")
    .select(PUBLIC_PRODUCT_COLUMNS)
    .eq("tenant_id", tenantId)
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return data.map(mapPublicProduct);
}

/** Produtos ativos de UMA categoria — usado pela página /categoria/[slug]. */
export async function getProductsByCategoryId(tenantId: string, categoryId: string): Promise<Product[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("products")
    .select(PUBLIC_PRODUCT_COLUMNS)
    .eq("tenant_id", tenantId)
    .eq("category_id", categoryId)
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return data.map(mapPublicProduct);
}

export async function getProductBySlug(tenantId: string, slug: string): Promise<Product | null> {
  const products = await getAllProducts(tenantId);
  return products.find((p) => p.slug === slug) ?? null;
}

export async function getProductForCheckout(tenantId: string, slug: string) {
  const supabase = createAdminClient();

  const { data: product, error } = await supabase
    .from("products")
    .select(ADMIN_PRODUCT_COLUMNS)
    .eq("tenant_id", tenantId)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error || !product) return null;

  const { data: addons } = await supabase
    .from("product_addons")
    .select("id, slug, name, price_cents")
    .eq("tenant_id", tenantId)
    .eq("product_id", product.id)
    .eq("active", true);

  return {
    product: product as DbProduct,
    addons: (addons ?? []) as DbProductAddon[],
  };
}

/** Todos os produtos do tenant, para o painel admin (inclui inativos). */
export async function getAllProductsAdmin(tenantId: string): Promise<DbProduct[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("products")
    .select(ADMIN_PRODUCT_COLUMNS)
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: true });
  return (data ?? []) as DbProduct[];
}

/** Ids dos produtos já marcados como upsell de um produto (pro checkbox do admin). */
export async function getUpsellProductIds(tenantId: string, productId: string): Promise<string[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("product_upsells")
    .select("upsell_product_id")
    .eq("tenant_id", tenantId)
    .eq("product_id", productId);
  return (data ?? []).map((row) => row.upsell_product_id);
}

/** Upsells cadastrados pro produto (cross-sell mostrado no checkout). */
export async function getUpsellsForProduct(tenantId: string, productId: string): Promise<UpsellProduct[]> {
  const supabase = createAdminClient();

  const { data: links } = await supabase
    .from("product_upsells")
    .select("upsell_product_id, sort_order")
    .eq("tenant_id", tenantId)
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });

  if (!links || links.length === 0) return [];

  const { data: products } = await supabase
    .from("products")
    .select("id, slug, name, price_cents, image_url")
    .eq("tenant_id", tenantId)
    .in("id", links.map((l) => l.upsell_product_id))
    .eq("active", true);

  const byId = new Map((products ?? []).map((p) => [p.id, p]));
  return links.map((l) => byId.get(l.upsell_product_id)).filter((p): p is UpsellProduct => Boolean(p));
}
