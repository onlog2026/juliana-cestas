import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeSection, type Section } from "@/storefront/blocks/schemas";
import { DEFAULT_TEMPLATE_KEY, getTemplateOrDefault, isTemplateKey } from "@/storefront/templates/index";
import {
  planMaterialization,
  planSwitch,
  type MaterializationPlan,
  type PlannedPage,
  type PlannedTheme,
} from "@/storefront/templates/plan";
import { layoutSchema, type StoreLayout, type TemplateKey } from "@/storefront/templates/types";
import { sanitizeFonts, sanitizeTokens } from "@/storefront/theme";

/**
 * A COMPOSIÇÃO DA LOJA — ler e gravar.
 *
 * Este arquivo é o braço que grava o que `src/storefront/templates/plan.ts`
 * decidiu. A conta é lá (pura, testada); aqui só tem ida ao banco.
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  AS ÚNICAS TABELAS QUE ESTE ARQUIVO PODE TOCAR:                          ║
 * ║  store_theme · store_pages · store_pages_history                         ║
 * ║                                                                          ║
 * ║  PRODUTO, PEDIDO, CLIENTE, CUPOM, ENTREGA, BANNER, FOTO e os TEXTOS de   ║
 * ║  site_content NÃO SÃO TOCADOS por troca de modelo. Nunca.                ║
 * ║  `tests/unit/storefront.test.ts` lê este arquivo e falha se aparecer     ║
 * ║  qualquer outro nome de tabela num `.from(...)`.                         ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Toda gravação termina em `.select(...)` e confere se voltou linha. Sem isso,
 * uma escrita recusada volta como "0 linhas afetadas" e não como erro -- a
 * tela mostra "Salvo!" e nada foi salvo. Já aconteceu neste tipo de projeto.
 */

export type StoredTheme = {
  templateKey: TemplateKey;
  tokens: Record<string, string>;
  fonts: { sans: string; display: string };
  layout: StoreLayout;
};

export type ServiceResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? Record<string, never> : { data: T }))
  | { ok: false; error: string };

function falha(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

/** Converte o que veio do banco em seções válidas. Lixo é descartado, não quebra. */
function lerSecoes(raw: unknown): Section[] {
  if (!Array.isArray(raw)) return [];
  const out: Section[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const bruto = item as Record<string, unknown>;
    if (typeof bruto.type !== "string") continue;
    const normalizada = normalizeSection({
      id: typeof bruto.id === "string" ? bruto.id : bruto.type,
      type: bruto.type,
      variant: typeof bruto.variant === "string" ? bruto.variant : "",
      props: (bruto.props ?? {}) as Record<string, unknown>,
    });
    if (normalizada) out.push(normalizada);
  }
  return out;
}

function lerSeo(raw: unknown): { title?: string; description?: string } {
  if (!raw || typeof raw !== "object") return {};
  const bruto = raw as Record<string, unknown>;
  const out: { title?: string; description?: string } = {};
  if (typeof bruto.title === "string") out.title = bruto.title;
  if (typeof bruto.description === "string") out.description = bruto.description;
  return out;
}

function lerLayout(raw: unknown, fallbackKey: string): StoreLayout {
  const parsed = layoutSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  // Layout gravado fora do formato: usa o do modelo. Melhor o cabeçalho do
  // modelo que uma loja sem cabeçalho.
  return getTemplateOrDefault(fallbackKey).layout;
}

/* ─────────────────────────────── leitura ───────────────────────────────── */

/**
 * O tema/modelo da loja. `null` quando a loja ainda não materializou nada --
 * é o estado de HOJE, e é o estado em que a loja continua sendo servida pelo
 * caminho antigo.
 */
export const getStoreTheme = cache(async (tenantId: string): Promise<StoredTheme | null> => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("store_theme")
    .select("template_key, tokens, fonts, layout")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error || !data) return null;

  const templateKey = isTemplateKey(data.template_key) ? data.template_key : DEFAULT_TEMPLATE_KEY;
  return {
    templateKey,
    tokens: sanitizeTokens(data.tokens) as Record<string, string>,
    fonts: sanitizeFonts(data.fonts),
    layout: lerLayout(data.layout, templateKey),
  };
});

