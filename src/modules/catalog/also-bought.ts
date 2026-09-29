import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { coBought } from "@/modules/catalog/co-bought";

const PAID = ["pago", "em_preparacao", "pronto", "saiu_para_entrega", "entregue"];

/** Todas as linhas de produto dos pedidos pagos (uma leitura por requisição). */
const readPaidItems = cache(async (tenantId: string): Promise<{ order_id: string; product_id: string }[]> => {
  try {
    const { data, error } = await createAdminClient()
      .from("order_items")
      .select("order_id, product_id, orders!inner(status)")
      .eq("tenant_id", tenantId)
      .eq("kind", "product")
      .in("orders.status", PAID)
      .not("product_id", "is", null)
      .limit(5000);
    if (error || !data) return [];
    return (data as unknown as { order_id: string; product_id: string }[]).map((r) => ({
      order_id: r.order_id,
      product_id: r.product_id,
    }));
  } catch {
    return [];
  }
});

/** Ids de produtos que aparecem junto com `productId` em pedidos pagos, do mais ao menos frequente. */
export async function getAlsoBought(tenantId: string, productId: string, limit = 4): Promise<string[]> {
  return coBought(await readPaidItems(tenantId), productId, limit);
}
