import { featuredProducts } from "@/lib/mock-content";
import { ProductCard } from "./product-card";

export function FeaturedProducts() {
  return (
    <section
      id="mais-pedidas"
      className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
    >
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-2xl text-foreground">
          Mais pedidas
        </h2>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
        {featuredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
