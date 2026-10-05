import { requireStaffWithModule } from "@/lib/auth/require-module";
import { getSeoSettings } from "@/modules/seo/service";
import { SeoForm } from "@/components/admin/seo-form";
import { TrackingIdsForm } from "@/components/admin/tracking-ids-form";
import { getSiteSettings } from "@/modules/settings/site-settings";

export default async function AdminSeoPage() {
  // TRAVA DE SERVIDOR: esconder o item do menu não impede ninguém de
  // digitar este endereço na barra do navegador. Quem chega aqui sem o
  // módulo "seo" no plano é levado para a página de oferta.
  // (Esta tela é a do SEO da loja.)
  const staff = await requireStaffWithModule("seo");
  const [settings, site] = await Promise.all([getSeoSettings(staff.tenantId), getSiteSettings(staff.tenantId)]);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl text-foreground">SEO</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Título, descrição e palavras-chave que aparecem no Google e são lidos
        por assistentes de IA (ChatGPT, Perplexity, etc.) quando alguém
        pergunta sobre as suas cestas e presentes.
      </p>

      <div className="mt-6 rounded-card border border-border bg-card p-5">
        <SeoForm settings={settings} />
      </div>

      <h2 className="mt-8 font-display text-xl text-foreground">Medição (Google Analytics)</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Cada loja mede só no próprio ID. Sem ID, nada é medido.
      </p>
      <div className="mt-4 rounded-card border border-border bg-card p-5">
        <TrackingIdsForm ga4Id={site.ga4Id} gtmId={site.gtmId} />
      </div>
    </div>
  );
}
