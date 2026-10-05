import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEnv } from "@/lib/env";
import { LEGACY_TENANT_ID } from "@/lib/tenant/legacy";

/** Endereço da loja original quando nem a variável do site existe (previews). Só vale para o tenant legado. */
const LEGACY_FALLBACK_URL = "https://juliana-cestas-loja.vercel.app";

const semBarraFinal = (u: string) => u.trim().replace(/\/+$/, "");

/**
 * Endereço público (https://…) da loja do `tenantId`, usado em links de e-mail, sitemap,
 * canonical, JSON-LD e llms.txt. Devolve "" quando não há endereço conhecido -- nesse caso o
 * chamador omite o link, NUNCA usa o endereço de outra loja.
 *
 * Ordem: loja original → variável `NEXT_PUBLIC_SITE_URL` (comportamento de sempre);
 * demais lojas → domínio próprio VERIFICADO → `{slug}.PLATFORM_DOMAIN`.
 */
export const getSiteUrl = cache(async (tenantId: string): Promise<string> => {
  if (tenantId === LEGACY_TENANT_ID) return process.env.NEXT_PUBLIC_SITE_URL ?? "";

  try {
    const admin = createAdminClient();
    const { data: dominio } = await admin
      .from("tenant_domains")
      .select("host")
      .eq("tenant_id", tenantId)
      .eq("status", "verificado")
      .order("verified_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (dominio?.host) return `https://${dominio.host}`;

    const plataforma = getEnv().PLATFORM_DOMAIN;
    if (plataforma) {
      const { data: loja } = await admin.from("tenants").select("slug").eq("id", tenantId).maybeSingle();
      if (loja?.slug) return `https://${loja.slug}.${plataforma}`;
    }
  } catch {
    /* sem endereço conhecido */
  }
  return "";
});

/**
 * Como `getSiteUrl`, mas sempre devolve uma URL válida (sem barra no fim) para quem precisa dela
 * (metadataBase, sitemap, robots, JSON-LD). Para a loja original mantém o padrão de sempre;
 * para as demais, sem endereço conhecido, usa o endereço local de desenvolvimento.
 */
export async function getSiteUrlOrFallback(tenantId: string): Promise<string> {
  const url = await getSiteUrl(tenantId);
  if (url) return semBarraFinal(url);
  return tenantId === LEGACY_TENANT_ID ? LEGACY_FALLBACK_URL : "http://localhost:3000";
}
