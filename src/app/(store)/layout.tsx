import type { Metadata } from "next";
import { SiteHeader } from "@/components/loja/site-header";
import { SiteFooter } from "@/components/loja/site-footer";
import { BottomNav } from "@/components/loja/bottom-nav";
import { InstallAppPrompt } from "@/components/loja/install-app-prompt";
import { CABECALHOS, RODAPES, TemaRoot } from "@/storefront/temas";
import { getTemaInstalado } from "@/storefront/temas/instalado";
import { dadosLoja } from "@/storefront/temas/dados-loja";
import { LocalBusinessJsonLd } from "@/components/loja/json-ld";
import { getSeoSettings } from "@/modules/seo/service";
import { getSiteSettings } from "@/modules/settings/site-settings";
import { getStoreProfile, getStoreWhatsapp } from "@/modules/settings/store-profile";
import { getTenantId } from "@/lib/tenant/context";
import { shortHash } from "@/modules/pwa/version";
import { pickDescription } from "@/modules/seo/meta";
import { getSiteUrlOrFallback } from "@/lib/tenant/site-url";
import { descricaoSiteReserva, tituloSiteReserva } from "@/modules/seo/texto-legado";
import { CartProvider } from "@/modules/cart/cart-context";
import { ClickTracker } from "@/components/analytics/track-events";
import { TenantAnalytics } from "@/components/analytics/tenant-analytics";

export async function generateMetadata(): Promise<Metadata> {
  const tenantId = await getTenantId();
  const [seo, siteSettings, storeProfile] = await Promise.all([
    getSeoSettings(tenantId),
    getSiteSettings(tenantId),
    getStoreProfile(tenantId),
  ]);
  // Nome da loja: o do perfil; se ainda não foi preenchido, o título de SEO.
  const storeName = storeProfile.businessName?.trim() || seo.siteTitle?.trim() || "";
  // Blindagem: se o SEO do banco vier vazio (seo_settings sem linha), o
  // título e a descrição NÃO podem sair em branco -- é o que faz o analisador
  // acusar "sem meta description / sem title". Cai num texto real derivado do
  // nome da loja.
  const siteTitle = seo.siteTitle?.trim() || storeName || tituloSiteReserva(tenantId);
  const siteDescription = pickDescription(
    seo.siteDescription,
    descricaoSiteReserva(tenantId, storeProfile, storeName)
  );
  return {
    metadataBase: new URL(await getSiteUrlOrFallback(tenantId)),
    title: {
      default: siteTitle,
      template: `%s | ${storeName || siteTitle}`,
    },
    description: siteDescription,
    keywords: seo.keywords,
    icons: siteSettings.faviconUrl
      ? { icon: siteSettings.faviconUrl, apple: [{ url: `/pwa-icon/180?v=${shortHash(siteSettings.faviconUrl)}`, sizes: "180x180" }] }
      : undefined,
    appleWebApp: { capable: true, title: storeName || siteTitle, statusBarStyle: "default" },
    openGraph: {
      title: siteTitle,
      description: siteDescription,
      siteName: storeName || siteTitle,
      locale: "pt_BR",
      type: "website",
      images: seo.ogImageUrl ? [{ url: seo.ogImageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: siteDescription,
    },
    alternates: { canonical: "/" },
  };
}

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  // Número do WhatsApp vem do cadastro da loja (banco). A barra de baixo é
  // client component, então o número desce por prop a partir daqui.
  const tenantId = await getTenantId();
  const [whatsapp, perfil] = await Promise.all([getStoreWhatsapp(tenantId), getStoreProfile(tenantId)]);
  // Modelo novo INSTALADO pelo lojista: cabeçalho, rodapé, cores e fontes dele. Sem modelo
  // instalado (caso da Juliana) o código abaixo nem roda e a loja é exatamente a de sempre.
  const instalado = await getTemaInstalado(tenantId);
  if (instalado) {
    const d = await dadosLoja(tenantId, "", instalado.variacao);
    const Cabecalho = CABECALHOS[instalado.tema.key];
    const Rodape = RODAPES[instalado.tema.key];
    return (
      <CartProvider>
        <TenantAnalytics tenantId={tenantId} />
        <LocalBusinessJsonLd />
        <ClickTracker />
        <TemaRoot tema={instalado.tema.key} v={instalado.variacao}>
          <Cabecalho d={d} />
          <main className="pb-16 md:pb-0">{children}</main>
          <Rodape d={d} />
          <BottomNav whatsapp={whatsapp} />
          <InstallAppPrompt storeName={perfil.businessName?.trim() || "loja"} />
        </TemaRoot>
      </CartProvider>
    );
  }
  return (
    <CartProvider>
      <TenantAnalytics tenantId={tenantId} />
      <LocalBusinessJsonLd />
      <ClickTracker />
      <SiteHeader />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <SiteFooter />
      <BottomNav whatsapp={whatsapp} />
      <InstallAppPrompt storeName={perfil.businessName?.trim() || "loja"} />
    </CartProvider>
  );
}
