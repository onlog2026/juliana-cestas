import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getTenantId } from "@/lib/tenant/context";
import { getAllProducts } from "@/modules/catalog/service";
import { getContent } from "@/modules/content/service";
import { ProductCard } from "./product-card";
import { Reveal } from "./reveal";

export async function Collections() {
  const tenantId = await getTenantId();
  const [products, content] = await Promise.all([
    getAllProducts(tenantId),
    getContent(tenantId, "collections"),
  ]);

  const maxPriceCents = content.maxPriceCents;
  const collection =
    maxPriceCents === undefined
      ? []
      : products.filter((product) => Math.round(product.price * 100) <= maxPriceCents);

  const featured = content.highlightProductSlug
    ? products.find((product) => product.slug === content.highlightProductSlug) ?? null
    : null;

  return (
    <Reveal className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {maxPriceCents === undefined ? null : (
          <div className="rounded-card border border-border bg-card p-6 sm:p-8">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-2xl text-foreground">
                {content.title}
              </h2>
              <Link
                href="#mais-pedidas"
                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Ver todas
                <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
              {collection.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {featured ? (
          <Link
            href={`/produto/${featured.slug}`}
            className="jc-glow-card group relative flex min-h-72 flex-col justify-end overflow-hidden rounded-card"
          >
            <Image
              src={featured.image}
              alt={featured.name}
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="relative bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6 pt-16">
              <p className="font-display text-2xl text-white">
                {featured.name}
              </p>
              <p className="mt-1 text-sm text-white/85">
                {featured.serves} · embalagem luxo, ideal para presentear em grande estilo.
              </p>
            </div>
          </Link>
        ) : null}
      </div>
    </Reveal>
  );
}
