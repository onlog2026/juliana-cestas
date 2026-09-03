import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getAllProductsAdmin } from "@/modules/catalog/service";
import { formatCents } from "@/lib/money";

export default async function AdminProdutosPage() {
  const products = await getAllProductsAdmin();

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl text-foreground">Produtos</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Valor de entrega e produtos sugeridos (upsell) de cada cesta. Retirada na loja é sempre grátis.
      </p>

      <div className="mt-6 divide-y divide-border rounded-card border border-border bg-card">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/admin/produtos/${product.id}`}
            className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-accent"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatCents(product.price_cents)}
                {" · "}
                Entrega: {product.delivery_fee_cents > 0 ? formatCents(product.delivery_fee_cents) : "grátis"}
              </p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
