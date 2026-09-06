"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureModuleForAction } from "@/lib/auth/require-module";
import { contarProdutosPorMarca, slugifyBrand } from "@/modules/brands/service";

/**
 * MARCAS — incluir, alterar, reordenar e excluir.
 *
 * Segue o mesmo padrão de `src/modules/catalog/category-actions.ts`, com UMA
 * diferença deliberada na exclusão:
 *
 *   - categoria com cesta vinculada NÃO pode ser apagada (a FK é RESTRICT: a
 *     categoria organiza a navegação do site, e apagá-la deixaria cestas soltas);
 *   - marca com cesta vinculada PODE ser apagada, e o vínculo é desligado
 *     (`on delete set null`, migração 0033). A marca é um dado descritivo --
 *     "cesta sem marca" é uma cesta normal; "cesta sem categoria" não é.
 *
 * A tela avisa quantos produtos vão perder a marca ANTES de a lojista confirmar.
 */

type Resultado = { ok: true } | { ok: false; error: string };

async function proximaOrdem(
  admin: ReturnType<typeof createAdminClient>,
  tenantId: string
): Promise<number> {
  const { data } = await admin
    .from("brands")
    .select("sort_order")
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return ((data as { sort_order: number | null } | null)?.sort_order ?? 0) + 1;
}

/** Cria ou altera uma marca. Sem `id` = criar. */
export async function salvarMarca(input: {
  id?: string;
  name: string;
  slug: string;
  logoUrl: string;
  description: string;
  active: boolean;
}): Promise<Resultado> {
  const gate = await ensureModuleForAction("marcas");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  const nome = (input.name ?? "").trim();
  if (!nome) return { ok: false, error: "Dê um nome para a marca." };
  if (nome.length > 120) return { ok: false, error: "O nome da marca é muito longo (máximo 120 letras)." };

  const admin = createAdminClient();
  const slug = slugifyBrand(input.slug || nome).slice(0, 60) || crypto.randomUUID().slice(0, 8);

  const linha = {
    tenant_id: staff.tenantId,
    name: nome,
    slug,
    logo_url: (input.logoUrl ?? "").trim() || null,
    description: (input.description ?? "").trim() || null,
    active: input.active !== false,
    updated_at: new Date().toISOString(),
  };

  // `.select("id")` nos dois caminhos: sem ele, um UPDATE que não encontra
  // nenhuma linha (id de outra loja, marca já apagada) volta SEM erro e a tela
  // diz "salvo" sem ter salvo nada.
  const { data, error } = input.id
    ? await admin
        .from("brands")
        .update(linha)
        .eq("id", input.id)
        .eq("tenant_id", staff.tenantId)
        .select("id")
    : await admin
        .from("brands")
        .insert({ ...linha, sort_order: await proximaOrdem(admin, staff.tenantId) })
        .select("id");

  if (error) {
    if (error.code === "23505") return { ok: false, error: "Já existe uma marca com esse link (slug)." };
    console.error("[marcas] falha ao salvar:", error);
    return { ok: false, error: "Não foi possível salvar a marca." };
  }
  if (!data || data.length === 0) {
    return { ok: false, error: "Essa marca não foi encontrada nesta loja. Recarregue a página." };
  }

  revalidatePath("/admin/marcas");
  revalidatePath("/admin/produtos", "layout");
  return { ok: true };
}

/**
 * Exclui a marca. Os produtos NÃO são apagados: eles apenas ficam sem marca
 * (`products.brand_id` volta a ser nulo, pela própria regra da chave estrangeira).
 */
export async function excluirMarca(id: string): Promise<Resultado> {
  const gate = await ensureModuleForAction("marcas");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("brands")
    .delete()
    .eq("id", id)
    .eq("tenant_id", staff.tenantId)
    .select("id");

  if (error) {
    console.error("[marcas] falha ao excluir:", error);
    return { ok: false, error: "Não foi possível excluir essa marca." };
  }
  if (!data || data.length === 0) {
    return { ok: false, error: "Essa marca não foi encontrada nesta loja." };
  }

  revalidatePath("/admin/marcas");
  revalidatePath("/admin/produtos", "layout");
  return { ok: true };
}

/** Quantos produtos perdem a marca se ela for excluída. */
export async function contarProdutosDaMarca(
  id: string
): Promise<{ ok: true; total: number } | { ok: false; error: string }> {
  const gate = await ensureModuleForAction("marcas");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  const contagem = await contarProdutosPorMarca(staff.tenantId);
  return { ok: true, total: contagem[id] ?? 0 };
}

/** Grava a nova ordem das marcas (a ordem da tela é a ordem do site). */
export async function reordenarMarcas(orderedIds: string[]): Promise<Resultado> {
  const gate = await ensureModuleForAction("marcas");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  const admin = createAdminClient();
  const resultados = await Promise.all(
    orderedIds.map((id, index) =>
      admin
        .from("brands")
        .update({ sort_order: index })
        .eq("id", id)
        .eq("tenant_id", staff.tenantId)
        .select("id")
    )
  );
  if (resultados.some((r) => r.error)) return { ok: false, error: "Não foi possível reordenar as marcas." };

  revalidatePath("/admin/marcas");
  return { ok: true };
}
