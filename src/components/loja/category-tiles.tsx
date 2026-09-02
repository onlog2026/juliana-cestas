import Image from "next/image";
import Link from "next/link";
import { featuredProducts } from "@/lib/mock-content";

export function CategoryTiles() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h2 className="font-display text-2xl text-foreground">
        As 5 cestas da Juliana Present
      </h2>
      <div className="mt-5 flex snap-x gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-5">
        {featuredProducts.map((product) => (
          <Link
            key={product.id}
            href={`/produto/${product.slug}`}
            className="group w-32 shrink-0 snap-start sm:w-auto"
          >
            <div className="relative aspect-square overflow-hidden rounded-card">
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="160px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <p className="mt-2 text-center text-sm font-medium text-foreground">
              {product.name}
            </p>
            <p className="text-center text-xs text-muted-foreground">
              {product.serves}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
