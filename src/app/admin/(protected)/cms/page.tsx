import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireStaffWithModule } from "@/lib/auth/require-module";
import { getSocialLinks } from "@/modules/settings/social-links";
import { getAllBannersAdmin } from "@/modules/banners/service";
import { getSiteSettings } from "@/modules/settings/site-settings";
import { getAllProducts } from "@/modules/catalog/service";
import { getContentForAdmin } from "@/modules/content/service";
import { SocialLinksForm } from "@/components/admin/social-links-form";
import { BannersManager } from "@/components/admin/banners-manager";
import { SiteBrandingForm } from "@/components/admin/site-branding-form";
import { ContentAnnouncementForm } from "@/components/admin/content-announcement-form";
import { StorefrontPreview } from "@/components/admin/storefront-preview";
import { ContentPromoBannersForm } from "@/components/admin/content-promo-banners-form";
import { OgImageForm } from "@/components/admin/og-image-form";
import { getSeoSettings } from "@/modules/seo/service";

export default async function AdminCmsPage() {
  // TRAVA DE SERVIDOR: esconder o item do menu não impede ninguém de
  // digitar este endereço na barra do navegador. Quem chega aqui sem o
  // módulo "cms" no plano é levado para a página de oferta.
  // (Esta tela edita banners, categorias e a marca do site.)
  const staff = await requireStaffWithModule("cms");
  const [links, banners, siteSettings, announcement, promoBanners, products, seoSettings] = await Promise.all([
    getSocialLinks(staff.tenantId),
    getAllBannersAdmin(staff.tenantId),
    getSiteSettings(staff.tenantId),
    getContentForAdmin(staff.tenantId, "announcement"),
    getContentForAdmin(staff.tenantId, "promo_banners"),
    getAllProducts(staff.tenantId),
    getSeoSettings(staff.tenantId),
  ]);

  return (
    <div className="max-w-[1400px]">
      <h1 className="font-display text-2xl text-foreground">CMS</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Conteúdo do site que você pode editar sem mexer em código.
      </p>

      <section className="mt-6 rounded-card border border-border bg-card p-5 xl:p-6">
        <h2 className="font-display text-lg text-foreground">Prévia da loja</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Veja como a loja aparece no celular e no computador. Mostra a versão publicada.
        </p>
        <div className="mt-4">
          <StorefrontPreview />
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <section className="rounded-card border border-border bg-card p-5 xl:p-6">
            <h2 className="font-display text-lg text-foreground">Banners da home</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Fotos e frases do carrossel no topo da home. A ordem daqui é a ordem que aparece no site.
            </p>
            <div className="mt-4">
              <BannersManager banners={banners} />
            </div>
          </section>

          <section className="rounded-card border border-border bg-card p-5 xl:p-6">
            <h2 className="font-display text-lg text-foreground">Banners promocionais</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Dois banners de tamanhos diferentes no meio da lista de cestas (depois da 3ª linha): um largo e um
              estreito.
            </p>
            <div className="mt-4">
              <ContentPromoBannersForm value={promoBanners.value} productCount={products.length} />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-card border border-border bg-card p-5">
            <h2 className="font-display text-lg text-foreground">Aviso no topo da loja</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Uma faixa de aviso acima do cabeçalho (frete grátis, feriado, promoção). Ela só aparece quando
              você liga e escreve um texto.
            </p>
            <div className="mt-4">
              <ContentAnnouncementForm value={announcement.value} />
            </div>
          </section>

          <section className="rounded-card border border-border bg-card p-5">
            <h2 className="font-display text-lg text-foreground">Categorias</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Categorias e subcategorias agora ficam em Produtos, junto do cadastro de cada cesta.
            </p>
            <Link
              href="/admin/produtos/categorias"
              className="jc-nav-hover mt-4 flex h-11 items-center justify-between rounded-[10px] border border-border px-4 text-sm font-medium text-foreground"
            >
              Gerenciar categorias
              <ChevronRight className="size-4" />
            </Link>
          </section>

          <section className="rounded-card border border-border bg-card p-5">
            <h2 className="font-display text-lg text-foreground">Identidade visual</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Logo do topo, do rodapé e o ícone da aba do navegador (favicon).
            </p>
            <div className="mt-4">
              <SiteBrandingForm settings={siteSettings} />
            </div>
          </section>

          <section className="rounded-card border border-border bg-card p-5">
            <h2 className="font-display text-lg text-foreground">Imagem de compartilhamento</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A imagem que aparece quando alguém envia o link da loja no WhatsApp, Instagram ou Facebook.
            </p>
            <div className="mt-4">
              <OgImageForm settings={seoSettings} />
            </div>
          </section>

          <section className="rounded-card border border-border bg-card p-5">
            <h2 className="font-display text-lg text-foreground">Textos do site</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Benefícios, perguntas frequentes, chamada do WhatsApp, páginas &ldquo;Sobre&rdquo; e
              &ldquo;Trocas e entregas&rdquo; e os dados do negócio que o Google usa.
            </p>
            <Link
              href="/admin/cms/textos"
              className="jc-nav-hover mt-4 flex h-11 items-center justify-between rounded-[10px] border border-border px-4 text-sm font-medium text-foreground"
            >
              Editar textos do site
              <ChevronRight className="size-4" />
            </Link>
          </section>

          <section className="rounded-card border border-border bg-card p-5">
            <h2 className="font-display text-lg text-foreground">Redes sociais</h2>
            <div className="mt-4">
              <SocialLinksForm links={links} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
