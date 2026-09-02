import Image from "next/image";
import Link from "next/link";
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
      <div className="jc-glow-card relative aspect-[4/5] overflow-hidden rounded-card bg-secondary">
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
        <p className="text-xs text-muted-foreground">{product.serves}</p>
        <p className="pt-0.5 text-lg font-bold tabular-nums text-foreground">
          {currency.format(product.price)}
        </p>
      </div>
    </Link>
  );
}
