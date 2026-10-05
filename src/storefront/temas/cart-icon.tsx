"use client";

import type { CSSProperties } from "react";
import { ShoppingBag, ShoppingBasket, ShoppingCart } from "lucide-react";
import { useCartOptional } from "@/modules/cart/cart-context";
import { useDemoCartOptional } from "./demo-cart";

const ICONES = { sacola: ShoppingBag, carrinho: ShoppingCart, cesta: ShoppingBasket } as const;

/**
 * Ícone do carrinho com contador; leva à página do carrinho da loja (demo ou real).
 * Recebe o NOME do ícone (texto): componente não pode atravessar de servidor para cliente.
 */
export function CartIcon({
  base,
  icone,
  className,
  style,
}: {
  base: string;
  icone: keyof typeof ICONES;
  className?: string;
  style?: CSSProperties;
}) {
  // Loja de verdade: carrinho real (itens). Demo/prévia: carrinho local da demonstração.
  const real = useCartOptional();
  const demo = useDemoCartOptional();
  const quantidade = real ? real.count : (demo?.quantidade ?? 0);
  const Icon = ICONES[icone];
  return (
    <a
      href={`${base}/carrinho`}
      aria-label={`Carrinho, ${quantidade} ${quantidade === 1 ? "item" : "itens"}`}
      className="relative inline-flex min-h-11 min-w-11 items-center justify-center"
    >
      <Icon className={className} style={style} aria-hidden={true} />
      {quantidade > 0 ? (
        <span
          className="absolute top-0 right-0 flex size-5 items-center justify-center rounded-full text-[11px] font-bold"
          style={{ background: "var(--t-accent)", color: "var(--t-on-accent)" }}
        >
          {quantidade}
        </span>
      ) : null}
    </a>
  );
}
