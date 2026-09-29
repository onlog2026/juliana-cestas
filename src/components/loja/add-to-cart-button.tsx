"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Check } from "lucide-react";
import { useCart } from "@/modules/cart/cart-context";

type Props = {
  productSlug: string;
  productId: string;
  name: string;
  imageUrl: string | null;
  priceCents: number;
};

/** Adiciona uma cesta em branco ao carrinho (o destinatário/entrega/cartão são
 *  preenchidos depois, na página /carrinho). Convive com "Comprar" (compra
 *  direta) -- não substitui o checkout de 1 produto. */
export function AddToCartButton({ productSlug, productId, name, imageUrl, priceCents }: Props) {
  const { addGift } = useCart();
  const router = useRouter();
  const [justAdded, setJustAdded] = useState(false);

  function handleClick() {
    addGift({
      productSlug,
      productId,
      display: { name, imageUrl, priceCents },
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={handleClick}
        className="jc-btn-outline inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-base font-semibold text-primary"
      >
        {justAdded ? <Check className="size-5" /> : <ShoppingBag className="size-5" />}
        {justAdded ? "Adicionada!" : "Adicionar ao carrinho"}
      </button>
      {justAdded ? (
        <button
          type="button"
          onClick={() => router.push("/carrinho")}
          className="text-sm font-medium text-primary hover:underline"
        >
          Ver carrinho
        </button>
      ) : null}
    </div>
  );
}
