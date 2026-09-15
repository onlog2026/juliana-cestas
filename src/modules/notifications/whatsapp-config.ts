import "server-only";
import { createWhatsappClient, type WhatsappClient } from "@/modules/notifications/whatsapp-client";

/**
 * Conexão com a Evolution API da PLATAFORMA -- um número dedicado que manda o
 * aviso de "pedido novo" pro WhatsApp de cada loja. NÃO é o número da loja (que
 * só recebe); é um remetente único, compartilhado por todas as lojas.
 *
 * A chave vive SÓ no servidor, lida de `process.env` aqui (nunca em `env.ts`,
 * que não guarda segredo). Enquanto não estiver configurada, tudo roda em
 * "modo config pendente": `getWhatsappClient()` devolve `null`, o pedido é
 * criado normalmente e o aviso fica registrado como pendente no outbox. É o
 * que deixa a feature pronta antes de o dono subir a Evolution e colar as
 * variáveis na Vercel -- mesmo padrão de `asaas-platform.ts`.
 *
 * Env vars (na Vercel, do projeto):
 *   EVOLUTION_API_URL   -- URL base da instância (ex.: https://evo.exemplo.com.br)
 *   EVOLUTION_API_KEY   -- apikey da instância
 *   EVOLUTION_INSTANCE  -- nome da instância conectada ao número remetente
 */
export type WhatsappConfig = {
  baseUrl: string;
  apiKey: string;
  instance: string;
  /** true quando as três variáveis estão configuradas (sai do modo config pendente). */
  configured: boolean;
};

export function getWhatsappConfig(): WhatsappConfig {
  const baseUrl = (process.env.EVOLUTION_API_URL ?? "").trim();
  const apiKey = (process.env.EVOLUTION_API_KEY ?? "").trim();
  const instance = (process.env.EVOLUTION_INSTANCE ?? "").trim();
  return {
    baseUrl,
    apiKey,
    instance,
    configured: baseUrl.length > 0 && apiKey.length >= 6 && instance.length > 0,
  };
}

/** O cliente da Evolution API, ou `null` se ainda não foi configurado. */
export function getWhatsappClient(): WhatsappClient | null {
  const cfg = getWhatsappConfig();
  if (!cfg.configured) return null;
  return createWhatsappClient({ baseUrl: cfg.baseUrl, apiKey: cfg.apiKey, instance: cfg.instance });
}
