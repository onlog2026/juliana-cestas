import { ExternalLink, TriangleAlert } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { getPlatformContentForAdmin } from "@/modules/platform/landing-service";
import { PlatformBrandingForm } from "@/components/platform/landing/branding-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Marca da plataforma" };

/**
 * Marca da PLATAFORMA -- logo e ícone da aba do próprio produto.
 *
 * Não confundir com a marca de uma LOJA: a logo de cada loja fica no painel
 * daquela loja (`/admin/configuracoes`), guardada em `site_settings` com o
 * `tenant_id` dela. Aqui é `site_content` com `tenant_id` nulo e
 * `surface = 'platform'`.
 */
export default async function SuperMarcaPage() {
  await requireSuperAdmin();

  let branding: Awaited<ReturnType<typeof getPlatformContentForAdmin<"branding">>> | null = null;
  let erro: string | null = null;
  try {
    branding = await getPlatformContentForAdmin("branding");
  } catch (e) {
    erro = e instanceof Error ? e.message : "Não foi possível carregar a marca.";
  }

  return (
    <div className="max-w-3xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl text-foreground">Marca da plataforma</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            O nome, a logo e o ícone da aba que aparecem na página pública da plataforma. Isto não muda a marca de
            nenhuma loja — a logo de cada loja continua no painel dela.
          </p>
        </div>
        <a
          href="/plataforma"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium text-foreground hover:bg-accent"
        >
          Ver a página <ExternalLink className="size-4" />
        </a>
      </div>

      {erro || !branding ? (
        <div className="mt-6 rounded-card border border-destructive/40 bg-destructive/5 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <TriangleAlert className="size-4" /> Não foi possível carregar a marca
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Nada foi alterado. Recarregue a página; se continuar, o banco está fora do ar.
          </p>
          {erro ? <p className="mt-2 text-xs text-muted-foreground">Detalhe técnico: {erro}</p> : null}
        </div>
      ) : (
        <section className="mt-6 rounded-card border border-border bg-card p-5">
          <PlatformBrandingForm branding={branding.value} isCustom={branding.isCustom} />
        </section>
      )}
    </div>
  );
}
