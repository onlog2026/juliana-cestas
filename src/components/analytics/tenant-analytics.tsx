import { getSiteSettings } from "@/modules/settings/site-settings";
import { LEGACY_TENANT_ID } from "@/lib/tenant/legacy";
import { GoogleAnalytics } from "./google-analytics";
import { GoogleTagManager, GoogleTagManagerNoScript } from "./google-tag-manager";

/**
 * IDs que a loja ORIGINAL (a da Juliana) já usava antes de o ID virar configuração por loja.
 * Valem SÓ para o tenant legado e SÓ enquanto a loja não tem ID próprio gravado
 * (coluna ainda inexistente ou vazia) -- assim a medição dela não para nem por um dia.
 * Nenhuma outra loja herda estes valores.
 */
const LEGACY_GA4_ID = "G-DP4FFX56RD";
const LEGACY_GTM_ID = "GTM-MSP4DBHM";

/** Medição (GA4 + Tag Manager) da loja do `tenantId`: cada loja mede só no seu próprio ID. */
export async function TenantAnalytics({ tenantId }: { tenantId: string }) {
  const s = await getSiteSettings(tenantId);
  const legado = tenantId === LEGACY_TENANT_ID;
  const ga4 = s.ga4Id ?? (legado ? process.env.NEXT_PUBLIC_GA4_ID || LEGACY_GA4_ID : null);
  const gtm = s.gtmId ?? (legado ? process.env.NEXT_PUBLIC_GTM_ID || LEGACY_GTM_ID : null);
  return (
    <>
      <GoogleTagManagerNoScript id={gtm} />
      <GoogleAnalytics id={ga4} />
      <GoogleTagManager id={gtm} />
    </>
  );
}
