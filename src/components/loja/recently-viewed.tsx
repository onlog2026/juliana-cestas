"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { RECENT_KEY, parseRecent, pushRecent } from "@/modules/catalog/recent";
import { MAT_CLASS, MAT_HOVER_CLASS, MAT_INNER_RADIUS } from "./card-mat";
import { ShowcaseCarousel } from "./showcase-carousel";
import type { LiteProduct } from "./lite-product";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Grava a cesta vista (página do produto). Sem render. */
export function TrackRecentlyViewed({ slug }: { slug: string }) {
  useEffect(() => {
    try {
      const next = pushRecent(parseRecent(localStorage.getItem(RECENT_KEY)), slug);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* navegação privada / storage bloqueado: sem histórico */
    }
  }, [slug]);
  return null;
}

function MiniCard({ p }: { p: LiteProduct }) {
  return (
    <Link href={`/produto/${p.slug}`} className="group flex w-full flex-col text-left">
      <div className={`${MAT_CLASS} ${MAT_HOVER_CLASS}`}>
        <div className={`relative aspect-[4/5] overflow-hidden ${MAT_INNER_RADIUS} bg-secondary`}>
          <Image
            src={p.image}
            alt={p.name}
            fill
            sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-[15px] font-semibold leading-snug text-foreground">
        {p.name}
        {p.serves ? <span className="ml-1.5 whitespace-nowrap text-xs font-normal text-muted-foreground">· {p.serves}</span> : null}
      </p>
      <p className="mt-1 text-lg font-bold tabular-nums text-foreground">{currency.format(p.price)}</p>
    </Link>
  );
}

/**
 * "Vistos recentemente": lê o histórico do navegador e mostra as cestas (que
 * ainda existem) na ordem em que foram vistas. Sem histórico = não renderiza
 * nada (sem vão). O servidor só manda a lista leve de produtos.
 */
export function RecentlyViewed({ products, excludeSlug }: { products: LiteProduct[]; excludeSlug?: string }) {
  const [items, setItems] = useState<LiteProduct[]>([]);

  useEffect(() => {
    try {
      const bySlug = new Map(products.map((p) => [p.slug, p] as const));
      const seen = parseRecent(localStorage.getItem(RECENT_KEY))
        .filter((s) => s !== excludeSlug)
        .map((s) => bySlug.get(s))
        .filter((p): p is LiteProduct => Boolean(p));
      setItems(seen);
    } catch {
      setItems([]);
    }
  }, [products, excludeSlug]);

  if (items.length === 0) return null;
  return (
    <ShowcaseCarousel
      title="Vistos recentemente"
      shuffle={false}
      items={items.map((p) => ({ id: p.id, node: <MiniCard p={p} /> }))}
    />
  );
}
