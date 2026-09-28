import type { MetadataRoute } from "next";
import { getTenantId } from "@/lib/tenant/context";
import { getSiteSettings } from "@/modules/settings/site-settings";
import { getStoreProfile } from "@/modules/settings/store-profile";
import { shortHash } from "@/modules/pwa/version";

/**
 * Manifesto do "app" da loja: é o que deixa o cliente instalar a loja na tela
 * inicial do celular (Chrome: menu ⋮ > "Instalar app"; iPhone: Compartilhar >
 * "Adicionar à Tela de Início") e abrir sem a barra do navegador.
 *
 * Sem service worker de propósito: não há modo offline, e por isso também não
 * existe o risco de o app instalado ficar preso numa versão velha da loja.
 */
export const revalidate = 3600;

// Cor do fundo do cabeçalho da loja -- a barra de status fica da mesma cor
// dele, sem "degrau" na primeira dobra.
const BRAND_BG = "#f6f1e8";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const tenantId = await getTenantId();
  const [profile, settings] = await Promise.all([getStoreProfile(tenantId), getSiteSettings(tenantId)]);
  const name = profile.businessName?.trim() || "Loja";
  // Trocou o favicon -> `v` novo -> o celular busca o ícone novo.
  const v = settings.faviconUrl ? `?v=${shortHash(settings.faviconUrl)}` : "";

  return {
    name,
    short_name: name.length > 12 ? name.split(/\s+/)[0] : name,
    description: `${name} — cestas e presentes feitos à mão.`,
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "pt-BR",
    background_color: BRAND_BG,
    theme_color: BRAND_BG,
    icons: [
      { src: `/pwa-icon/192${v}`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `/pwa-icon/512${v}`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `/pwa-icon/maskable-512${v}`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
