import "server-only";

/**
 * Cliente HTTP da API do Asaas — usado SEMPRE com a chave da conta da própria
 * loja (nunca uma chave da plataforma).
 *
 * Tudo que está aqui foi conferido na documentação oficial em 2026-09-06:
 *   * autenticação por header `access_token` (o Asaas NÃO usa `Authorization:
 *     Bearer`) — https://docs.asaas.com/docs/authentication
 *   * base de produção `https://api.asaas.com/v3`
 *     base de sandbox   `https://api-sandbox.asaas.com/v3`
 *   * `POST /v3/customers`               (name e cpfCnpj obrigatórios)
 *   * `POST /v3/payments`                (customer, billingType, value, dueDate)
 *     billingType aceita UNDEFINED | BOLETO | CREDIT_CARD | PIX
 *   * `GET  /v3/payments/{id}`
 *   * `GET  /v3/payments/{id}/pixQrCode` (devolve encodedImage, payload, expirationDate)
 *   * `POST /v3/webhooks`                (name, url, email, enabled, interrupted,
 *                                         apiVersion, authToken, sendType, events)
 *   * `DELETE /v3/webhooks/{id}`
 *   * `GET  /v3/myAccount/commercialInfo` (401 "A chave de API fornecida é
 *     inválida" quando a chave não presta — é o que usamos para validar)
 *
 * DUAS REGRAS INEGOCIÁVEIS DESTE ARQUIVO:
 *
 * 1. A CHAVE NUNCA APARECE. Nem em log, nem em mensagem de erro, nem em
 *    retorno. O Asaas às vezes devolve a chave dentro do texto do erro; por
 *    isso TODA saída passa por `redigir()` antes de virar mensagem. Existe
 *    teste unitário provando isso (tests/unit/asaas-client.test.ts).
 *
 * 2. A RESPOSTA É LIDA COMO TEXTO ANTES DE VIRAR JSON. Em alguns erros
 *    (manutenção, WAF, 502 do proxy) o Asaas devolve HTML; um `.json()` direto
 *    estoura com "Unexpected token <" e ninguém entende o que aconteceu.
 */

export type AsaasEnvironment = "sandbox" | "production";

export const ASAAS_BASE_URL: Record<AsaasEnvironment, string> = {
  sandbox: "https://api-sandbox.asaas.com/v3",
  production: "https://api.asaas.com/v3",
};

/**
 * Valor mínimo de cobrança, em centavos.
 *
 * É a mesma trava que a tabela `orders` já tem no banco desde a 0004
 * (`check (total_cents >= 500)`). Recusamos ANTES de chamar a API para o
 * cliente ver uma frase em português em vez de um erro do gateway.
 */
export const MIN_PAYMENT_CENTS = 500;

export type AsaasBillingType = "PIX" | "CREDIT_CARD" | "BOLETO";

export class AsaasError extends Error {
  readonly status: number;
  /** Código do Asaas quando ele manda (`errors[0].code`). */
  readonly code: string | null;

  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.name = "AsaasError";
    this.status = status;
    this.code = code;
  }
}

/** Trechos que têm cara de chave do Asaas, mesmo vindo de campo inocente. */
const PADRAO_CHAVE = /\$aact_[A-Za-z0-9+/=_$-]{6,}/g;
const MASCARA = "[chave omitida]";

/**
 * Tira a chave de qualquer texto que vá para log, erro ou tela.
 * Remove a chave EXATA desta conexão e, por cima, qualquer coisa com formato
 * de chave do Asaas (uma segunda chave da lojista, por exemplo).
 */
export function redigir(texto: string, apiKey?: string): string {
  let saida = texto;
  if (apiKey && apiKey.length >= 8) {
    saida = saida.split(apiKey).join(MASCARA);
  }
  PADRAO_CHAVE.lastIndex = 0;
  return saida.replace(PADRAO_CHAVE, MASCARA);
}

