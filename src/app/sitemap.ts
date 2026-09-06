import type { MetadataRoute } from "next";
import { getAllProducts } from "@/modules/catalog/service";
import { getActiveCategories } from "@/modules/catalog/categories";
import { getTenantId } from "@/lib/tenant/context";

// TODO F7: a URL pública de cada loja vai vir de `tenant_domains`. Enquanto
// esse mapa não existe, a única fonte é o env da loja legada.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://juliana-cestas-loja.vercel.app";

/** Páginas que toda loja tem, independente do catálogo. */
const STATIC_PAGES = ["", "/sobre", "/atendimento", "/faq", "/trocas-e-devolucoes"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tenantId = await getTenantId();
  const [products, categories] = await Promise.all([
    getAllProducts(tenantId),
    getActiveCategories(tenantId),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/categoria/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/produto/${product.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
