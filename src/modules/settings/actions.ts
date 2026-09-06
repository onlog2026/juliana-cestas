"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/require-staff";
import { ensureModuleForAction } from "@/lib/auth/require-module";

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
  // TRAVA DE SERVIDOR (módulo "cms"): a action é um endpoint HTTP -- some
  // do menu não quer dizer que sumiu da rede. Devolve a recusa em vez de
  // redirecionar, porque quem chamou é um formulário que precisa mostrar o
  // aviso na tela.
  const gate = await ensureModuleForAction("cms");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  const admin = createAdminClient();
  const { error } = await admin
    .from("social_links")
    .upsert(
      {
        tenant_id: staff.tenantId,
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
  const staff = await requireStaff();

  const admin = createAdminClient();
  const { error } = await admin
    .from("store_profile")
    .upsert(
      {
        tenant_id: staff.tenantId,
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
  // TRAVA DE SERVIDOR (módulo "cms"): a action é um endpoint HTTP -- some
  // do menu não quer dizer que sumiu da rede. Devolve a recusa em vez de
  // redirecionar, porque quem chamou é um formulário que precisa mostrar o
  // aviso na tela.
  const gate = await ensureModuleForAction("cms");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  const admin = createAdminClient();
  const { error } = await admin
    .from("site_settings")
    .upsert(
      {
        tenant_id: staff.tenantId,
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