/** Centavos → reais como o Asaas espera (`value` é decimal, não centavos). */
export function centsToReais(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

/** Reais que o Asaas devolve → centavos (o banco daqui é centavos em tudo). */
export function reaisToCents(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

type CorpoErro = { errors?: Array<{ code?: string; description?: string }> };

/**
 * Traduz o corpo de erro do Asaas numa frase em português, já redigida.
 * Quando o corpo não é JSON (HTML de manutenção, por exemplo), devolve uma
 * frase genérica em vez de vazar o HTML inteiro na tela.
 */
function mensagemDoErro(status: number, texto: string, apiKey: string): { message: string; code: string | null } {
  const limpo = redigir(texto, apiKey).trim();

  let corpo: CorpoErro | null = null;
  try {
    corpo = limpo ? (JSON.parse(limpo) as CorpoErro) : null;
  } catch {
    corpo = null;
  }

  const primeiro = corpo?.errors?.[0];
  if (primeiro?.description) {
    return { message: primeiro.description, code: primeiro.code ?? null };
  }

  if (status === 401 || status === 403) {
    return { message: "A chave de API do Asaas foi recusada. Confira se ela é da conta certa e do ambiente certo.", code: null };
  }
  if (status === 404) {
    return { message: "O Asaas não encontrou esse registro.", code: null };
  }
  if (status === 429) {
    return { message: "O Asaas recebeu pedidos demais agora. Tente de novo em alguns segundos.", code: null };
  }
  if (status >= 500) {
    return { message: "O Asaas está indisponível no momento. Tente de novo em alguns minutos.", code: null };
  }
  return { message: `O Asaas recusou a operação (HTTP ${status}).`, code: null };
}

export type AsaasCustomerInput = {
  name: string;
  cpfCnpj: string;
  email?: string | null;
  mobilePhone?: string | null;
  externalReference?: string | null;
};

export type AsaasCustomer = { id: string; name?: string; cpfCnpj?: string };

export type AsaasPaymentInput = {
  customerId: string;
  billingType: AsaasBillingType;
  /** Em CENTAVOS. A conversão para reais acontece aqui dentro, num lugar só. */
  amountCents: number;
  /** "YYYY-MM-DD". */
  dueDate: string;
  description?: string;
  /** Id do pedido — é o que religa o webhook ao pedido se o id do Asaas se perder. */
  externalReference?: string;
};

export type AsaasPayment = {
  id: string;
  status: string;
  value?: number;
  billingType?: string;
  dueDate?: string;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
  paymentDate?: string | null;
  externalReference?: string | null;
  [k: string]: unknown;
};

export type AsaasPixQrCode = {
  /** Imagem do QR Code em base64 (sem o prefixo `data:`). */
  encodedImage: string;
  /** O "copia e cola". */
  payload: string;
  expirationDate?: string | null;
};

export type AsaasWebhookInput = {
  name: string;
  url: string;
  email: string;
  authToken: string;
  events: string[];
};

export type AsaasWebhook = { id: string; url?: string; enabled?: boolean; hasAuthToken?: boolean };

export type AsaasAccount = {
  name: string | null;
  email: string | null;
  cpfCnpj: string | null;
  /** APPROVED | PENDING | DENIED | AWAITING_ACTION_AUTHORIZATION */
  status: string | null;
};

/**
 * Eventos que assinamos ao registrar o webhook. Deliberadamente curto: só o
 * que muda a situação de um pedido. Assinar tudo enche a fila do Asaas de
 * evento que este sistema ignora — e fila cheia de erro é fila interrompida.
 */
export const ASAAS_WEBHOOK_EVENTS = [
  "PAYMENT_RECEIVED",
  "PAYMENT_CONFIRMED",
  "PAYMENT_OVERDUE",
  "PAYMENT_REFUNDED",
  "PAYMENT_DELETED",
  "PAYMENT_CHARGEBACK_REQUESTED",
  "PAYMENT_CHARGEBACK_DISPUTE",
  "PAYMENT_AWAITING_CHARGEBACK_REVERSAL",
];

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type AsaasClientOptions = {
  apiKey: string;
  environment: AsaasEnvironment;
  /** Injetável só para teste. Em produção é sempre o `fetch` global. */
  fetchImpl?: FetchLike;
  /** Tempo máximo por chamada. Um gateway pendurado não pode pendurar a loja. */
  timeoutMs?: number;
};

export type AsaasClient = ReturnType<typeof createAsaasClient>;

export function createAsaasClient(options: AsaasClientOptions) {
  const { apiKey, environment } = options;
  const doFetch: FetchLike = options.fetchImpl ?? ((input, init) => fetch(input, init));
  const timeoutMs = options.timeoutMs ?? 20_000;
  const base = ASAAS_BASE_URL[environment];

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${base}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
      res = await doFetch(url, {
        method,
        headers: {
          // Confirmado na doc: header `access_token`, nunca Bearer.
          access_token: apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "loja-online/1.0",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
        cache: "no-store",
      });
    } catch (e) {
      // O erro de rede pode carregar a URL; nunca carrega a chave (ela vai em
      // header), mas passa pelo redator do mesmo jeito — custa nada.
      const detalhe = e instanceof Error ? redigir(e.message, apiKey) : "falha de rede";
      throw new AsaasError(`Não foi possível falar com o Asaas (${detalhe}).`, 0);
    } finally {
      clearTimeout(timer);
    }

    // Lê SEMPRE como texto primeiro. O Asaas devolve HTML em alguns erros e
    // `.json()` direto estouraria com uma mensagem que não ajuda ninguém.
    const texto = await res.text();

    if (!res.ok) {
      const { message, code } = mensagemDoErro(res.status, texto, apiKey);
      throw new AsaasError(message, res.status, code);
    }

    if (!texto) return {} as T;

    try {
      return JSON.parse(texto) as T;
    } catch {
      throw new AsaasError(
        "O Asaas respondeu num formato inesperado (não era JSON). Tente de novo em alguns minutos.",
        res.status
      );
    }
  }

  return {
    environment,

    /**
     * Valida a chave de verdade — é o que `connectAccount` chama antes de
     * gravar qualquer coisa. Chave errada estoura AsaasError 401 aqui.
     */
    async getAccount(): Promise<AsaasAccount> {
      const raw = await request<Record<string, unknown>>("GET", "/myAccount/commercialInfo");
      const texto = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
      return {
        name: texto(raw.name) ?? texto(raw.companyName) ?? texto(raw.tradingName),
        email: texto(raw.email),
        cpfCnpj: texto(raw.cpfCnpj),
        status: texto(raw.commercialInfoStatus) ?? texto(raw.status),
      };
    },

    async createCustomer(input: AsaasCustomerInput): Promise<AsaasCustomer> {
      return request<AsaasCustomer>("POST", "/customers", {
        name: input.name,
        cpfCnpj: input.cpfCnpj.replace(/\D/g, ""),
        email: input.email || undefined,
        mobilePhone: input.mobilePhone ? input.mobilePhone.replace(/\D/g, "") : undefined,
        externalReference: input.externalReference || undefined,
      });
    },

    /**
     * Cria a cobrança. O valor chega em CENTAVOS e é convertido aqui — nenhum
     * outro lugar do sistema pode fazer essa conta (foi assim que, no Agentop,
     * duas unidades de dinheiro acabaram na mesma tela).
     */
    async createPayment(input: AsaasPaymentInput): Promise<AsaasPayment> {
      if (!Number.isInteger(input.amountCents) || input.amountCents < MIN_PAYMENT_CENTS) {
        throw new AsaasError(
          "O valor mínimo para cobrança é R$ 5,00. Ajuste o pedido antes de gerar o pagamento.",
          422,
          "valor_minimo"
        );
      }
      return request<AsaasPayment>("POST", "/payments", {
        customer: input.customerId,
        billingType: input.billingType,
        value: centsToReais(input.amountCents),
        dueDate: input.dueDate,
        description: input.description || undefined,
        externalReference: input.externalReference || undefined,
      });
    },

    async getPayment(paymentId: string): Promise<AsaasPayment> {
      return request<AsaasPayment>("GET", `/payments/${encodeURIComponent(paymentId)}`);
    },

    async getPixQrCode(paymentId: string): Promise<AsaasPixQrCode> {
      return request<AsaasPixQrCode>("GET", `/payments/${encodeURIComponent(paymentId)}/pixQrCode`);
    },

    async createWebhook(input: AsaasWebhookInput): Promise<AsaasWebhook> {
      return request<AsaasWebhook>("POST", "/webhooks", {
        name: input.name,
        url: input.url,
        email: input.email,
        enabled: true,
        interrupted: false,
        apiVersion: 3,
        // 32 a 255 caracteres (exigência do Asaas). Chega de volta pra nós no
        // header `asaas-access-token` de toda notificação.
        authToken: input.authToken,
        // SEQUENTIALLY preserva a ordem dos eventos. Evento fora de ordem já
        // custou incidente documentado (um OVERDUE bloqueou cliente em dia).
        sendType: "SEQUENTIALLY",
        events: input.events,
      });
    },

    async deleteWebhook(webhookId: string): Promise<{ deleted: boolean }> {
      return request<{ deleted: boolean }>("DELETE", `/webhooks/${encodeURIComponent(webhookId)}`);
    },
  };
}
