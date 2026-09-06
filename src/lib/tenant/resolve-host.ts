/**
 * Descobre QUAL LOJA responde por um endereço (host).
 *
 * Roda no middleware (`src/proxy.ts`), que é Edge -- por isso este arquivo não
 * importa `server-only` nem nada de Node. Também não consulta banco: nesta
 * fase a resolução é 100% por configuração, o que mantém a loja da Juliana no
 * ar mesmo se o banco estiver fora. A consulta ao banco entra quando existir a
 * segunda loja (RPC `resolve_tenant_by_host`, migration 0019).
 */
import { getEnv, getLegacyHostMap } from "@/lib/env";
import { LEGACY_TENANT_ID, LEGACY_TENANT_SLUG } from "@/lib/tenant/legacy";

export type HostKind = "platform" | "subdomain" | "custom" | "legacy";

export type ResolvedTenant = {
  id: string;
  slug: string;
  hostKind: HostKind;
};

export type HostClass =
  | { kind: "platform" }
  | { kind: "subdomain"; slug: string }
  | { kind: "legacy"; host: string }
  | { kind: "custom"; host: string };

/** Tira porta e `www.` -- `www.loja.com.br` e `loja.com.br` são a mesma loja. */
export function normalizeHost(rawHost: string | null | undefined): string {
  if (!rawHost) return "";
  return rawHost.trim().toLowerCase().split(":")[0].replace(/^www\./, "");
}

/**
 * Classifica o host sem consultar nada. `platformDomain` vazio (situação de
 * hoje) significa "ainda não existe plataforma" -- tudo é loja legada.
 */
export function classifyHost(rawHost: string | null | undefined, platformDomain: string): HostClass {
  const host = normalizeHost(rawHost);
  const platform = normalizeHost(platformDomain);

  if (platform && host === platform) return { kind: "platform" };
  if (platform && host.endsWith(`.${platform}`)) {
    const slug = host.slice(0, -(platform.length + 1));
    // `a.b.plataforma.com` não é loja -- só um nível de subdomínio conta.
    if (slug && !slug.includes(".")) return { kind: "subdomain", slug };
    return { kind: "platform" };
  }
  if (!host) return { kind: "legacy", host: "" };
  return { kind: "custom", host };
}

/**
 * Resolve o tenant do host. Nunca devolve null nesta fase: sem plataforma
 * configurada, qualquer host cai na loja legada -- exatamente o comportamento
 * de hoje, só que agora explícito.
 */
export function resolveTenantFromHost(rawHost: string | null | undefined): ResolvedTenant | null {
  const env = getEnv();
  const host = normalizeHost(rawHost);
  const legacyMap = getLegacyHostMap();

  // 1. Host mapeado na configuração -- resposta imediata, sem banco.
  const mapped = legacyMap[host] ?? legacyMap[`www.${host}`];
  if (mapped) return { id: mapped.id, slug: mapped.slug, hostKind: "legacy" };

  const klass = classifyHost(rawHost, env.PLATFORM_DOMAIN);
  if (klass.kind === "platform") return null; // host da plataforma não é loja

  // 2. Sem plataforma configurada (hoje): tudo é a loja legada.
  if (!env.PLATFORM_DOMAIN) {
    return { id: LEGACY_TENANT_ID, slug: env.DEFAULT_TENANT_SLUG || LEGACY_TENANT_SLUG, hostKind: "legacy" };
  }

  // 3. Com plataforma configurada, subdomínio/domínio próprio precisam de
  //    consulta ao banco (F1c/F6). Até lá, só o mapa acima resolve.
  return null;
}
