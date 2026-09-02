import Image from "next/image";
import Link from "next/link";
import { categories } from "@/lib/mock-content";

export function CategoryTiles() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h2 className="font-display text-2xl text-foreground">
        Escolha pela ocasião
      </h2>
      <div className="mt-5 flex snap-x gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-6">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/categoria/${category.slug}`}
            className="group w-32 shrink-0 snap-start sm:w-auto"
          >
            <div className="relative aspect-square overflow-hidden rounded-card">
              <Image
                src={category.image}
                alt={category.name}
                fill
                sizes="160px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <p className="mt-2 text-center text-sm font-medium text-foreground">
              {category.name}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
