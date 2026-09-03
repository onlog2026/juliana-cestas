import { getSocialLinks } from "@/modules/settings/social-links";
import { getAllBannersAdmin } from "@/modules/banners/service";
import { getAllCategoriesAdmin } from "@/modules/catalog/categories";
import { SocialLinksForm } from "@/components/admin/social-links-form";
import { BannersManager } from "@/components/admin/banners-manager";
import { CategoriesManager } from "@/components/admin/categories-manager";

export default async function AdminCmsPage() {
  const [links, banners, categories] = await Promise.all([
    getSocialLinks(),
    getAllBannersAdmin(),
    getAllCategoriesAdmin(),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl text-foreground">CMS</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Conteúdo do site que você pode editar sem mexer em código.
      </p>

      <section className="mt-6 rounded-card border border-border bg-card p-5">
        <h2 className="font-display text-lg text-foreground">Categorias</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Organizam as cestas no site (menu, filtro). Cada cesta pertence a uma categoria no cadastro do produto.
        </p>
        <div className="mt-4">
          <CategoriesManager categories={categories} />
        </div>
      </section>

      <section className="mt-6 rounded-card border border-border bg-card p-5">
        <h2 className="font-display text-lg text-foreground">Banners da home</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Fotos e frases do carrossel no topo da home. A ordem daqui é a ordem que aparece no site.
        </p>
        <div className="mt-4">
          <BannersManager banners={banners} />
        </div>
      </section>

      <section className="mt-6 rounded-card border border-border bg-card p-5">
        <h2 className="font-display text-lg text-foreground">Redes sociais</h2>
        <div className="mt-4">
          <SocialLinksForm links={links} />
        </div>
      </section>
    </div>
  );
}