/** Todas as páginas montadas da loja (publicadas ou não). */
export const getStorePages = cache(async (tenantId: string): Promise<PlannedPage[]> => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("store_pages")
    .select("path, title, sections, published, seo")
    .eq("tenant_id", tenantId)
    .order("path", { ascending: true });

  if (error || !data) return [];
  return data.map((row) => ({
    path: row.path,
    title: row.title ?? "",
    sections: lerSecoes(row.sections),
    published: Boolean(row.published),
    seo: lerSeo(row.seo),
  }));
});

/**
 * A página de um caminho, SÓ se estiver publicada.
 *
 * É esta função que o `page.tsx` vai chamar no dia em que a chave for ligada.
 * Devolver `null` é resposta legítima e frequente: significa "continua no
 * caminho antigo".
 */
export async function getPublishedPage(tenantId: string, path: string): Promise<PlannedPage | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("store_pages")
    .select("path, title, sections, published, seo")
    .eq("tenant_id", tenantId)
    .eq("path", path)
    .eq("published", true)
    .maybeSingle();

  if (error || !data) return null;
  return {
    path: data.path,
    title: data.title ?? "",
    sections: lerSecoes(data.sections),
    published: true,
    seo: lerSeo(data.seo),
  };
}

/** A última troca de modelo, para a tela oferecer o "desfazer". */
export async function getUltimaTroca(
  tenantId: string
): Promise<{ id: string; templateKeyAnterior: string | null; criadoEm: string } | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("store_pages_history")
    .select("id, template_key, created_at")
    .eq("tenant_id", tenantId)
    .eq("reason", "troca-de-modelo")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: data.id,
    templateKeyAnterior: data.template_key,
    criadoEm: data.created_at,
  };
}

/* ─────────────────────────────── gravação ──────────────────────────────── */

async function gravarPlano(
  tenantId: string,
  plano: MaterializationPlan,
  updatedBy: string | null
): Promise<{ ok: true; paginas: number } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const agora = new Date().toISOString();

  const { data: temaGravado, error: erroTema } = await admin
    .from("store_theme")
    .upsert(
      {
        tenant_id: tenantId,
        template_key: plano.theme.templateKey,
        tokens: plano.theme.tokens,
        fonts: plano.theme.fonts,
        layout: plano.theme.layout,
        updated_at: agora,
        updated_by: updatedBy,
      },
      { onConflict: "tenant_id" }
    )
    .select("tenant_id");

  if (erroTema || !temaGravado || temaGravado.length === 0) {
    return falha("Não foi possível gravar o tema da loja. Nada foi alterado.");
  }

  const { data: paginasGravadas, error: erroPaginas } = await admin
    .from("store_pages")
    .upsert(
      plano.pages.map((page) => ({
        tenant_id: tenantId,
        path: page.path,
        title: page.title,
        sections: page.sections,
        published: page.published,
        seo: page.seo,
        updated_at: agora,
        updated_by: updatedBy,
      })),
      { onConflict: "tenant_id,path" }
    )
    .select("path");

  if (erroPaginas || !paginasGravadas || paginasGravadas.length !== plano.pages.length) {
    return falha("Não foi possível gravar as páginas do modelo.");
  }

  return { ok: true, paginas: paginasGravadas.length };
}

/**
 * Copia o modelo para as tabelas da loja.
 *
 * A lojista edita a CÓPIA, nunca o modelo -- se ela mudar um texto, ela mudou
 * a página dela, não o modelo "Editorial" de todo mundo. É por isso que existe
 * cópia: sem ela, a primeira edição de uma loja apareceria nas outras.
 *
 * Não publica nada: as páginas nascem com `published = false`.
 */
export async function materializeTemplate(
  tenantId: string,
  key: TemplateKey,
  updatedBy: string | null = null
): Promise<{ ok: true; paginas: number } | { ok: false; error: string }> {
  if (!isTemplateKey(key)) return falha("Modelo desconhecido.");
  return gravarPlano(tenantId, planMaterialization(key), updatedBy);
}

