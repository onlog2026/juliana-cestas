import Image from "next/image";
import { TrackedProductLink } from "./tracked-product-link";
import type { Product } from "@/modules/catalog/product";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// Padrão das grades de 3–4 colunas (categoria, produtos relacionados). A grade
// da home tem 5 colunas e passa o próprio `sizes` -- pedir 22vw num cartão que
// ocupa ~19vw só baixa bytes à toa; e pedir 20vw numa grade de 3 colunas
// borraria a foto. Por isso o `sizes` é decidido por quem conhece a grade.
const DEFAULT_SIZES = "(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw";

export function ProductCard({ product, sizes }: { product: Product; sizes?: string }) {
  return (
    <TrackedProductLink
      href={`/produto/${product.slug}`}
      productId={product.id}
      className="group flex h-full w-full flex-col text-left"
    >
      <div className="jc-glow-card relative aspect-[4/5] overflow-hidden rounded-card bg-secondary">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes={sizes ?? DEFAULT_SIZES}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {product.badge ? (
          <span className="absolute left-3 top-3 rounded-full bg-[var(--jc-gold)] px-2.5 py-1 text-xs font-semibold text-[#1f2a24]">
            {product.badge}
          </span>
        ) : null}
      </div>

      {/* Nome em no máximo 2 linhas e a linha de "serve" sempre reservada: o preço
          fica SEMPRE no fundo do cartão (mt-auto), na mesma altura em todos os
          cartões da linha, mesmo com nomes de tamanhos diferentes. */}
      <div className="mt-3 flex flex-1 flex-col gap-1">
        <p className="line-clamp-2 min-h-[2.75rem] text-[15px] font-semibold leading-snug text-foreground">
          {product.name}
        </p>
        <p className="min-h-4 text-xs text-muted-foreground">{product.serves}</p>
        <p className="mt-auto pt-0.5 text-lg font-bold tabular-nums text-foreground">
          {currency.format(product.price)}
        </p>
      </div>
    </TrackedProductLink>
  );
}
