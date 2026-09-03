import { getSeoSettings } from "@/modules/seo/service";
import { SeoForm } from "@/components/admin/seo-form";

export default async function AdminSeoPage() {
  const settings = await getSeoSettings();

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl text-foreground">SEO</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Título, descrição e palavras-chave que aparecem no Google e são lidos
        por assistentes de IA (ChatGPT, Perplexity, etc.) quando alguém
        pergunta sobre cestas de café da manhã em Brasília.
      </p>

      <div className="mt-6 rounded-card border border-border bg-card p-5">
        <SeoForm settings={settings} />
      </div>
    </div>
  );
}
