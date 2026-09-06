import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { getEnv } from "@/lib/env";
import { LEGACY_TENANT_ID, LEGACY_TENANT_SLUG } from "@/lib/tenant/legacy";
import type { HostKind } from "@/lib/tenant/resolve-host";

export type TenantContext = {
  id: string;
  slug: string;
  hostKind: HostKind;
};

export const TENANT_HEADER_ID = "x-tenant-id";
export const TENANT_HEADER_SLUG = "x-tenant-slug";
export const TENANT_HEADER_HOST_KIND = "x-host-kind";

/**
 * Qual loja está respondendo esta requisição.
 *
 * Enquanto `PLATFORM_DOMAIN` estiver vazio (situação de hoje, loja única),
 * responde a loja legada SEM ler `headers()` -- de propósito: ler headers
 * tornaria toda página dinâmica e a home perderia a geração estática. Quando a
 * plataforma existir, passa a ler o que o middleware resolveu.
 *
 * `cache()` garante uma resolução por requisição.
 */
export const getTenant = cache(async (): Promise<TenantContext> => {
  const env = getEnv();

  if (!env.PLATFORM_DOMAIN) {
    return {
      id: LEGACY_TENANT_ID,
      slug: env.DEFAULT_TENANT_SLUG || LEGACY_TENANT_SLUG,
      hostKind: "legacy",
    };
  }

  const h = await headers();
  const id = h.get(TENANT_HEADER_ID);
  const slug = h.get(TENANT_HEADER_SLUG);
  const hostKind = (h.get(TENANT_HEADER_HOST_KIND) as HostKind | null) ?? "legacy";

  if (!id || !slug) {
    // Middleware não resolveu (rota fora do matcher, ou host desconhecido).
    // Cair na loja legada é melhor que derrubar a página -- e o header sempre
    // vence quando existe, então isto nunca "rouba" a loja de outro tenant.
    return { id: LEGACY_TENANT_ID, slug: env.DEFAULT_TENANT_SLUG || LEGACY_TENANT_SLUG, hostKind: "legacy" };
  }

  return { id, slug, hostKind };
});

/** Atalho -- é o que quase toda página/serviço precisa. */
export async function getTenantId(): Promise<string> {
  return (await getTenant()).id;
}
