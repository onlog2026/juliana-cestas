import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { Product } from "@/lib/mock-content";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/produto/${product.slug}`}
      className="group block w-full text-left"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-secondary">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {product.badge ? (
          <span className="absolute left-3 top-3 rounded-full bg-[var(--jc-gold)] px-2.5 py-1 text-xs font-semibold text-[#1f2a24]">
            {product.badge}
          </span>
        ) : null}
      </div>

      <div className="mt-3 space-y-1">
        <p className="text-[15px] font-semibold text-foreground">
          {product.name}
        </p>

        {product.rating ? (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="size-3.5 fill-[var(--jc-gold)] text-[var(--jc-gold)]" />
            <span>{product.rating.toFixed(1)}</span>
            <span>({product.reviewCount})</span>
          </div>
        ) : null}

        <div className="flex items-baseline gap-2 pt-0.5">
          <span className="text-lg font-bold tabular-nums text-foreground">
            {currency.format(product.price)}
          </span>
          {product.compareAtPrice ? (
            <span className="text-sm tabular-nums text-muted-foreground line-through">
              {currency.format(product.compareAtPrice)}
            </span>
          ) : null}
        </div>
        {product.installments ? (
          <p className="text-xs text-muted-foreground">
            {product.installments}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
