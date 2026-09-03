"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { formatCents } from "@/lib/money";

type SearchProduct = {
  slug: string;
  name: string;
  serves: string;
  price: number;
  image: string;
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function HeaderSearch({ products, id }: { products: SearchProduct[]; id: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (q.length < 2) return [];
    return products
      .filter((p) => normalize(p.name).includes(q) || normalize(p.serves).includes(q))
      .slice(0, 6);
  }, [query, products]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function goToFirstMatch() {
    if (results.length > 0) {
      router.push(`/produto/${results[0].slug}`);
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <label className="relative block">
        <span className="sr-only">Buscar cestas</span>
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          id={id}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Enter" && goToFirstMatch()}
          placeholder="Buscar cestas, ocasiões..."
          autoComplete="off"
          className="h-11 w-full rounded-full border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      {open && query.trim().length >= 2 ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-96 overflow-y-auto rounded-card border border-border bg-card p-2 shadow-lg">
          {results.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              Nenhuma cesta encontrada para &ldquo;{query}&rdquo;.
            </p>
          ) : (
            results.map((product) => (
              <Link
                key={product.slug}
                href={`/produto/${product.slug}`}
                onClick={() => setOpen(false)}
                className="jc-nav-hover flex items-center gap-3 rounded-[10px] p-2"
              >
                {product.image ? (
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-[8px] bg-secondary">
                    <Image src={product.image} alt="" fill sizes="48px" className="object-cover" />
                  </div>
                ) : null}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{product.name}</span>
                  <span className="block text-xs text-muted-foreground">{formatCents(product.price * 100)}</span>
                </span>
              </Link>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
