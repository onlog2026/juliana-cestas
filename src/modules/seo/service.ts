import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type SeoSettings = {
  siteTitle: string;
  siteDescription: string;
  keywords: string[];
  ogImageUrl: string | null;
};

/**
 * Usado só quando a loja ainda não preencheu o SEO (loja nova, ou leitura
 * falhou). Neutro de propósito: marca de uma loja nunca pode vazar para outra.
 * A loja da Juliana tem os valores dela gravados em `seo_settings` desde a
 * migration 0009 -- este padrão não a afeta.
 */
const FALLBACK: SeoSettings = {
  siteTitle: "",
  siteDescription: "",
  keywords: [],
  ogImageUrl: null,
};

export async function getSeoSettings(tenantId: string): Promise<SeoSettings> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("seo_settings")
    .select("site_title, site_description, keywords, og_image_url")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error || !data) return FALLBACK;

  return {
    siteTitle: data.site_title,
    siteDescription: data.site_description,
    keywords: data.keywords ?? [],
    ogImageUrl: data.og_image_url,
  };
}
