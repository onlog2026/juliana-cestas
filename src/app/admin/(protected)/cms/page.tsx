import { getSocialLinks } from "@/modules/settings/social-links";
import { SocialLinksForm } from "@/components/admin/social-links-form";

export default async function AdminCmsPage() {
  const links = await getSocialLinks();

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl text-foreground">CMS</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Conteúdo do site que você pode editar sem mexer em código.
      </p>

      <section className="mt-6 rounded-card border border-border bg-card p-5">
        <h2 className="font-display text-lg text-foreground">Redes sociais</h2>
        <div className="mt-4">
          <SocialLinksForm links={links} />
        </div>
      </section>
    </div>
  );
}
