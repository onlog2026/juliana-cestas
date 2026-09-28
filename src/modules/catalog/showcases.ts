import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Product } from "@/modules/catalog/product";
import { buildShowcases as build, type Showcases } from "@/modules/catalog/showcase-logic";

export { buildShowcases } from "@/modules/catalog/showcase-logic";
export type { Showcases };

async function rpcCounts(fn: string, args: Record<string, unknown>, field: string): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  try {
    const { data, error } = await createAdminClient().rpc(fn, args);
    if (error || !Array.isArray(data)) return map;
    for (const row of data as Array<Record<string, unknown>>) {
      const id = row.product_id;
      const n = Number(row[field]);
      if (typeof id === "string" && Number.isFinite(n) && n > 0) map.set(id, n);
    }
  } catch {
    // Antes da migração 0049 (ou se o banco falhar): sem vitrine, home normal.
  }
  return map;
}

/** Unidades vendidas por produto (pedidos pagos em diante). Vazio se a função não existe. */
export const getSoldUnits = cache((tenantId: string) =>
  rpcCounts("top_products_sold", { p_tenant: tenantId, p_limit: 60 }, "units")
);

/** Cliques dos últimos 30 dias por produto. Vazio se a tabela/função não existe. */
export const getClickCounts = cache((tenantId: string) =>
  rpcCounts("top_products_clicked", { p_tenant: tenantId, p_days: 30, p_limit: 60 }, "clicks")
);

export async function getShowcases(tenantId: string, products: Product[]): Promise<Showcases> {
  const [sold, clicks] = await Promise.all([getSoldUnits(tenantId), getClickCounts(tenantId)]);
  return build(products, sold, clicks);
}
