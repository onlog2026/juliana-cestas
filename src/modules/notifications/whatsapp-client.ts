import "server-only";

/**
 * Cliente HTTP da Evolution API — usado para mandar o aviso de pedido novo pro
 * WhatsApp da loja. Segue o MESMO padrão do `asaas-client.ts` (chave nunca
 * aparece, resposta lida como texto antes de virar JSON, timeout via
 * AbortController) porque é a mesma classe de problema: falar com uma API
 * externa sem travar a loja quando ela estiver fora do ar.
 *
 * Confirmado na doc oficial da Evolution API v2 (2026-09-15):
 *   * `POST /message/sendText/{instance}`
 *   * header `apikey` (não é `Authorization: Bearer`)
 *   * body `{ number, text }` (number = dígitos com DDI, ex.: 5561999999999)
 *
 * REGRA INEGOCIÁVEL: a apikey NUNCA aparece em log, erro ou retorno. Provado
 * em tests/unit/whatsapp-client.test.ts.
 */

export class WhatsappError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "WhatsappError";
    this.status = status;
  }
}

const MASCARA = "[chave omitida]";

/** Tira a apikey de qualquer texto que vá para log, erro ou tela. */
export function redigirWhatsapp(texto: string, apiKey?: string): string {
  if (!apiKey || apiKey.length < 6) return texto;
  return texto.split(apiKey).join(MASCARA);
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type WhatsappClientOptions = {
  /** URL base da instância Evolution, sem barra no fim (ex.: https://evo.exemplo.com.br). */
  baseUrl: string;
  apiKey: string;
  instance: string;
  /** Injetável só para teste. Em produção é sempre o `fetch` global. */
  fetchImpl?: FetchLike;
  /** Tempo máximo por chamada. Um servidor pendurado não pode pendurar o pedido. */
  timeoutMs?: number;
};

export type WhatsappClient = ReturnType<typeof createWhatsappClient>;

export function createWhatsappClient(options: WhatsappClientOptions) {
  const { apiKey, instance } = options;
  const base = options.baseUrl.replace(/\/+$/, "");
  const doFetch: FetchLike = options.fetchImpl ?? ((input, init) => fetch(input, init));
  const timeoutMs = options.timeoutMs ?? 15_000;

  return {
    /**
     * Envia um texto simples para `number` (dígitos com DDI, sem `+`/espaços).
     * Lança `WhatsappError` em qualquer falha (rede, timeout, HTTP não-2xx).
     */
    async sendText(number: string, text: string): Promise<void> {
      const url = `${base}/message/sendText/${instance}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      let res: Response;
      try {
        res = await doFetch(url, {
          method: "POST",
          headers: {
            apikey: apiKey,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ number, text }),
          signal: controller.signal,
          cache: "no-store",
        });
      } catch (e) {
        const detalhe = e instanceof Error ? redigirWhatsapp(e.message, apiKey) : "falha de rede";
        throw new WhatsappError(`Não foi possível falar com a Evolution API (${detalhe}).`, 0);
      } finally {
        clearTimeout(timer);
      }

      // Lê SEMPRE como texto primeiro -- um proxy/WAF pode devolver HTML em
      // erro, e `.json()` direto estouraria com mensagem que não ajuda ninguém.
      const texto = await res.text();

      if (!res.ok) {
        const limpo = redigirWhatsapp(texto, apiKey).slice(0, 300);
        throw new WhatsappError(
          `A Evolution API recusou o envio (HTTP ${res.status}). ${limpo}`.trim(),
          res.status
        );
      }
    },
  };
}
