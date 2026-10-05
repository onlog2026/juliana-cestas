"use client";

import { useEffect, useState, type ReactNode } from "react";
import { RECENT_KEY, parseRecent } from "@/modules/catalog/recent";
import { ShowcaseCarousel } from "@/components/loja/showcase-carousel";

/**
 * "Vistos recentemente" com o cartão do modelo: o servidor manda os cartões já desenhados
 * (por slug) e aqui só se escolhe, pelo histórico do navegador, quais mostrar e em que ordem.
 * Sem histórico = não renderiza nada (sem vão).
 */
export function VistosCliente({ itens, excluir, titulo }: { itens: Array<{ slug: string; id: string; node: ReactNode }>; excluir?: string; titulo: string }) {
  const [vistos, setVistos] = useState<Array<{ id: string; node: ReactNode }>>([]);
  useEffect(() => {
    try {
      const porSlug = new Map(itens.map((i) => [i.slug, i] as const));
      setVistos(
        parseRecent(localStorage.getItem(RECENT_KEY))
          .filter((s) => s !== excluir)
          .map((s) => porSlug.get(s))
          .filter((i): i is NonNullable<typeof i> => Boolean(i))
          .map((i) => ({ id: i.id, node: i.node }))
      );
    } catch {
      setVistos([]);
    }
  }, [itens, excluir]);
  if (vistos.length === 0) return null;
  return <ShowcaseCarousel title={titulo} shuffle={false} items={vistos} />;
}
