import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";

export type SocialLinks = {
  instagram: string | null;
  facebook: string | null;
  x: string | null;
  youtube: string | null;
  linkedin: string | null;
};

const EMPTY: SocialLinks = { instagram: null, facebook: null, x: null, youtube: null, linkedin: null };

// Uma consulta por requisição (cabeçalho e rodapé leem a mesma linha).
export const getSocialLinks = cache(fetchSocialLinks);

async function fetchSocialLinks(tenantId: string): Promise<SocialLinks> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("social_links")
    .select("instagram, facebook, x, youtube, linkedin")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error || !data) return EMPTY;

  return {
    instagram: data.instagram,
    facebook: data.facebook,
    x: data.x,
    youtube: data.youtube,
    linkedin: data.linkedin,
  };
}
