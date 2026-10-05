"use client";

import { usePathname } from "next/navigation";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { GoogleTagManager } from "@/components/analytics/google-tag-manager";

/** Painéis e lojas de demonstração não entram na medição do site de vendas. */
const SEM_MEDICAO = ["/super", "/admin", "/demo"];

/**
 * Medição PRÓPRIA da plataforma. Os IDs vêm de `PLATFORM_GA4_ID` / `PLATFORM_GTM_ID` (lidos no servidor e
 * passados aqui); sem ID, não injeta nada. Nunca usa o ID de nenhuma loja.
 */
export function MedicaoPlataforma({ ga4Id, gtmId }: { ga4Id: string | null; gtmId: string | null }) {
  const pathname = usePathname() ?? "";
  if (SEM_MEDICAO.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;
  if (!ga4Id && !gtmId) return null;
  return (
    <>
      <GoogleAnalytics id={ga4Id} />
      <GoogleTagManager id={gtmId} />
    </>
  );
}
