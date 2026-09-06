import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { STORE_DEFAULTS } from "@/modules/content/defaults";
import { STORE_SECTIONS, type StoreContent, type StoreSection } from "@/modules/content/types";

/**
 * Conteúdo editável da loja.
 *
 * Regra: se a loja não tiver a seção gravada (ou o que estiver gravado não
 * bater com o formato esperado), devolve o padrão neutro. Nunca quebra a
 * página por causa de conteúdo -- no pior caso mostra o texto padrão.
 */

/** Carrega TODAS as seções da loja de uma vez (uma consulta por requisição). */
const loadAll = cache(async (tenantId: string): Promise<Partial<Record<StoreSection, unknown>>> => {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_content")
    .select("section, payload")
    .eq("tenant_id", tenantId)
    .eq("surface", "store")
    .eq("slot", "default");

  if (error || !data) return {};
  const out: Partial<Record<StoreSection, unknown>> = {};
  for (const row of data) out[row.section as StoreSection] = row.payload;
  return out;
});

export async function getContent<K extends StoreSection>(
  tenantId: string,
  section: K
): Promise<StoreContent[K]> {
  const all = await loadAll(tenantId);
  const raw = all[section];
  if (raw === undefined) return STORE_DEFAULTS[section];

  const parsed = STORE_SECTIONS[section].safeParse(raw);
  if (!parsed.success) {
    // Conteúdo gravado fora do formato (ex.: schema mudou depois). Melhor
    // mostrar o padrão do que derrubar a página do cliente.
    console.error(`[content] seção "${section}" inválida na loja ${tenantId}`, parsed.error.flatten());
    return STORE_DEFAULTS[section];
  }
  return parsed.data as StoreContent[K];
}

/** Só para o painel: o que está gravado + de onde veio (padrão ou editado). */
export async function getContentForAdmin<K extends StoreSection>(
  tenantId: string,
  section: K
): Promise<{ value: StoreContent[K]; isCustom: boolean }> {
  const all = await loadAll(tenantId);
  const raw = all[section];
  const value = await getContent(tenantId, section);
  return { value, isCustom: raw !== undefined };
}
