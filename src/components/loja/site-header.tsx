import Link from "next/link";
import { User } from "lucide-react";
import { getAllProducts } from "@/modules/catalog/service";
import { getSocialLinks } from "@/modules/settings/social-links";
import { getSiteSettings } from "@/modules/settings/site-settings";
import { HeaderSearch } from "@/components/loja/header-search";
import { HeaderNavMenu } from "@/components/loja/header-nav-menu";
import { SocialIcons } from "@/components/loja/social-icons";

export async function SiteHeader() {
  const [products, socialLinks, siteSettings] = await Promise.all([
    getAllProducts(),
    getSocialLinks(),
    getSiteSettings(),
  ]);
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

      <div className="mx-auto flex h-18 max-w-7xl items-center gap-8 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 font-display text-2xl text-primary"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- pode ser GIF animado; next/image reprocessaria e perderia a animação */}
          <img
            src={siteSettings.logoHeaderUrl ?? "/logo/juliana-present-icon.svg"}
            alt=""
            aria-hidden="true"
            width={38}
            height={34}
            className="h-[34px] w-[38px] shrink-0 object-contain"
          />
          Juliana Cestas
        </Link>

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
