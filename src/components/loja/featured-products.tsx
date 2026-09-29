import { getTenantId } from "@/lib/tenant/context";
import { getActiveCategoryTree } from "@/modules/catalog/categories";
import { isPublicCategory } from "@/modules/seo/public-category";
import { getAllProducts } from "@/modules/catalog/service";
import { getSoldUnits } from "@/modules/catalog/showcases";
import { getContent } from "@/modules/content/service";
import { ProductCard } from "./product-card";
import { PromoBanners, PromoFill } from "./promo-banners";
import { SortableProductGrid, type GridCategory, type GridEntry } from "./sortable-product-grid";

// Grade de 2 colunas (celular) / 3 (tablet) / 5 (computador): o cartão ocupa
// ~50vw / ~33vw / ~20vw. Pedir mais que isso só baixaria bytes à toa.
const GRID_SIZES = "(min-width: 1536px) 16vw, (min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw";

/**
 * "Nossas cestas": a grade principal da home. O servidor monta os cartões
 * (ProductCard segue sendo server component) na ordem manual da loja; o
 * `SortableProductGrid` só os reordena no navegador quando o cliente escolhe
 * outra ordem -- assim a home continua estática.
 *
 * `id="mais-pedidas"` fica como âncora-alias: a seção já se chamou "Mais
 * pedidas" e ainda pode haver link antigo (Google, WhatsApp) apontando pra lá.
 */
export async function FeaturedProducts() {
  const tenantId = await getTenantId();
  const [products, promoContent, sold, tree] = await Promise.all([
    getAllProducts(tenantId),
    getContent(tenantId, "promo_banners"),
    getSoldUnits(tenantId),
    getActiveCategoryTree(tenantId).catch(() => []),
  ]);

  // Chips de categoria: só as que têm cesta (categoria vazia ou de teste não vira chip).
  const used = new Set(products.map((p) => p.categoryId).filter(Boolean));
  const categories: GridCategory[] = tree
    .filter(isPublicCategory)
    .map((c) => ({ slug: c.slug, name: c.name, ids: [c.id, ...c.children.map((k) => k.id)] }))
    .filter((c) => c.ids.some((id) => used.has(id)));

  const entries: GridEntry[] = products.map((product, index) => ({
    id: product.id,
    order: index,
    price: product.price,
    createdAt: product.createdAt ?? "",
    categoryId: product.categoryId,
    sold: sold.get(product.id) ?? 0,
    node: <ProductCard product={product} sizes={GRID_SIZES} />,
  }));

  // Só passa o bloco se há o que mostrar -- um bloco vazio ainda abriria uma
  // linha em branco (com espaçamento) no meio da grade.
  const hasPromo =
    promoContent.enabled && Boolean(promoContent.wide.imageUrl || promoContent.narrow.imageUrl);

  return (
    <section id="nossas-cestas" className="mx-auto scroll-mt-32 max-w-[1800px] px-4 py-10 sm:px-6 lg:px-8 2xl:px-12">
      <span id="mais-pedidas" aria-hidden="true" />
      <SortableProductGrid
        title="Nossas cestas"
        categories={categories}
        entries={entries}
        promo={hasPromo ? <PromoBanners promo={promoContent} /> : undefined}
        fill={promoContent.enabled && promoContent.fill?.imageUrl ? <PromoFill promo={promoContent} /> : undefined}
      />
    </section>
  );
}
