import Link from "next/link";
import { User } from "lucide-react";
import { getTenantId } from "@/lib/tenant/context";
import { getAllProducts } from "@/modules/catalog/service";
import { getActiveCategoryTree } from "@/modules/catalog/categories";
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
  const [products, categoryTree, socialLinks, siteSettings, storeProfile] = await Promise.all([
    getAllProducts(tenantId),
    getActiveCategoryTree(tenantId),
    getSocialLinks(tenantId),
    getSiteSettings(tenantId),
    getStoreProfile(tenantId),
  ]);
  // Nome da loja atual. Vazio enquanto o lojista nao preencher o perfil --
  // nesse caso o link fica so com o logo, sem inventar marca nenhuma.
  const storeName = storeProfile.businessName?.trim() || "";
  const hasSocialLinks = Object.values(socialLinks).some(Boolean);

  // Menu do topo em formato guarda-chuva: categoria principal -> subcategorias.
  // Passa só os campos que o menu (client) precisa -- categories.ts é
  // server-only e não pode cruzar a fronteira como objeto inteiro.
  const navCategories = categoryTree.map((top) => ({
    slug: top.slug,
    name: top.name,
    imageUrl: top.imageUrl,
    children: top.children.map((sub) => ({ slug: sub.slug, name: sub.name, imageUrl: sub.imageUrl })),
  }));

  return (
    // Fundo sólido, sem backdrop-filter: `backdrop-saturate` num elemento
    // sticky causa jank de rolagem no mobile (mesma família do blur que a
    // regra da casa proíbe em fixed/sticky).
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      {hasSocialLinks ? (
        <div className="border-b border-border/60 bg-secondary/30">
          <div className="mx-auto flex h-9 max-w-7xl items-center justify-end px-4 sm:px-6 lg:px-8">
            <SocialIcons links={socialLinks} />
          </div>
        </div>
      ) : null}

      <div className="mx-auto flex max-w-7xl items-center gap-8 px-4 py-2 sm:px-6 lg:px-8">
        {/* Sem altura fixa de propósito: a lojista agora escolhe o tamanho da
            logo (controle na própria home), então a barra precisa acompanhar
            -- `py-2` reproduz exatamente a altura de antes (96px) no tamanho
            padrão (80px), e cresce ou encolhe sozinha se ela mudar o tamanho. */}
        <HeaderLogo
          logoHeaderUrl={siteSettings.logoHeaderUrl}
          logoFooterUrl={siteSettings.logoFooterUrl}
          faviconUrl={siteSettings.faviconUrl}
          logoHeaderHeight={siteSettings.logoHeaderHeight}
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

      {navCategories.length > 0 ? (
        <div className="hidden border-t border-border md:block">
          <HeaderNavMenu categories={navCategories} />
        </div>
      ) : null}

      <div className="border-t border-border px-4 py-2.5 md:hidden">
        <HeaderSearch products={products} id="header-search-mobile" />
      </div>
    </header>
  );
}
