import type { Metadata } from "next";
import { SiteHeader } from "@/components/loja/site-header";
import { SiteFooter } from "@/components/loja/site-footer";
import { BottomNav } from "@/components/loja/bottom-nav";
import { LocalBusinessJsonLd } from "@/components/loja/json-ld";
import { getSeoSettings } from "@/modules/seo/service";
import { getSiteSettings } from "@/modules/settings/site-settings";
import { getStoreProfile, getStoreWhatsapp } from "@/modules/settings/store-profile";
import { getTenantId } from "@/lib/tenant/context";

// TODO F7: a URL pública de cada loja vai vir de `tenant_domains`. Enquanto
// esse mapa não existe, a única fonte é o env da loja legada.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://juliana-cestas-loja.vercel.app";

export async function generateMetadata(): Promise<Metadata> {
  const tenantId = await getTenantId();
  const [seo, siteSettings, storeProfile] = await Promise.all([
    getSeoSettings(tenantId),
    getSiteSettings(tenantId),
    getStoreProfile(tenantId),
  ]);
  // Nome da loja: o do perfil; se ainda não foi preenchido, o título de SEO.
  const storeName = storeProfile.businessName?.trim() || seo.siteTitle;
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: seo.siteTitle,
      template: `%s | ${storeName}`,
    },
    description: seo.siteDescription,
    keywords: seo.keywords,
    icons: siteSettings.faviconUrl ? { icon: siteSettings.faviconUrl } : undefined,
    openGraph: {
      title: seo.siteTitle,
      description: seo.siteDescription,
      siteName: storeName,
      locale: "pt_BR",
      type: "website",
      images: seo.ogImageUrl ? [{ url: seo.ogImageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: seo.siteTitle,
      description: seo.siteDescription,
    },
    alternates: { canonical: "/" },
  };
}

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  // Número do WhatsApp vem do cadastro da loja (banco). A barra de baixo é
  // client component, então o número desce por prop a partir daqui.
  const whatsapp = await getStoreWhatsapp(await getTenantId());
  return (
    <>
      <LocalBusinessJsonLd />
      <SiteHeader />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <SiteFooter />
      <BottomNav whatsapp={whatsapp} />
    </>
  );
}
