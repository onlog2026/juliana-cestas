"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { TENANT_ID } from "@/lib/tenant";
import { requireStaff } from "@/lib/auth/require-staff";

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function updateSocialLinks(input: {
  instagram: string;
  facebook: string;
  x: string;
  youtube: string;
  linkedin: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();

  const admin = createAdminClient();
  const { error } = await admin
    .from("social_links")
    .upsert(
      {
        tenant_id: TENANT_ID,
        instagram: normalizeUrl(input.instagram),
        facebook: normalizeUrl(input.facebook),
        x: normalizeUrl(input.x),
        youtube: normalizeUrl(input.youtube),
        linkedin: normalizeUrl(input.linkedin),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id" }
    );

  if (error) return { ok: false, error: "Não foi possível salvar." };

  revalidatePath("/", "layout");
  revalidatePath("/admin/cms");
  return { ok: true };
}

export async function updateStoreProfile(input: {
  businessName: string;
  document: string;
  email: string;
  phone: string;
  cep: string;
  street: string;
  addressNumber: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();

  const admin = createAdminClient();
  const { error } = await admin
    .from("store_profile")
    .upsert(
      {
        tenant_id: TENANT_ID,
        business_name: input.businessName.trim() || null,
        document: input.document.trim() || null,
        email: input.email.trim() || null,
        phone: input.phone.trim() || null,
        cep: input.cep.trim() || null,
        street: input.street.trim() || null,
        address_number: input.addressNumber.trim() || null,
        complement: input.complement.trim() || null,
        neighborhood: input.neighborhood.trim() || null,
        city: input.city.trim() || null,
        state: input.state.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id" }
    );

  if (error) return { ok: false, error: "Não foi possível salvar." };

  revalidatePath("/", "layout");
  revalidatePath("/admin/configuracoes");
  return { ok: true };
}

export async function updateSiteSettings(input: {
  logoHeaderUrl: string;
  logoFooterUrl: string;
  faviconUrl: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();

  const admin = createAdminClient();
  const { error } = await admin
    .from("site_settings")
    .upsert(
      {
        tenant_id: TENANT_ID,
        logo_header_url: normalizeUrl(input.logoHeaderUrl),
        logo_footer_url: normalizeUrl(input.logoFooterUrl),
        favicon_url: normalizeUrl(input.faviconUrl),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id" }
    );

  if (error) return { ok: false, error: "Não foi possível salvar." };

  revalidatePath("/", "layout");
  revalidatePath("/admin/cms");
  return { ok: true };
}
