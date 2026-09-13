import "server-only";
import { createAsaasClient, type AsaasClient, type AsaasEnvironment } from "@/modules/payments/asaas-client";

/**
 * Conexão com o Asaas da PLATAFORMA — a conta que cobra a licença dos lojistas
 * (diferente da conta de cada loja, que recebe dos clientes dela).
 *
 * A chave vive SÓ no servidor, lida de `process.env` aqui (nunca em `env.ts`,
 * que não guarda segredo). Enquanto a chave não estiver configurada, tudo roda
 * em "modo config pendente": `getPlatformAsaasClient()` devolve `null`, a tela
 * de assinatura mostra o aviso e NADA quebra. É o que deixa o motor "pronto"
 * antes de o dono colar a chave na Vercel.
 *
 * Env vars (na Vercel, do projeto):
 *   PLATFORM_ASAAS_API_KEY        — a chave da conta Asaas da plataforma
 *   PLATFORM_ASAAS_ENV            — "sandbox" (padrão) ou "production"
 *   PLATFORM_ASAAS_WEBHOOK_TOKEN  — segredo que valida os webhooks da assinatura
 */
export type PlatformAsaasConfig = {
  apiKey: string;
  environment: AsaasEnvironment;
  webhookToken: string;
  /** true quando há chave configurada (sai do modo config pendente). */
  configured: boolean;
};

export function getPlatformAsaasConfig(): PlatformAsaasConfig {
  const apiKey = (process.env.PLATFORM_ASAAS_API_KEY ?? "").trim();
  const environment: AsaasEnvironment =
    (process.env.PLATFORM_ASAAS_ENV ?? "sandbox").trim().toLowerCase() === "production"
      ? "production"
      : "sandbox";
  const webhookToken = (process.env.PLATFORM_ASAAS_WEBHOOK_TOKEN ?? "").trim();
  return { apiKey, environment, webhookToken, configured: apiKey.length >= 8 };
}

/** O cliente Asaas da plataforma, ou `null` se a chave ainda não foi configurada. */
export function getPlatformAsaasClient(): AsaasClient | null {
  const cfg = getPlatformAsaasConfig();
  if (!cfg.configured) return null;
  return createAsaasClient({ apiKey: cfg.apiKey, environment: cfg.environment });
}
