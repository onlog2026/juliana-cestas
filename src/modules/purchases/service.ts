import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * LEITURAS de compras e fornecedores. Toda consulta filtra por `tenant_id`,
 * que vem sempre de `staff.tenantId` — nunca do navegador.
 */

export type Fornecedor = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
};

export type ItemDeCompra = {
  id: string;
  productId: string | null;
  productName: string | null;
  description: string;
  quantity: number;
  unitCostCents: number;
  totalCents: number;
};

export type Compra = {
  id: string;
  supplierId: string | null;
  supplierName: string | null;
  purchasedAt: string; // "YYYY-MM-DD"
  invoiceNumber: string | null;
  totalCents: number;
  notes: string | null;
  createdAt: string;
};

export type CompraDetalhada = Compra & { itens: ItemDeCompra[] };

export async function listarFornecedores(tenantId: string): Promise<Fornecedor[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("suppliers")
    .select("id, name, phone, email, notes")
    .eq("tenant_id", tenantId)
    .order("name");
  return (data ?? []) as Fornecedor[];
}

type CompraDb = {
  id: string;
  supplier_id: string | null;
  purchased_at: string;
  invoice_number: string | null;
  total_cents: number;
  notes: string | null;
  created_at: string;
  suppliers: { name: string } | { name: string }[] | null;
};

function mapearCompra(row: CompraDb): Compra {
  const fornecedor = Array.isArray(row.suppliers) ? row.suppliers[0] : row.suppliers;
  return {
    id: row.id,
    supplierId: row.supplier_id,
    supplierName: fornecedor?.name ?? null,
    purchasedAt: row.purchased_at,
    invoiceNumber: row.invoice_number,
    totalCents: Number(row.total_cents),
    notes: row.notes,
    createdAt: row.created_at,
  };
}

const COLUNAS_COMPRA =
  "id, supplier_id, purchased_at, invoice_number, total_cents, notes, created_at, suppliers(name)";

/** `de`/`ate` em "YYYY-MM-DD", ambos inclusive (data da compra, não do cadastro). */
export async function listarCompras(
  tenantId: string,
  filtros: { de?: string | null; ate?: string | null; limite?: number } = {}
): Promise<Compra[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("purchases")
    .select(COLUNAS_COMPRA)
    .eq("tenant_id", tenantId)
    .order("purchased_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(filtros.limite ?? 100, 1), 500));

  if (filtros.de) query = query.gte("purchased_at", filtros.de);
  if (filtros.ate) query = query.lte("purchased_at", filtros.ate);

  const { data } = await query;
  return ((data ?? []) as unknown as CompraDb[]).map(mapearCompra);
}

export async function obterCompra(tenantId: string, id: string): Promise<CompraDetalhada | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("purchases")
    .select(COLUNAS_COMPRA)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;

  const { data: itens } = await supabase
    .from("purchase_items")
    .select("id, product_id, description, quantity, unit_cost_cents, total_cents, products(name)")
    .eq("tenant_id", tenantId)
    .eq("purchase_id", id);

  type ItemDb = {
    id: string;
    product_id: string | null;
    description: string;
    quantity: number | string;
    unit_cost_cents: number;
    total_cents: number;
    products: { name: string } | { name: string }[] | null;
  };

  const listaItens: ItemDeCompra[] = ((itens ?? []) as unknown as ItemDb[]).map((row) => {
    const produto = Array.isArray(row.products) ? row.products[0] : row.products;
    return {
      id: row.id,
      productId: row.product_id,
      productName: produto?.name ?? null,
      description: row.description,
      quantity: Number(row.quantity),
      unitCostCents: Number(row.unit_cost_cents),
      totalCents: Number(row.total_cents),
    };
  });

  return { ...mapearCompra(data as unknown as CompraDb), itens: listaItens };
}

export type GastoPorDia = { day: string; totalCents: number };

/**
 * Quanto a loja gastou em compras, dia a dia, no período. Alimenta o gráfico do
 * topo da tela (o MESMO componente SVG das vendas, sem biblioteca nova).
 */
export async function gastoEmCompras(
  tenantId: string,
  de: string,
  ate: string
): Promise<{ totalCents: number; porDia: GastoPorDia[] }> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("purchases")
    .select("purchased_at, total_cents")
    .eq("tenant_id", tenantId)
    .gte("purchased_at", de)
    .lte("purchased_at", ate);

  const linhas = (data ?? []) as { purchased_at: string; total_cents: number }[];
  const acumulado = new Map<string, number>();
  let totalCents = 0;

  for (const linha of linhas) {
    const valor = Number(linha.total_cents);
    totalCents += valor;
    acumulado.set(linha.purchased_at, (acumulado.get(linha.purchased_at) ?? 0) + valor);
  }

  const porDia = [...acumulado.entries()]
    .map(([day, cents]) => ({ day, totalCents: cents }))
    .sort((a, b) => (a.day < b.day ? -1 : 1));

  return { totalCents, porDia };
}
