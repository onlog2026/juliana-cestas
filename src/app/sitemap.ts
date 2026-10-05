import type { MetadataRoute } from "next";
import { getAllProducts } from "@/modules/catalog/service";
import { getActiveCategories } from "@/modules/catalog/categories";
import { getTenantId } from "@/lib/tenant/context";
import { getSiteUrlOrFallback } from "@/lib/tenant/site-url";
import { isPublicCategory } from "@/modules/seo/public-category";
import { tipoDoHostAtual, urlBaseDaPlataforma, sitemapDaPlataforma } from "@/modules/platform/seo-plataforma";

/** Páginas que toda loja tem, independente do catálogo. */
const STATIC_PAGES = [
  "",
  "/sobre",
  "/atendimento",
  "/faq",
  "/trocas-e-devolucoes",
  "/avaliacoes",
  "/privacidade",
  "/termos",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { tipo, host } = await tipoDoHostAtual();
  if (tipo === "plataforma") return sitemapDaPlataforma(urlBaseDaPlataforma(host));

  const tenantId = await getTenantId();
  const SITE_URL = await getSiteUrlOrFallback(tenantId);
  const [products, categories] = await Promise.all([
    getAllProducts(tenantId),
    getActiveCategories(tenantId),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.filter(isPublicCategory).map((category) => ({
    url: `${SITE_URL}/categoria/${category.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/produto/${product.slug}`,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
