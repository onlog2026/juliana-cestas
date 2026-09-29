"use client";

import { useEffect } from "react";
import { events, type TrackItem } from "@/modules/analytics/events";

/** Dispara `view_item` uma vez ao abrir a página da cesta. Não desenha nada. */
export function TrackViewItem({ item }: { item: TrackItem }) {
  useEffect(() => {
    events.viewItem(item);
    // Só na abertura da página (item é fixo por página).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);
  return null;
}

/** Dispara `begin_checkout` uma vez ao abrir o checkout/carrinho. Não desenha nada. */
export function TrackBeginCheckout({ items }: { items: TrackItem[] }) {
  useEffect(() => {
    if (items.length > 0) events.beginCheckout(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);
  return null;
}

/**
 * Um único ouvinte de cliques para toda a loja: qualquer elemento com
 * `data-track="lead"` (botões de WhatsApp) e `data-track-source="produto"` conta um
 * `generate_lead`. Assim os links continuam simples (servidor) e nada de JS por botão.
 */
export function ClickTracker() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const el = (e.target as HTMLElement | null)?.closest?.("[data-track]") as HTMLElement | null;
      if (!el) return;
      if (el.dataset.track === "lead") events.lead(el.dataset.trackSource ?? "site");
    }
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
