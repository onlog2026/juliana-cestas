import Link from "next/link";
import { User } from "lucide-react";
import { getTenantId } from "@/lib/tenant/context";
import { getAllProducts } from "@/modules/catalog/service";
import { getSocialLinks } from "@/modules/settings/social-links";
import { getSiteSettings } from "@/modules/settings/site-settings";
import { getStoreProfile } from "@/modules/settings/store-profile";
import { HeaderSearch } from "@/components/loja/header-search";
import { HeaderNavMenu } from "@/components/loja/header-nav-menu";
import { SocialIcons } from "@/components/loja/social-icons";
import { HeaderLogo } from "@/components/loja/header-logo-editable";

export async function SiteHeader() {
  // A loja vem do endereço acessado (visitante anônimo, sem login).
  const tenantId = await getTenantId();
  const [products, socialLinks, siteSettings, storeProfile] = await Promise.all([
    getAllProducts(tenantId),
    getSocialLinks(tenantId),
    getSiteSettings(tenantId),
    getStoreProfile(tenantId),
  ]);
  // Nome da loja atual. Vazio enquanto o lojista nao preencher o perfil --
  // nesse caso o link fica so com o logo, sem inventar marca nenhuma.
  const storeName = storeProfile.businessName?.trim() || "";
  const hasSocialLinks = Object.values(socialLinks).some(Boolean);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-saturate-150">
      {hasSocialLinks ? (
        <div className="border-b border-border/60 bg-secondary/30">
          <div className="mx-auto flex h-9 max-w-7xl items-center justify-end px-4 sm:px-6 lg:px-8">
            <SocialIcons links={socialLinks} />
          </div>
        </div>
      ) : null}

      <div className="mx-auto flex h-24 max-w-7xl items-center gap-8 px-4 sm:px-6 lg:px-8">
        {/* A barra cresceu de 72px pra 96px (h-24) de propósito: a logo real
            da loja é um selo circular detalhado, com "JULIANA CESTAS" escrito
            pequeno na base do círculo -- precisava de espaço de verdade, não
            só um número maior espremido na mesma altura de antes. */}
        <HeaderLogo
          logoHeaderUrl={siteSettings.logoHeaderUrl}
          logoFooterUrl={siteSettings.logoFooterUrl}
          faviconUrl={siteSettings.faviconUrl}
          storeName={storeName}
        />

        <div className="hidden flex-1 justify-center md:flex">
          <div className="w-full max-w-md">
            <HeaderSearch products={products} id="header-search-desktop" />
          </div>
        </div>

        <nav className="ml-auto hidden shrink-0 items-center gap-2 md:flex">
          <Link
            href="/conta"
            className="jc-nav-hover flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-foreground"
            aria-label="Minha conta"
          >
            <User className="size-5" />
            Minha conta
          </Link>
        </nav>
      </div>

      <div className="hidden border-t border-border md:block">
        <HeaderNavMenu products={products} />
      </div>

      <div className="border-t border-border px-4 py-2.5 md:hidden">
        <HeaderSearch products={products} id="header-search-mobile" />
      </div>
    </header>
  );
}
