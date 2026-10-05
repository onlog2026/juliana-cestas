"use client";

import type { ReactNode } from "react";

/**
 * Conta o clique no cartão para a vitrine "Mais clicados", seja qual for o cartão do modelo
 * (que já é um link: por isso aqui não há outro `<a>`). Nunca atrasa nem impede a navegação:
 * sem `preventDefault`, o aviso vai por `sendBeacon` e qualquer erro é engolido.
 * Um clique por produto por visita (igual ao `TrackedProductLink` da loja original).
 */
export function CartaoRastreado({ productId, children }: { productId: string; children: ReactNode }) {
  function registrar(e: React.MouseEvent<HTMLDivElement>) {
    const alvo = e.target as HTMLElement | null;
    if (!alvo?.closest?.("a")) return;
    try {
      const chave = `jc-click:${productId}`;
      if (sessionStorage.getItem(chave)) return;
      sessionStorage.setItem(chave, "1");
      const corpo = new Blob([JSON.stringify({ productId })], { type: "application/json" });
      navigator.sendBeacon("/api/track/product-click", corpo);
    } catch {
      // Rastreio é opcional: nunca pode atrapalhar o clique.
    }
  }
  return (
    <div style={{ display: "contents" }} onClickCapture={registrar}>
      {children}
    </div>
  );
}
