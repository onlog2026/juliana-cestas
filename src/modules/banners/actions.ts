"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureModuleForAction } from "@/lib/auth/require-module";
import { BANNER_TEXT_MAX_LENGTH } from "@/modules/banners/constants";

export type BannerInput = {
  id?: string;
  slug: string;
  image: string;
  mobileImage: string | null;
  mobileObjectPosition: string | null;
  href: string;
  text: string;
  top: number;
  left: number;
  maxWidth: number;
  objectPosition: string;
  textAlign: "left" | "center" | "right";
  fontSize: number;
  fontFamily: string;
  fontColor: string;
  active: boolean;
};

function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function upsertBanner(
  input: BannerInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  // TRAVA DE SERVIDOR (módulo "cms"): a action é um endpoint HTTP -- some
  // do menu não quer dizer que sumiu da rede. Devolve a recusa em vez de
  // redirecionar, porque quem chamou é um formulário que precisa mostrar o
  // aviso na tela.
  const gate = await ensureModuleForAction("cms");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  if (!input.image) return { ok: false, error: "Envie uma imagem para o banner." };
  if (!input.text.trim()) return { ok: false, error: "Escreva o texto do banner." };
  if (input.text.trim().length > BANNER_TEXT_MAX_LENGTH) {
    return { ok: false, error: `Texto muito longo (máximo ${BANNER_TEXT_MAX_LENGTH} caracteres) -- quebra o banner no celular.` };
  }
  if (!input.href.trim()) return { ok: false, error: "Informe o link do banner." };

  const admin = createAdminClient();
  const slug = slugify(input.slug || input.text).slice(0, 60) || crypto.randomUUID().slice(0, 8);

  const row = {
    tenant_id: staff.tenantId,
    slug,
    image_url: input.image,
    mobile_image_url: input.mobileImage,
    mobile_object_position: input.mobileObjectPosition,
    href: input.href.trim(),
    text: input.text.trim(),
    text_position: { top: input.top, left: input.left, maxWidth: input.maxWidth },
    object_position: input.objectPosition.trim() || null,
    text_align: input.textAlign,
    font_size: input.fontSize,
    font_family: input.fontFamily,
    font_color: input.fontColor,
    active: input.active,
  };

  const query = input.id
    ? admin.from("banners").update(row).eq("id", input.id).eq("tenant_id", staff.tenantId)
    : admin.from("banners").insert({
        ...row,
        sort_order: await nextSortOrder(staff.tenantId, admin),
      });

  const { error } = await query;
  if (error) return { ok: false, error: "Não foi possível salvar o banner." };

  revalidatePath("/");
  revalidatePath("/admin/cms");
  return { ok: true };
}

async function nextSortOrder(
  tenantId: string,
  admin: ReturnType<typeof createAdminClient>
): Promise<number> {
  const { data } = await admin
    .from("banners")
    .select("sort_order")
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.sort_order ?? 0) + 1;
}

export async function deleteBanner(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  // TRAVA DE SERVIDOR (módulo "cms"): a action é um endpoint HTTP -- some
  // do menu não quer dizer que sumiu da rede. Devolve a recusa em vez de
  // redirecionar, porque quem chamou é um formulário que precisa mostrar o
  // aviso na tela.
  const gate = await ensureModuleForAction("cms");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  const admin = createAdminClient();
  const { error } = await admin.from("banners").delete().eq("id", id).eq("tenant_id", staff.tenantId);
  if (error) return { ok: false, error: "Não foi possível excluir." };

  revalidatePath("/");
  revalidatePath("/admin/cms");
  return { ok: true };
}

export async function reorderBanners(
  orderedIds: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  // TRAVA DE SERVIDOR (módulo "cms"): a action é um endpoint HTTP -- some
  // do menu não quer dizer que sumiu da rede. Devolve a recusa em vez de
  // redirecionar, porque quem chamou é um formulário que precisa mostrar o
  // aviso na tela.
  const gate = await ensureModuleForAction("cms");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  const admin = createAdminClient();
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      admin.from("banners").update({ sort_order: index }).eq("id", id).eq("tenant_id", staff.tenantId)
    )
  );
  if (results.some((r) => r.error)) return { ok: false, error: "Não foi possível reordenar." };

  revalidatePath("/");
  revalidatePath("/admin/cms");
  return { ok: true };
}
