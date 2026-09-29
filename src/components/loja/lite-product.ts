import type { Product } from "@/modules/catalog/product";

/** O mínimo para desenhar um cartão simples no navegador (vistos recentemente etc.). */
export type LiteProduct = { id: string; slug: string; name: string; serves: string; price: number; image: string };

export function toLiteProducts(products: Product[]): LiteProduct[] {
  return products.map((p) => ({ id: p.id, slug: p.slug, name: p.name, serves: p.serves, price: p.price, image: p.image }));
}
