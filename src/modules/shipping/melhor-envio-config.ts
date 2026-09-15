import "server-only";
import {
  createMelhorEnvioClient,
  type MelhorEnvioClient,
  type MelhorEnvioEnvironment,
} from "@/modules/shipping/melhor-envio-client";

/**
 * Conexão com a Melhor Envio -- cotação de frete por transportadora pra fora
 * da área de entrega local (Fase 2 do frete). Mesmo padrão env-gated do Asaas
 * e da Evolution: sem o token, `getMelhorEnvioClient()` devolve `null` e o
 * checkout simplesmente não oferece cotação de transportadora (cai no "não
 * atendido + WhatsApp" de sempre) -- nada quebra.
 *
 * Env vars (na Vercel, do projeto):
 *   MELHOR_ENVIO_TOKEN  -- token gerado no painel da conta (Gerenciar > Tokens)
 *   MELHOR_ENVIO_ENV    -- "sandbox" (padrão) ou "production"
 */
export type MelhorEnvioConfig = {
  token: string;
  environment: MelhorEnvioEnvironment;
  configured: boolean;
};

export function getMelhorEnvioConfig(): MelhorEnvioConfig {
  const token = (process.env.MELHOR_ENVIO_TOKEN ?? "").trim();
  const environment: MelhorEnvioEnvironment =
    (process.env.MELHOR_ENVIO_ENV ?? "sandbox").trim().toLowerCase() === "production" ? "production" : "sandbox";
  return { token, environment, configured: token.length >= 10 };
}

/** O cliente da Melhor Envio, ou `null` se o token ainda não foi configurado. */
export function getMelhorEnvioClient(): MelhorEnvioClient | null {
  const cfg = getMelhorEnvioConfig();
  if (!cfg.configured) return null;
  return createMelhorEnvioClient({ token: cfg.token, environment: cfg.environment });
}
