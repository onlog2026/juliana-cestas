import Image from "next/image";
import { Star } from "lucide-react";
import { getTenantId } from "@/lib/tenant/context";
import { getProductRatings } from "@/modules/reviews/service";
import { TrackedProductLink } from "./tracked-product-link";
import { ProductRibbon } from "./product-ribbon";
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

export async function ProductCard({ product, sizes }: { product: Product; sizes?: string }) {
  const rating = (await getProductRatings(await getTenantId())).get(product.id);
  return (
    <TrackedProductLink
      href={`/produto/${product.slug}`}
      productId={product.id}
      className="group flex h-full w-full flex-col text-left"
    >
      {/* A fita da flag passa 6px da borda (efeito de dobra): por isso mora FORA do recorte da foto. */}
      <div className="relative">
      {/* Passe-partout: uma borda branca fina entre a linha do card e a foto (destaca a foto sem pesar). */}
      <div className="rounded-card border border-border/70 bg-card p-1.5 shadow-[0_1px_2px_rgba(31,42,36,0.05)] transition-shadow duration-300 group-hover:shadow-[0_10px_24px_-14px_rgba(31,42,36,0.35)]">
      <div className="jc-glow-card relative aspect-[4/5] overflow-hidden rounded-[10px] bg-secondary">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes={sizes ?? DEFAULT_SIZES}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {product.badge ? (
          <span className={`absolute top-3 rounded-full ${product.ribbon ? "right-3" : "left-3"} bg-[var(--jc-gold)] px-2.5 py-1 text-xs font-semibold text-[#1f2a24]`}>
            {product.badge}
          </span>
        ) : null}
      </div>
      </div>
      {product.ribbon ? <ProductRibbon {...product.ribbon} size={88} /> : null}
      </div>

      {/* Nome + "para N pessoas" na MESMA linha (até 2 linhas), estrelas reais (só com
          avaliação aprovada) e preço logo abaixo. O bloco de preço fica no fundo do card
          (mt-auto) só para alinhar a linha quando o vizinho tem nome de 2 linhas. */}
      <div className="mt-3 flex flex-1 flex-col gap-1">
        <p className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground">
          {product.name}
          {product.serves ? (
            <span className="ml-1.5 whitespace-nowrap text-xs font-normal text-muted-foreground">· {product.serves}</span>
          ) : null}
        </p>
        {rating ? (
          <p
            className="flex items-center gap-1 text-xs text-muted-foreground"
            aria-label={`Nota ${rating.average.toFixed(1).replace(".", ",")} de 5, ${rating.total} ${rating.total === 1 ? "avaliação" : "avaliações"}`}
          >
            <span className="flex" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={`size-3.5 ${n <= Math.round(rating.average) ? "fill-[var(--jc-gold)] text-[var(--jc-gold)]" : "text-border"}`}
                />
              ))}
            </span>
            <span className="tabular-nums">({rating.total})</span>
          </p>
        ) : null}
        <p className="mt-auto flex flex-wrap items-baseline gap-x-2 text-lg font-bold tabular-nums text-foreground">
          {product.compareAtPrice ? (
            <s className="text-sm font-normal text-muted-foreground" aria-label={`de ${currency.format(product.compareAtPrice)}`}>
              {currency.format(product.compareAtPrice)}
            </s>
          ) : null}
          <span>{currency.format(product.price)}</span>
        </p>
      </div>
    </TrackedProductLink>
  );
}
