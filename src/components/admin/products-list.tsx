"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowUp, ArrowDown } from "lucide-react";
import { reorderProducts } from "@/modules/catalog/actions";
import { ProductThumbnail } from "@/components/admin/product-thumbnail";

export type ProductRow = {
  id: string;
  name: string;
  active: boolean;
  imageUrl: string | null;
  categoryLabel: string | null;
  priceLabel: string;
  deliveryLabel: string;
  stock: number | null;
  stockLow: boolean;
};

/**
 * Lista de produtos do admin com reordenação por setas ↑↓ (a ordem manda na
 * vitrine inteira). Estado local otimista + reorderProducts; molde igual ao
 * DeliveryZonesManager. Clicar na linha (o Link) leva pra edição; as setas ficam
 * FORA do Link (irmãs), então nunca navegam ao reordenar.
 */
export function ProductsList({ products: initial }: { products: ProductRow[] }) {
  const [products, setProducts] = useState<ProductRow[]>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Re-sincroniza quando o servidor devolve a lista nova (após revalidate).
  useEffect(() => {
    setProducts(initial);
  }, [initial]);

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= products.length) return;
    const next = [...products];
    [next[index], next[target]] = [next[target], next[index]];
    setProducts(next);
    setError(null);
    startTransition(async () => {
      const result = await reorderProducts(next.map((p) => p.id));
      if (!result.ok) {
        setError(result.error);
        setProducts(initial); // desfaz o otimista se o servidor recusou
      }
    });
  }

  if (products.length === 0) {
    return (
      <p className="mt-6 rounded-card border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Nenhuma cesta cadastrada ainda. Clique em “Nova cesta” para começar.
      </p>
    );
  }

  return (
    <>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      <div className="mt-6 divide-y divide-border rounded-card border border-border bg-card">
        {products.map((product, index) => (
          <div key={product.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
            <Link
              href={`/admin/produtos/${product.id}`}
              className="jc-nav-hover -mx-2 flex min-w-0 flex-1 items-center gap-3 rounded-[10px] px-2 py-1"
            >
              <ProductThumbnail imageUrl={product.imageUrl} alt={product.name} />
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
                  {product.categoryLabel ? (
                    <>
                      <span className="font-medium text-foreground/80">{product.categoryLabel}</span>
                      {" · "}
                    </>
                  ) : null}
                  {product.priceLabel}
                  {" · "}
                  Entrega: {product.deliveryLabel}
                  {product.stock !== null ? (
                    <>
                      {" · "}
                      <span className={product.stockLow ? "font-medium text-destructive" : undefined}>
                        Estoque: {product.stock}
                      </span>
                    </>
                  ) : null}
                </p>
              </div>
            </Link>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0 || pending}
                aria-label="Mover para cima"
                className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent disabled:opacity-30"
              >
                <ArrowUp className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === products.length - 1 || pending}
                aria-label="Mover para baixo"
                className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent disabled:opacity-30"
              >
                <ArrowDown className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
