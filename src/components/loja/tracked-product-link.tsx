"use client";

import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Link do cartão de produto que avisa o servidor do clique (alimenta a vitrine
 * "Mais clicados"). Nunca atrasa nem impede a navegação: sem `preventDefault`,
 * o aviso vai por `sendBeacon` e qualquer erro é engolido. Um clique por
 * produto por visita (sessionStorage) -- reabrir o mesmo produto 10 vezes não
 * infla o número.
 */
export function TrackedProductLink({
  href,
  productId,
  className,
  children,
}: {
  href: string;
  productId: string;
  className?: string;
  children: ReactNode;
}) {
  function track() {
    try {
      const key = `jc-click:${productId}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
      const body = new Blob([JSON.stringify({ productId })], { type: "application/json" });
      navigator.sendBeacon("/api/track/product-click", body);
    } catch {
      // Rastreio é opcional: nunca pode atrapalhar o clique.
    }
  }

  return (
    <Link href={href} className={className} onClick={track}>
      {children}
    </Link>
  );
}
