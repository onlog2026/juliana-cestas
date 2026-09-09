"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/require-staff";
import { ensureModuleForAction } from "@/lib/auth/require-module";
import { LOGO_HEADER_HEIGHT_MAX, LOGO_HEADER_HEIGHT_MIN } from "@/modules/settings/logo-constants";

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
  /**
   * `undefined` (campo nem mandado) = NÃO mexe no tamanho já salvo -- é o que
   * acontece quando esta action é chamada pela tela de marca do admin
   * (`site-branding-form.tsx`), que ainda não tem esse controle. `null` =
   * pedido explícito de voltar ao padrão. Um número = o tamanho novo, sempre
   * conferido aqui -- o controle deslizante da tela é conforto, não a trava.
   */
  logoHeaderHeight?: number | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  // TRAVA DE SERVIDOR (módulo "cms"): a action é um endpoint HTTP -- some
  // do menu não quer dizer que sumiu da rede. Devolve a recusa em vez de
  // redirecionar, porque quem chamou é um formulário que precisa mostrar o
  // aviso na tela.
  const gate = await ensureModuleForAction("cms");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  // Monta o payload aos poucos: `logo_header_height` só entra quando ALGUÉM
  // de propósito mandou um valor pra ele. Upsert do Postgres/PostgREST só
  // toca nas colunas que aparecem no objeto -- omitir a coluna preserva o que
  // já estava salvo. Sem isso, salvar a logo pela tela de marca do admin
  // (que não conhece este campo) apagaria de volta pro padrão o tamanho que
  // a lojista ajustou pelo editor da home.
  const payload: Record<string, unknown> = {
    tenant_id: staff.tenantId,
    logo_header_url: normalizeUrl(input.logoHeaderUrl),
    logo_footer_url: normalizeUrl(input.logoFooterUrl),
    favicon_url: normalizeUrl(input.faviconUrl),
    updated_at: new Date().toISOString(),
  };

  if (input.logoHeaderHeight !== undefined) {
    if (input.logoHeaderHeight === null) {
      payload.logo_header_height = null;
    } else {
      const altura = Math.round(input.logoHeaderHeight);
      if (
        !Number.isFinite(altura) ||
        altura < LOGO_HEADER_HEIGHT_MIN ||
        altura > LOGO_HEADER_HEIGHT_MAX
      ) {
        return {
          ok: false,
          error: `O tamanho da logo precisa ficar entre ${LOGO_HEADER_HEIGHT_MIN} e ${LOGO_HEADER_HEIGHT_MAX} pixels.`,
        };
      }
      payload.logo_header_height = altura;
    }
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("site_settings")
    .upsert(payload, { onConflict: "tenant_id" })
    .select("tenant_id");

  if (error || !data || data.length === 0) return { ok: false, error: "Não foi possível salvar." };

  revalidatePath("/", "layout");
  revalidatePath("/admin/cms");
  return { ok: true };
}
