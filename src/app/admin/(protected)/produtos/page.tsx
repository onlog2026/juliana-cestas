import Link from "next/link";
import { FolderTree } from "lucide-react";
import { getAllProductsAdmin } from "@/modules/catalog/service";
import { getAllCategoriesAdmin } from "@/modules/catalog/categories";
import { requireStaff } from "@/lib/auth/require-staff";
import { formatCents } from "@/lib/money";
import { NewProductButton } from "@/components/admin/new-product-button";
import { ProductsList, type ProductRow } from "@/components/admin/products-list";

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

  // Monta a lista já pronta pro componente cliente (que faz a reordenação por
  // setas). Rótulos formatados aqui no servidor: o cliente só apresenta.
  const rows: ProductRow[] = products.map((product) => ({
    id: product.id,
    name: product.name,
    active: product.active,
    imageUrl: product.image_url,
    categoryLabel: categoryLabel(product.category_id),
    priceLabel: formatCents(product.price_cents),
    deliveryLabel: product.delivery_fee_cents > 0 ? formatCents(product.delivery_fee_cents) : "grátis",
    stock: product.stock_quantity,
    stockLow:
      product.stock_quantity !== null &&
      product.low_stock_threshold !== null &&
      product.stock_quantity <= product.low_stock_threshold,
  }));

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

      <p className="mt-4 text-xs text-muted-foreground">
        Use as setas ↑↓ para ordenar. A ordem aqui é a mesma que aparece na loja
        (home “Nossas cestas”, categorias e cestas relacionadas).
      </p>
      <ProductsList products={rows} />
    </div>
  );
}
