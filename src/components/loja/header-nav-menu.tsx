"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatCents } from "@/lib/money";

type NavProduct = {
  slug: string;
  name: string;
  serves: string;
  price: number;
  image: string;
};

export function HeaderNavMenu({ products }: { products: NavProduct[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <nav className="mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-4 py-2.5 text-sm font-medium text-foreground sm:px-6 lg:px-8">
      {products.map((product) => (
        <div
          key={product.slug}
          className="relative"
          onMouseEnter={() => setHovered(product.slug)}
          onMouseLeave={() => setHovered((current) => (current === product.slug ? null : current))}
        >
          <Link
            href={`/produto/${product.slug}`}
            className="jc-nav-hover block whitespace-nowrap rounded-full px-3 py-1.5"
          >
            {product.name}
          </Link>

          {hovered === product.slug ? (
            <div className="absolute left-1/2 top-[calc(100%+6px)] z-50 w-56 -translate-x-1/2 rounded-card border border-border bg-card p-3 shadow-lg">
              <Link
                href={`/produto/${product.slug}`}
                className="flex items-center gap-3"
                onClick={() => setHovered(null)}
              >
                {product.image ? (
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-[10px] bg-secondary">
                    <Image src={product.image} alt="" fill sizes="64px" className="object-cover" />
                  </div>
                ) : null}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">{product.name}</span>
                  <span className="block text-xs text-muted-foreground">{product.serves}</span>
                  <span className="block text-sm font-semibold text-primary">
                    {formatCents(product.price * 100)}
                  </span>
                </span>
              </Link>
            </div>
          ) : null}
        </div>
      ))}
    </nav>
  );
}