/**
 * Troca o modelo da loja.
 *
 * Na ordem, e a ordem importa:
 *   1. guarda a foto do "antes" em `store_pages_history` (é o que permite
 *      desfazer). Se este passo falhar, a troca NÃO acontece -- trocar sem
 *      rede é como apagar sem backup;
 *   2. calcula o plano do modelo novo religando o que a lojista já tinha
 *      ajustado, campo por campo, por tipo de bloco;
 *   3. grava.
 *
 * Produto, pedido e banner não entram em nenhum dos três passos.
 */
export async function switchTemplate(
  tenantId: string,
  key: TemplateKey,
  updatedBy: string | null = null
): Promise<{ ok: true; paginas: number } | { ok: false; error: string }> {
  if (!isTemplateKey(key)) return falha("Modelo desconhecido.");

  const admin = createAdminClient();
  const [temaAtual, paginasAtuais] = await Promise.all([
    getStoreTheme(tenantId),
    getStorePages(tenantId),
  ]);

  const { data: historico, error: erroHistorico } = await admin
    .from("store_pages_history")
    .insert({
      tenant_id: tenantId,
      template_key: temaAtual?.templateKey ?? null,
      snapshot: { theme: temaAtual, pages: paginasAtuais },
      reason: "troca-de-modelo",
      created_by: updatedBy,
    })
    .select("id");

  if (erroHistorico || !historico || historico.length === 0) {
    return falha("Não foi possível guardar o histórico. A troca foi cancelada para não perder o que existe.");
  }

  return gravarPlano(tenantId, planSwitch(key, paginasAtuais), updatedBy);
}

/**
 * Desfaz a última troca: volta o tema e as páginas exatamente como estavam.
 *
 * O "antes" do desfazer também vira histórico -- desfazer sem rede seria o
 * mesmo problema de trocar sem rede.
 */
export async function undoTemplateSwitch(
  tenantId: string,
  updatedBy: string | null = null
): Promise<{ ok: true; paginas: number } | { ok: false; error: string }> {
  const admin = createAdminClient();

  const { data: ultimo, error: erroLeitura } = await admin
    .from("store_pages_history")
    .select("id, snapshot")
    .eq("tenant_id", tenantId)
    .eq("reason", "troca-de-modelo")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (erroLeitura || !ultimo) return falha("Não há troca de modelo para desfazer.");

  const snapshot = (ultimo.snapshot ?? {}) as { theme?: unknown; pages?: unknown };
  const temaAnterior = snapshot.theme as StoredTheme | null | undefined;

  if (!temaAnterior || !isTemplateKey(temaAnterior.templateKey) || !Array.isArray(snapshot.pages)) {
    // Snapshot de uma loja que ainda não tinha modelo nenhum: desfazer aqui
    // seria apagar as tabelas, e apagar não é desfazer. Melhor dizer a
    // verdade do que fazer estrago silencioso.
    return falha("A foto guardada é de antes de a loja ter modelo. Escolha o modelo desejado na galeria.");
  }

  const paginasAnteriores = (snapshot.pages as PlannedPage[]).map((page) => ({
    path: page.path,
    title: page.title ?? "",
    sections: lerSecoes(page.sections),
    published: Boolean(page.published),
    seo: lerSeo(page.seo),
  }));

  // Guarda o estado de agora antes de voltar atrás.
  const [temaAgora, paginasAgora] = await Promise.all([
    getStoreTheme(tenantId),
    getStorePages(tenantId),
  ]);
  const { data: registrado, error: erroRegistro } = await admin
    .from("store_pages_history")
    .insert({
      tenant_id: tenantId,
      template_key: temaAgora?.templateKey ?? null,
      snapshot: { theme: temaAgora, pages: paginasAgora },
      reason: "desfazer",
      created_by: updatedBy,
    })
    .select("id");

  if (erroRegistro || !registrado || registrado.length === 0) {
    return falha("Não foi possível guardar o estado atual. O desfazer foi cancelado.");
  }

  const plano: MaterializationPlan = {
    theme: {
      templateKey: temaAnterior.templateKey,
      tokens: sanitizeTokens(temaAnterior.tokens),
      fonts: sanitizeFonts(temaAnterior.fonts),
      layout: lerLayout(temaAnterior.layout, temaAnterior.templateKey),
    } satisfies PlannedTheme,
    pages: paginasAnteriores,
  };

  return gravarPlano(tenantId, plano, updatedBy);
}
