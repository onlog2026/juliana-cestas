import type { Product } from "@/modules/catalog/product";
import { ProductCard } from "./product-card";
import { ShowcaseCarousel } from "./showcase-carousel";

const SIZES = "(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw";

/** Carrossel (aleatório, pausa no mouse) das vitrines "Mais comprados" / "Mais clicados". */
export function ShowcaseRow({ title, products }: { title: string; products: Product[] }) {
  if (products.length === 0) return null;
  return (
    <ShowcaseCarousel
      title={title}
      items={products.map((p) => ({ id: p.id, node: <ProductCard product={p} sizes={SIZES} /> }))}
    />
  );
}
