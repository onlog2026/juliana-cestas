import { getTenantId } from "@/lib/tenant/context";
import { getSiteSettings } from "@/modules/settings/site-settings";
import { getStoreProfile } from "@/modules/settings/store-profile";
import { HeaderLogo } from "@/components/loja/header-logo-editable";

export async function SiteHeader() {
  // A loja vem do endereço acessado (visitante anônimo, sem login).
  const tenantId = await getTenantId();
  const [siteSettings, storeProfile] = await Promise.all([
    getSiteSettings(tenantId),
    getStoreProfile(tenantId),
  ]);
  // Nome da loja atual. Vazio enquanto o lojista nao preencher o perfil --
  // nesse caso o link fica so com o logo, sem inventar marca nenhuma.
  const storeName = storeProfile.businessName?.trim() || "";

  return (
    // Header enxuto: só o logo, por decisão do dono. Fundo sólido, sem
    // backdrop-filter (jank de rolagem no mobile em elemento sticky).
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex max-w-7xl items-center px-4 py-2 sm:px-6 lg:px-8">
        {/* Sem altura fixa de propósito: a lojista escolhe o tamanho da logo
            (controle na própria home), então a barra acompanha -- `py-2`
            reproduz a altura padrão e cresce/encolhe com o tamanho da logo. */}
        <HeaderLogo
          logoHeaderUrl={siteSettings.logoHeaderUrl}
          logoFooterUrl={siteSettings.logoFooterUrl}
          faviconUrl={siteSettings.faviconUrl}
          logoHeaderHeight={siteSettings.logoHeaderHeight}
          storeName={storeName}
        />
      </div>
    </header>
  );
}
