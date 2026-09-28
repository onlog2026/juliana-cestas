"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/modules/cart/cart-context";

/** Ícone de carrinho com contador, no header (celular + desktop). O contador só
 *  aparece depois de hidratar (ready) para não dar mismatch de hidratação. */
export function CartButton() {
  const { count, ready } = useCart();
  const showBadge = ready && count > 0;

  return (
    <Link
      href="/carrinho"
      aria-label={showBadge ? `Carrinho com ${count} ${count === 1 ? "cesta" : "cestas"}` : "Carrinho"}
      className="jc-nav-hover relative flex size-10 items-center justify-center rounded-full text-foreground"
    >
      <ShoppingBag className="size-5" />
      {showBadge ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
