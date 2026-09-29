/** Contagem de co-compra (pura, testável): quem foi comprado no mesmo pedido que `productId`. */
export function coBought(
  items: readonly { order_id: string; product_id: string }[],
  productId: string,
  limit = 4
): string[] {
  const orders = new Set(items.filter((i) => i.product_id === productId).map((i) => i.order_id));
  if (orders.size === 0) return [];
  const counts = new Map<string, number>();
  for (const i of items) {
    if (i.product_id === productId || !orders.has(i.order_id)) continue;
    counts.set(i.product_id, (counts.get(i.product_id) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([id]) => id);
}
