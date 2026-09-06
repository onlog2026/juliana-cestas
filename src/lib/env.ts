import { z } from "zod";

/**
 * Leitura tipada das variáveis de ambiente da plataforma.
 *
 * Tudo aqui tem default que PRESERVA o comportamento atual da loja da Juliana:
 * sem nenhuma variável nova configurada, o sistema continua single-tenant,
 * apontando para o tenant #1. As fases seguintes vão ligando cada variável.
 *
 * Não importa `server-only` de propósito: o middleware (src/proxy.ts, roda no
 * Edge) também lê daqui. Nada de segredo neste arquivo -- segredos continuam
 * sendo lidos onde são usados (service role, Resend, Asaas).
 */
const schema = z.object({
  /** Domínio da plataforma (landing, cadastro, super admin). Vazio = ainda não existe. */
  PLATFORM_DOMAIN: z.string().trim().toLowerCase().default(""),
  /** Slug da loja usada quando o host não identifica nenhuma (dev, previews, legado). */
  DEFAULT_TENANT_SLUG: z.string().trim().default("juliana-cestas"),
  /** Mapa host -> {id, slug} que resolve sem banco (rede de segurança da loja #1). */
  LEGACY_HOST_TENANT_JSON: z.string().default(""),
  /** URL pública da plataforma (webhooks, links absolutos fora de um host de loja). */
  PLATFORM_PUBLIC_URL: z.string().trim().default(""),
  /** URL pública da loja legada (hoje NEXT_PUBLIC_SITE_URL). */
  NEXT_PUBLIC_SITE_URL: z.string().trim().default("http://localhost:3000"),
});

export type Env = z.infer<typeof schema>;

export type LegacyHostMap = Record<string, { id: string; slug: string }>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse({
    PLATFORM_DOMAIN: process.env.PLATFORM_DOMAIN,
    DEFAULT_TENANT_SLUG: process.env.DEFAULT_TENANT_SLUG,
    LEGACY_HOST_TENANT_JSON: process.env.LEGACY_HOST_TENANT_JSON,
    PLATFORM_PUBLIC_URL: process.env.PLATFORM_PUBLIC_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });
  if (!parsed.success) {
    // Nunca derruba a loja por env mal formada: usa os defaults e avisa no log.
    console.error("[env] variável inválida, usando defaults:", parsed.error.flatten().fieldErrors);
    cached = schema.parse({});
    return cached;
  }
  cached = parsed.data;
  return cached;
}

/** Hosts legados que apontam para um tenant sem consultar o banco. */
export function getLegacyHostMap(): LegacyHostMap {
  const raw = getEnv().LEGACY_HOST_TENANT_JSON;
  if (!raw) return {};
  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== "object") return {};
    const out: LegacyHostMap = {};
    for (const [host, entry] of Object.entries(value as Record<string, unknown>)) {
      if (entry && typeof entry === "object" && "id" in entry && "slug" in entry) {
        const e = entry as { id: unknown; slug: unknown };
        if (typeof e.id === "string" && typeof e.slug === "string") out[host.toLowerCase()] = { id: e.id, slug: e.slug };
      }
    }
    return out;
  } catch {
    console.error("[env] LEGACY_HOST_TENANT_JSON não é JSON válido -- ignorado");
    return {};
  }
}
