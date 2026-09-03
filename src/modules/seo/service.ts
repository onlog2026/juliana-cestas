import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { TENANT_ID } from "@/lib/tenant";

export type SeoSettings = {
  siteTitle: string;
  siteDescription: string;
  keywords: string[];
  ogImageUrl: string | null;
};

const FALLBACK: SeoSettings = {
  siteTitle: "Juliana Cestas | Cestas de Café da Manhã em Brasília",
  siteDescription:
    "Cestas de café da manhã artesanais em Brasília, com entrega no mesmo dia e cartão de mensagem personalizado.",
  keywords: ["cesta de café da manhã Brasília", "presente café da manhã Brasília", "Juliana Cestas"],
  ogImageUrl: null,
};

export async function getSeoSettings(): Promise<SeoSettings> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("seo_settings")
    .select("site_title, site_description, keywords, og_image_url")
    .eq("tenant_id", TENANT_ID)
    .maybeSingle();

  if (error || !data) return FALLBACK;

  return {
    siteTitle: data.site_title,
    siteDescription: data.site_description,
    keywords: data.keywords ?? [],
    ogImageUrl: data.og_image_url,
  };
}
