import Link from "next/link";
import { ChevronRight, FolderTree } from "lucide-react";
import { getAllProductsAdmin } from "@/modules/catalog/service";
import { getAllCategoriesAdmin } from "@/modules/catalog/categories";
import { requireStaff } from "@/lib/auth/require-staff";
import { formatCents } from "@/lib/money";
import { NewProductButton } from "@/components/admin/new-product-button";
import { ProductThumbnail } from "@/components/admin/product-thumbnail";

export default async function AdminProdutosPage() {
  const staff = await requireStaff();
  const [products, categories] = await Promise.all([
    getAllProductsAdmin(staff.tenantId),
    getAllCategoriesAdmin(staff.tenantId),
  ]);
  // "Categoria › Subcategoria" de cada produto, para a lista mostrar onde ele está.
  const byId = new Map(categories.map((c) => [c.id, c]));
  const categoryLabel = (id: string | null) => {
    const c = id ? byId.get(id) : null;
    if (!c) return null;
    const parent = c.parentId ? byId.get(c.parentId) : null;
    return parent ? `${parent.name} › ${c.name}` : c.name;
  };

  return (
    <div className="max-w-[1400px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-foreground">Produtos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Dados, valor de entrega e produtos sugeridos (upsell) de cada cesta. Retirada na loja é sempre grátis.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Link
            href="/admin/produtos/categorias"
            className="flex h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-accent"
          >
            <FolderTree className="size-4" /> Categorias
          </Link>
          <NewProductButton />
        </div>
      </div>

      <div className="mt-6 divide-y divide-border rounded-card border border-border bg-card">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/admin/produtos/${product.id}`}
            className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-accent"
          >
            <div className="flex min-w-0 items-center gap-3">
              <ProductThumbnail imageUrl={product.image_url} alt={product.name} />
              <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {product.name}
                {!product.active ? (
                  <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-normal text-muted-foreground">
                    inativa
                  </span>
                ) : null}
              </p>
              <p className="text-xs text-muted-foreground">
                {categoryLabel(product.category_id) ? (
                  <>
                    <span className="font-medium text-foreground/80">{categoryLabel(product.category_id)}</span>
                    {" · "}
                  </>
                ) : null}
                {formatCents(product.price_cents)}
                {" · "}
                Entrega: {product.delivery_fee_cents > 0 ? formatCents(product.delivery_fee_cents) : "grátis"}
                {product.stock_quantity !== null ? (
                  <>
                    {" · "}
                    <span
                      className={
                        product.low_stock_threshold !== null &&
                        product.stock_quantity <= product.low_stock_threshold
                          ? "font-medium text-destructive"
                          : undefined
                      }
                    >
                      Estoque: {product.stock_quantity}
                    </span>
                  </>
                ) : null}
              </p>
              </div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
