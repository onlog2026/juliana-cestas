import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type SiteSettings = {
  logoHeaderUrl: string | null;
  logoFooterUrl: string | null;
  faviconUrl: string | null;
  /** Altura da logo do cabeçalho, em pixels. `null` = usa o padrão (80px). */
  logoHeaderHeight: number | null;
};

// As constantes de tamanho (DEFAULT/MIN/MAX) moraram aqui antes e foram
// movidas para `logo-constants.ts` -- este arquivo é `server-only`, e um
// componente de cliente precisa ler esses números. Ver o comentário lá.

const EMPTY: SiteSettings = { logoHeaderUrl: null, logoFooterUrl: null, faviconUrl: null, logoHeaderHeight: null };

export async function getSiteSettings(tenantId: string): Promise<SiteSettings> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("site_settings")
    .select("logo_header_url, logo_footer_url, favicon_url, logo_header_height")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!error) {
    if (!data) return EMPTY;
    return {
      logoHeaderUrl: data.logo_header_url,
      logoFooterUrl: data.logo_footer_url,
      faviconUrl: data.favicon_url,
      logoHeaderHeight: data.logo_header_height,
    };
  }

  // "column ... does not exist" (42703): a migração 0039 ainda não rodou
  // neste banco. Sem este retry, a logo, o rodapé e o favicon da loja
  // INTEIRA sumiriam da tela por causa de uma coluna nova e opcional --
  // um erro em UM campo não pode apagar os outros três que já funcionavam.
  if (error.code === "42703") {
    const retry = await admin
      .from("site_settings")
      .select("logo_header_url, logo_footer_url, favicon_url")
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (retry.error || !retry.data) return EMPTY;
    return {
      logoHeaderUrl: retry.data.logo_header_url,
      logoFooterUrl: retry.data.logo_footer_url,
      faviconUrl: retry.data.favicon_url,
      logoHeaderHeight: null,
    };
  }

  return EMPTY;
}
