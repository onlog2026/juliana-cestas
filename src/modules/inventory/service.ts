import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  estoqueBaixo,
  margemMedia,
  valorParadoEmEstoque,
  type MargemMedia,
  type ProdutoEstoque,
  type StockMovementKind,
  type ValorParado,
} from "@/modules/inventory/movements";

/**
 * LEITURAS do estoque. Tudo aqui recebe `tenantId` como PRIMEIRO argumento e
 * filtra por ele em toda consulta — o valor vem sempre de `staff.tenantId`
 * (servidor), nunca de parâmetro de URL ou de campo escondido no formulário.
 */

export type LinhaEstoque = ProdutoEstoque & {
  active: boolean;
  imageUrl: string | null;
  /** saldo × custo, ou `null` quando falta um dos dois (isto é "não sei"). */
  valorParadoCents: number | null;
  abaixoDoMinimo: boolean;
};

export type MovimentoEstoque = {
  id: string;
  productId: string;
  productName: string;
  kind: StockMovementKind;
  quantity: number;
  unitCostCents: number | null;
  reason: string | null;
  referenceType: string | null;
  referenceId: string | null;
  balanceAfter: number;
  createdAt: string;
};

export type ResumoEstoque = {
  valorParado: ValorParado;
  margem: MargemMedia;
  produtosAbaixoDoMinimo: number;
  /** Produtos que nem estoque nem mínimo têm cadastrado (não entram no alerta). */
  produtosSemControle: number;
  totalDeProdutos: number;
};

const COLUNAS_PRODUTO = "id, name, price_cents, cost_cents, stock_quantity, low_stock_threshold, active, image_url";

type LinhaProdutoDb = {
  id: string;
  name: string;
  price_cents: number;
  cost_cents: number | null;
  stock_quantity: number | null;
  low_stock_threshold: number | null;
  active: boolean;
  image_url: string | null;
};

function mapear(p: LinhaProdutoDb): LinhaEstoque {
  const base: ProdutoEstoque = {
    id: p.id,
    name: p.name,
    priceCents: p.price_cents,
    costCents: p.cost_cents,
    stockQuantity: p.stock_quantity,
    lowStockThreshold: p.low_stock_threshold,
  };
  return {
    ...base,
    active: p.active,
    imageUrl: p.image_url,
    valorParadoCents:
      p.cost_cents !== null && p.stock_quantity !== null ? p.cost_cents * p.stock_quantity : null,
    abaixoDoMinimo: estoqueBaixo(base),
  };
}

/** Todos os produtos da loja, com estoque, custo e mínimo. */
export async function listarEstoque(tenantId: string): Promise<LinhaEstoque[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("products")
    .select(COLUNAS_PRODUTO)
    .eq("tenant_id", tenantId)
    .order("name");

  return ((data ?? []) as LinhaProdutoDb[]).map(mapear);
}

/**
 * Resumo do topo da tela. Só usa produtos ATIVOS: cesta desativada parada no
 * catálogo não é dinheiro parado na prateleira nem entra na margem do negócio.
 */
export function resumirEstoque(linhas: readonly LinhaEstoque[]): ResumoEstoque {
  const ativos = linhas.filter((l) => l.active);

  return {
    valorParado: valorParadoEmEstoque(ativos),
    margem: margemMedia(ativos),
    produtosAbaixoDoMinimo: ativos.filter((l) => l.abaixoDoMinimo).length,
    produtosSemControle: ativos.filter((l) => l.stockQuantity === null).length,
    totalDeProdutos: ativos.length,
  };
}

/**
 * O extrato. `de`/`ate` são datas "YYYY-MM-DD" no calendário de Brasília,
 * ambas inclusive.
 */
export async function listarMovimentos(
  tenantId: string,
  filtros: { productId?: string | null; de?: string | null; ate?: string | null; limite?: number } = {}
): Promise<MovimentoEstoque[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("stock_movements")
    .select("id, product_id, kind, quantity, unit_cost_cents, reason, reference_type, reference_id, balance_after, created_at, products(name)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(filtros.limite ?? 200, 1), 500));

  if (filtros.productId) query = query.eq("product_id", filtros.productId);
  // O fim do dia em Brasília (UTC-3) é 03:00 UTC do dia seguinte; por isso o
  // recorte usa o fuso explícito em vez de "T23:59:59Z", que cortaria as
  // últimas três horas de cada dia.
  if (filtros.de) query = query.gte("created_at", `${filtros.de}T00:00:00-03:00`);
  if (filtros.ate) query = query.lte("created_at", `${filtros.ate}T23:59:59-03:00`);

  const { data } = await query;

  type LinhaDb = {
    id: string;
    product_id: string;
    kind: string;
    quantity: number | string;
    unit_cost_cents: number | null;
    reason: string | null;
    reference_type: string | null;
    reference_id: string | null;
    balance_after: number | string;
    created_at: string;
    products: { name: string } | { name: string }[] | null;
  };

  return ((data ?? []) as unknown as LinhaDb[]).map((row) => {
    const produto = Array.isArray(row.products) ? row.products[0] : row.products;
    return {
      id: row.id,
      productId: row.product_id,
      productName: produto?.name ?? "Produto removido",
      kind: row.kind as StockMovementKind,
      quantity: Number(row.quantity),
      unitCostCents: row.unit_cost_cents,
      reason: row.reason,
      referenceType: row.reference_type,
      referenceId: row.reference_id,
      balanceAfter: Number(row.balance_after),
      createdAt: row.created_at,
    };
  });
}
