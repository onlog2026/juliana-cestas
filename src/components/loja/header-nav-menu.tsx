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

type HoverState = { product: NavProduct; left: number; top: number };

const POPOVER_WIDTH = 224; // w-56

export function HeaderNavMenu({ products }: { products: NavProduct[] }) {
  const [hover, setHover] = useState<HoverState | null>(null);

  function showPopover(product: NavProduct, trigger: HTMLElement) {
    const rect = trigger.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const left = Math.min(
      Math.max(center - POPOVER_WIDTH / 2, 8),
      window.innerWidth - POPOVER_WIDTH - 8
    );
    setHover({ product, left, top: rect.bottom + 6 });
  }

  function hidePopover(slug: string) {
    setHover((current) => (current?.product.slug === slug ? null : current));
  }

  return (
    <nav className="mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-4 py-2.5 text-sm font-medium text-foreground sm:px-6 lg:px-8">
      {products.map((product) => (
        <div
          key={product.slug}
          onMouseEnter={(e) => showPopover(product, e.currentTarget)}
          onMouseLeave={() => hidePopover(product.slug)}
        >
          <Link
            href={`/produto/${product.slug}`}
            className="jc-nav-hover block whitespace-nowrap rounded-full px-3 py-1.5"
          >
            {product.name}
          </Link>
        </div>
      ))}

      {/* position:fixed de propósito -- posicionado "absolute" dentro do nav
          (que precisa de overflow-x-auto pra rolar em tela estreita) ficava
          cortado verticalmente pelo próprio nav (overflow-x força overflow-y
          "auto" também, regra do CSS), e no lugar do card aparecia a barra
          de rolagem nativa do navegador. "fixed" escapa desse corte. */}
      {hover ? (
        <div
          style={{ position: "fixed", left: hover.left, top: hover.top, width: POPOVER_WIDTH }}
          className="z-50 rounded-card border border-border bg-card p-3 shadow-lg"
          onMouseEnter={() => setHover(hover)}
          onMouseLeave={() => hidePopover(hover.product.slug)}
        >
          <Link
            href={`/produto/${hover.product.slug}`}
            className="flex items-center gap-3"
            onClick={() => setHover(null)}
          >
            {hover.product.image ? (
              <div className="relative size-16 shrink-0 overflow-hidden rounded-[10px] bg-secondary">
                <Image src={hover.product.image} alt="" fill sizes="64px" className="object-cover" />
              </div>
            ) : null}
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-foreground">{hover.product.name}</span>
              <span className="block text-xs text-muted-foreground">{hover.product.serves}</span>
              <span className="block text-sm font-semibold text-primary">
                {formatCents(hover.product.price * 100)}
              </span>
            </span>
          </Link>
        </div>
      ) : null}
    </nav>
  );
}
