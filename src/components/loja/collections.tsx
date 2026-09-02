import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { collectionPresentes, featuredProducts } from "@/lib/mock-content";
import { ProductCard } from "./product-card";

export function Collections() {
  const corporate = featuredProducts.find(
    (product) => product.categorySlug === "corporativo"
  );

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-card border border-border bg-card p-6 sm:p-8">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl text-foreground">
              Presentes até R$ 200
            </h2>
            <Link
              href="/categoria/todos?preco=200"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Ver todas
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
            {collectionPresentes.slice(0, 3).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        {corporate ? (
          <Link
            href={`/produto/${corporate.slug}`}
            className="group relative flex min-h-72 flex-col justify-end overflow-hidden rounded-card"
          >
            <Image
              src={corporate.image}
              alt={corporate.name}
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="relative bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6 pt-16">
              <p className="font-display text-2xl text-white">
                Presentes corporativos
              </p>
              <p className="mt-1 text-sm text-white/85">
                Para times e clientes, com nota fiscal e volume.
              </p>
            </div>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
