import type { Product } from "@/modules/catalog/product";
import { ProductCard } from "./product-card";

const SIZES = "(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw";

/** Faixa de até 5 produtos (vitrines "Mais comprados" / "Mais clicados"). */
export function ShowcaseRow({ title, products }: { title: string; products: Product[] }) {
  if (products.length === 0) return null;
  return (
    <section className="mx-auto max-w-[1800px] px-4 pt-10 sm:px-6 lg:px-8 2xl:px-12">
      <h2 className="font-display text-2xl text-foreground sm:text-3xl">{title}</h2>
      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} sizes={SIZES} />
        ))}
      </div>
    </section>
  );
}
