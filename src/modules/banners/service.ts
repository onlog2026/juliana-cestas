import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { TENANT_ID } from "@/lib/tenant";

export type Banner = {
  id: string;
  slug: string;
  image: string;
  objectPosition: string | null;
  href: string;
  text: string;
  textPosition: { top: number; left: number; maxWidth: number };
  textAlign: "left" | "center" | "right";
  fontSize: number;
  fontFamily: string;
  fontColor: string;
  active: boolean;
  sortOrder: number;
};

type BannerRow = {
  id: string;
  slug: string;
  image_url: string;
  href: string;
  text: string;
  text_position: { top: number; left: number; maxWidth: number };
  object_position: string | null;
  text_align: string | null;
  font_size: number | null;
  font_family: string | null;
  font_color: string | null;
  active: boolean;
  sort_order: number;
};

const BANNER_COLUMNS =
  "id, slug, image_url, href, text, text_position, object_position, text_align, font_size, font_family, font_color, active, sort_order";

function mapBanner(row: BannerRow): Banner {
  return {
    id: row.id,
    slug: row.slug,
    image: row.image_url,
    objectPosition: row.object_position,
    href: row.href,
    text: row.text,
    textPosition: row.text_position,
    textAlign: (row.text_align as Banner["textAlign"]) ?? "left",
    fontSize: row.font_size ?? 32,
    fontFamily: row.font_family ?? "display",
    fontColor: row.font_color ?? "#ffffff",
    active: row.active,
    sortOrder: row.sort_order,
  };
}

/** Banners ativos, na ordem certa -- é o que o carrossel da home usa. */
export async function getActiveBanners(): Promise<Banner[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("banners")
    .select(BANNER_COLUMNS)
    .eq("tenant_id", TENANT_ID)
    .eq("active", true)
    .order("sort_order", { ascending: true });
  return (data ?? []).map(mapBanner);
}

/** Todos os banners (inclui inativos) -- pro painel admin gerenciar. */
export async function getAllBannersAdmin(): Promise<Banner[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("banners")
    .select(BANNER_COLUMNS)
    .eq("tenant_id", TENANT_ID)
    .order("sort_order", { ascending: true });
  return (data ?? []).map(mapBanner);
}
