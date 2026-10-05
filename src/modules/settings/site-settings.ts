import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";

export type SiteSettings = {
  logoHeaderUrl: string | null;
  logoFooterUrl: string | null;
  faviconUrl: string | null;
  /** Altura da logo do cabeçalho, em pixels. `null` = usa o padrão (80px). */
  logoHeaderHeight: number | null;
  /** ID de medição do Google Analytics 4 da loja (G-XXXX). `null` = sem GA4. */
  ga4Id: string | null;
  /** ID do contêiner do Google Tag Manager da loja (GTM-XXXX). `null` = sem GTM. */
  gtmId: string | null;
};

// As constantes de tamanho (DEFAULT/MIN/MAX) moraram aqui antes e foram
// movidas para `logo-constants.ts` -- este arquivo é `server-only`, e um
// componente de cliente precisa ler esses números. Ver o comentário lá.

const EMPTY: SiteSettings = { logoHeaderUrl: null, logoFooterUrl: null, faviconUrl: null, logoHeaderHeight: null, ga4Id: null, gtmId: null };

// Uma consulta por requisição (metadados, cabeçalho e rodapé leem a mesma linha).
export const getSiteSettings = cache(fetchSiteSettings);

/**
 * Colunas em ordem do conjunto mais novo para o mais antigo. "column ... does not exist"
 * (42703) significa que uma migração ainda não rodou neste banco: cai para o conjunto
 * anterior em vez de apagar a logo, o rodapé e o favicon da loja INTEIRA por causa de
 * uma coluna nova e opcional -- um erro em UM campo não pode apagar os que já funcionavam.
 */
const CONJUNTOS_DE_COLUNAS = [
  "logo_header_url, logo_footer_url, favicon_url, logo_header_height, ga4_id, gtm_id", // 0053
  "logo_header_url, logo_footer_url, favicon_url, logo_header_height", // 0039
  "logo_header_url, logo_footer_url, favicon_url",
] as const;

async function fetchSiteSettings(tenantId: string): Promise<SiteSettings> {
  const admin = createAdminClient();
  for (const colunas of CONJUNTOS_DE_COLUNAS) {
    const { data, error } = await admin.from("site_settings").select(colunas).eq("tenant_id", tenantId).maybeSingle();
    if (error) {
      if (error.code === "42703") continue;
      return EMPTY;
    }
    if (!data) return EMPTY;
    const linha = data as unknown as Record<string, string | number | null | undefined>;
    return {
      logoHeaderUrl: (linha.logo_header_url as string | null | undefined) ?? null,
      logoFooterUrl: (linha.logo_footer_url as string | null | undefined) ?? null,
      faviconUrl: (linha.favicon_url as string | null | undefined) ?? null,
      logoHeaderHeight: (linha.logo_header_height as number | null | undefined) ?? null,
      ga4Id: (linha.ga4_id as string | null | undefined) ?? null,
      gtmId: (linha.gtm_id as string | null | undefined) ?? null,
    };
  }
  return EMPTY;
}
