import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { TENANT_ID } from "@/lib/tenant";

export type SocialLinks = {
  instagram: string | null;
  facebook: string | null;
  x: string | null;
  youtube: string | null;
  linkedin: string | null;
};

const EMPTY: SocialLinks = { instagram: null, facebook: null, x: null, youtube: null, linkedin: null };

export async function getSocialLinks(): Promise<SocialLinks> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("social_links")
    .select("instagram, facebook, x, youtube, linkedin")
    .eq("tenant_id", TENANT_ID)
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
