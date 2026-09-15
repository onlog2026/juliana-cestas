import "server-only";

/**
 * Cliente HTTP da Melhor Envio -- calcula frete de transportadora (Correios e
 * outras) pra fora da área de entrega local. Mesmo padrão do `asaas-client.ts`
 * e do `whatsapp-client.ts`: chave nunca aparece, resposta lida como texto
 * antes de virar JSON, timeout via AbortController.
 *
 * Confirmado na documentação oficial (docs.melhorenvio.com.br, 2026-09-15):
 *   * `POST /api/v2/me/shipment/calculate`
 *   * header `Authorization: Bearer <token>` (token gerado no painel da conta,
 *     sem precisar de contrato direto com transportadora)
 *   * sandbox: https://sandbox.melhorenvio.com.br
 *     produção: https://melhorenvio.com.br
 *   * body: `from.postal_code`, `to.postal_code`, `package.weight` (kg),
 *     `package.height/width/length` (cm)
 *   * resposta: array de cotações; cada item pode vir com campo `error`
 *     (serviço indisponível pra essa rota/pacote) -- esses são ignorados.
 *
 * NÃO testado ao vivo (sem token de teste disponível nesta sessão) -- por
 * isso o parsing é defensivo: qualquer formato inesperado descarta o item em
 * vez de quebrar a cotação inteira. Testar com token sandbox antes de confiar
 * o valor mostrado ao cliente.
 */

export class MelhorEnvioError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "MelhorEnvioError";
    this.status = status;
  }
}

const MASCARA = "[token omitido]";

export function redigirMelhorEnvio(texto: string, token?: string): string {
  if (!token || token.length < 8) return texto;
  return texto.split(token).join(MASCARA);
}

export type MelhorEnvioEnvironment = "sandbox" | "production";

export const MELHOR_ENVIO_BASE_URL: Record<MelhorEnvioEnvironment, string> = {
  sandbox: "https://sandbox.melhorenvio.com.br",
  production: "https://melhorenvio.com.br",
};

export type ShippingQuoteInput = {
  fromCep: string;
  toCep: string;
  weightGrams: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
};

export type CarrierOption = {
  /** Id do serviço na Melhor Envio (não usado pra fechar compra nesta fase). */
  id: string;
  /** Ex.: "PAC", "SEDEX", "Jadlog .Package". */
  name: string;
  companyName: string | null;
  priceCents: number;
  /** Prazo em dias úteis, ou null se a API não informou. */
  deliveryDays: number | null;
};

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type MelhorEnvioClientOptions = {
  token: string;
  environment: MelhorEnvioEnvironment;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
};

export type MelhorEnvioClient = ReturnType<typeof createMelhorEnvioClient>;

/** "R$ 23,50" | "23.50" | 23.5 -> 2350 centavos. null se não der pra entender. */
function priceToCents(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value * 100);
  if (typeof value === "string") {
    const n = Number.parseFloat(value.replace(",", "."));
    if (Number.isFinite(n)) return Math.round(n * 100);
  }
  return null;
}

function parseDeliveryDays(item: Record<string, unknown>): number | null {
  const raw = item.delivery_time ?? item.custom_delivery_time ?? item.deliveryTime;
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.round(raw);
  if (typeof raw === "string") {
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export function createMelhorEnvioClient(options: MelhorEnvioClientOptions) {
  const { token, environment } = options;
  const doFetch: FetchLike = options.fetchImpl ?? ((input, init) => fetch(input, init));
  const timeoutMs = options.timeoutMs ?? 15_000;
  const base = MELHOR_ENVIO_BASE_URL[environment];

  return {
    environment,

    /**
     * Cota o frete pra um pacote entre dois CEPs. Nunca lança por causa de um
     * item malformado no array de resposta -- descarta o item e segue com os
     * demais. Lança `MelhorEnvioError` só em falha de rede/timeout/HTTP não-2xx.
     */
    async calculate(input: ShippingQuoteInput): Promise<CarrierOption[]> {
      const url = `${base}/api/v2/me/shipment/calculate`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      let res: Response;
      try {
        res = await doFetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            // A Melhor Envio exige um User-Agent identificável (app + e-mail de contato).
            "User-Agent": "Juliana Cestas (contato@julianacesta.com.br)",
          },
          body: JSON.stringify({
            from: { postal_code: input.fromCep },
            to: { postal_code: input.toCep },
            package: {
              weight: input.weightGrams / 1000,
              height: input.heightCm,
              width: input.widthCm,
              length: input.lengthCm,
            },
          }),
          signal: controller.signal,
          cache: "no-store",
        });
      } catch (e) {
        const detalhe = e instanceof Error ? redigirMelhorEnvio(e.message, token) : "falha de rede";
        throw new MelhorEnvioError(`Não foi possível falar com a Melhor Envio (${detalhe}).`, 0);
      } finally {
        clearTimeout(timer);
      }

      const texto = await res.text();

      if (!res.ok) {
        const limpo = redigirMelhorEnvio(texto, token).slice(0, 300);
        throw new MelhorEnvioError(`A Melhor Envio recusou a cotação (HTTP ${res.status}). ${limpo}`.trim(), res.status);
      }

      let parsed: unknown;
      try {
        parsed = texto ? JSON.parse(texto) : [];
      } catch {
        throw new MelhorEnvioError("A Melhor Envio respondeu num formato inesperado (não era JSON).", res.status);
      }

      if (!Array.isArray(parsed)) return [];

      const options: CarrierOption[] = [];
      for (const raw of parsed) {
        if (!raw || typeof raw !== "object") continue;
        const item = raw as Record<string, unknown>;
        if (item.error) continue; // serviço indisponível pra essa rota/pacote
        const priceCents = priceToCents(item.price);
        const name = typeof item.name === "string" ? item.name : null;
        if (priceCents == null || !name) continue; // item malformado -- descarta, não quebra o resto
        const company = item.company as Record<string, unknown> | undefined;
        options.push({
          id: String(item.id ?? name),
          name,
          companyName: typeof company?.name === "string" ? company.name : null,
          priceCents,
          deliveryDays: parseDeliveryDays(item),
        });
      }
      return options.sort((a, b) => a.priceCents - b.priceCents);
    },
  };
}
