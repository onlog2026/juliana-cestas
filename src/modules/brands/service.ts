import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * MARCAS — leitura.
 *
 * Segue o mesmo desenho de `src/modules/catalog/categories.ts`: o serviço lê
 * com service role (que ignora RLS) e SEMPRE filtra por `tenant_id`. O filtro
 * não é enfeite: é o que separa a vitrine de uma loja da de outra.
 */

export type Brand = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  sortOrder: number;
  active: boolean;
};

type BrandRow = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  sort_order: number | null;
  active: boolean | null;
};

const COLUNAS = "id, name, slug, logo_url, description, sort_order, active";

function mapBrand(row: BrandRow): Brand {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url,
    description: row.description,
    sortOrder: row.sort_order ?? 0,
    active: row.active !== false,
  };
}

/** Todas as marcas da loja (ativas e inativas), na ordem escolhida no painel. */
export async function getAllBrandsAdmin(tenantId: string): Promise<Brand[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("brands")
    .select(COLUNAS)
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("[marcas] falha ao listar as marcas:", error);
    return [];
  }
  return (data ?? []).map((r) => mapBrand(r as BrandRow));
}

/** Só as marcas ativas — é o que a vitrine mostra. */
export async function getActiveBrands(tenantId: string): Promise<Brand[]> {
  const todas = await getAllBrandsAdmin(tenantId);
  return todas.filter((m) => m.active);
}

/**
 * Quantos produtos estão vinculados a cada marca desta loja.
 *
 * É o número que a tela mostra antes de excluir: "esta marca está em 4 cestas".
 * Sem ele, o aviso de exclusão seria genérico e a lojista apagaria no escuro.
 */
export async function contarProdutosPorMarca(tenantId: string): Promise<Record<string, number>> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("products")
    .select("brand_id")
    .eq("tenant_id", tenantId)
    .not("brand_id", "is", null);

  if (error) {
    console.error("[marcas] falha ao contar produtos por marca:", error);
    return {};
  }

  const contagem: Record<string, number> = {};
  for (const linha of data ?? []) {
    const id = (linha as { brand_id: string | null }).brand_id;
    if (!id) continue;
    contagem[id] = (contagem[id] ?? 0) + 1;
  }
  return contagem;
}

/**
 * Endereço de site a partir de um nome. Mesma função de `categories`: acento
 * some, espaço vira hífen, o resto cai fora.
 */
export function slugifyBrand(raw: string): string {
  return (raw ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
