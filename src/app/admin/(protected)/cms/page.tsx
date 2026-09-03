import { getSocialLinks } from "@/modules/settings/social-links";
import { getAllBannersAdmin } from "@/modules/banners/service";
import { getAllCategoriesAdmin } from "@/modules/catalog/categories";
import { getSiteSettings } from "@/modules/settings/site-settings";
import { SocialLinksForm } from "@/components/admin/social-links-form";
import { BannersManager } from "@/components/admin/banners-manager";
import { CategoriesManager } from "@/components/admin/categories-manager";
import { SiteBrandingForm } from "@/components/admin/site-branding-form";

export default async function AdminCmsPage() {
  const [links, banners, categories, siteSettings] = await Promise.all([
    getSocialLinks(),
    getAllBannersAdmin(),
    getAllCategoriesAdmin(),
    getSiteSettings(),
  ]);

  return (
    <div className="max-w-[1400px]">
      <h1 className="font-display text-2xl text-foreground">CMS</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Conteúdo do site que você pode editar sem mexer em código.
      </p>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-card border border-border bg-card p-5 xl:p-6">
          <h2 className="font-display text-lg text-foreground">Banners da home</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Fotos e frases do carrossel no topo da home. A ordem daqui é a ordem que aparece no site.
          </p>
          <div className="mt-4">
            <BannersManager banners={banners} />
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-card border border-border bg-card p-5">
            <h2 className="font-display text-lg text-foreground">Categorias</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Organizam as cestas no site (menu, filtro). Cada cesta pertence a uma categoria no cadastro do produto.
            </p>
            <div className="mt-4">
              <CategoriesManager categories={categories} />
            </div>
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
