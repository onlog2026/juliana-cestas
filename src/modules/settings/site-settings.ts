import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { TENANT_ID } from "@/lib/tenant";

export type SiteSettings = {
  logoHeaderUrl: string | null;
  logoFooterUrl: string | null;
  faviconUrl: string | null;
};

const EMPTY: SiteSettings = { logoHeaderUrl: null, logoFooterUrl: null, faviconUrl: null };

export async function getSiteSettings(): Promise<SiteSettings> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("site_settings")
    .select("logo_header_url, logo_footer_url, favicon_url")
    .eq("tenant_id", TENANT_ID)
    .maybeSingle();

  if (error || !data) return EMPTY;

  return {
    logoHeaderUrl: data.logo_header_url,
    logoFooterUrl: data.logo_footer_url,
    faviconUrl: data.favicon_url,
  };
}
