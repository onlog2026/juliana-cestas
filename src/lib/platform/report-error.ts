import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Registrador de erros da plataforma — o que alimenta a tela /super/erros.
 *
 * Duas regras mandam em tudo o que está aqui, e as duas nasceram de incidente
 * real documentado em docs/SUPER-ADMIN-SPEC.md:
 *
 *  1. **Isto nunca lança.** Um erro dentro do registrador de erros não pode
 *     derrubar a operação que estava sendo feita. Se um cliente está pagando e
 *     o registro do erro falha, o pagamento continua; o registro é que se
 *     perde. Por isso TODA a função vive dentro de try/catch e, no pior caso,
 *     escreve no `console.error` e segue.
 *
 *  2. **Isto nunca grava segredo.** Na spec, "número de cartão foi parar no
 *     log" está listado entre os erros que custaram incidente. O `detail` é
 *     sanitizado antes de sair daqui: campo cujo NOME parece segredo é
 *     apagado, e valor que TEM CARA de segredo (chave do Asaas, token JWT,
 *     `Bearer ...`) é mascarado mesmo que o campo tenha nome inocente.
 *
 * Como usar (é isto que outros módulos vão chamar):
 *
 * ```ts
 * import { reportError } from "@/lib/platform/report-error";
 *
 * try {
 *   await asaas.criarCobranca(pedido);
 * } catch (e) {
 *   await reportError({
 *     tenantId: pedido.tenantId,
 *     module: "pagamento",
 *     action: "criar_cobranca",
 *     level: "critical",
 *     message: "Não foi possível criar a cobrança no Asaas.",
 *     detail: { pedidoId: pedido.id, erro: e },
 *   });
 *   throw e; // o registrador NÃO decide o destino da operação
 * }
 * ```
 *
 * Nunca use `await reportError(...)` como se ele pudesse falhar: ele não
 * devolve erro nem lança. E nunca condicione a operação ao sucesso dele.
 */

/** Gravidade. Igual ao CHECK da tabela `app_errors` (migração 0026). */
export type ErrorLevel = "warning" | "error" | "critical";

export type ReportErrorInput = {
  /** Loja afetada. `undefined`/`null` = erro da plataforma, sem loja. */
  tenantId?: string | null;
  /** Módulo onde aconteceu: "pagamento", "email", "checkout", "entregas"… */
  module: string;
  /** O que estava sendo feito: "criar_cobranca", "enviar_confirmacao"… */
  action: string;
  level: ErrorLevel;
  /** Frase curta em português, para quem não é dev ler na tela. */
  message: string;
  /** Contexto livre. Passa pela sanitização antes de ser gravado. */
  detail?: unknown;
};

// ── Limites de tamanho ──────────────────────────────────────────────────────
// Um `detail` gigante enche a tabela e não ajuda ninguém a entender nada.
const MAX_TEXTO = 400; // caracteres por string dentro do detail
const MAX_MENSAGEM = 500; // caracteres da mensagem principal
const MAX_CHAVES = 40; // campos por objeto
const MAX_ITENS = 20; // itens por lista
const MAX_PROFUNDIDADE = 5; // níveis de objeto aninhado

/**
 * Nome de campo que denuncia segredo. Case-insensitive e por PEDAÇO do nome,
 * então pega `apiKey`, `API_KEY`, `x-api-key`, `accessToken`, `client_secret`,
 * `Authorization`, `senha`…
 *
 * De propósito é largo demais: mascarar um campo inocente por engano custa uma
 * informação de debug; deixar uma chave vazar custa a conta inteira.
 */
const NOME_SENSIVEL = /(key|token|secret|senha|password|passwd|authorization|credential|cookie|session|assinatura_hmac|signature)/i;

/**
 * Valor que TEM CARA de segredo, mesmo em campo de nome inocente — o caso
 * clássico é a chave vir grudada dentro da mensagem de erro do gateway.
 */
const VALORES_SECRETOS: RegExp[] = [
  /\$aact_[A-Za-z0-9+/=_-]{10,}/g, // chave do Asaas
  /\bsk-[A-Za-z0-9_-]{12,}/g, // OpenAI e parecidos
  /\b[a-z]{2}_(live|test)_[A-Za-z0-9]{8,}/g, // sk_live_, pk_test_…
  /\bsbp_[A-Za-z0-9]{16,}/g, // Supabase
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{4,}/g, // JWT
  /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/gi, // cabeçalho Authorization inteiro
  // Sequência longa de dígitos = provável número de cartão. Começa em 14 de
  // propósito: 13 dígitos é o tamanho de um timestamp em milissegundos, e
  // mascarar todo timestamp atrapalharia o debug sem proteger ninguém.
  /\b\d{14,19}\b/g,
];

const REMOVIDO = "[removido: parece um segredo]";

/** Mascara trechos com cara de segredo dentro de um texto qualquer. */
function mascararTexto(valor: string): string {
  let saida = valor;
  for (const padrao of VALORES_SECRETOS) {
    // `lastIndex` de regex global é estado: zera antes de usar.
    padrao.lastIndex = 0;
    saida = saida.replace(padrao, REMOVIDO);
  }
  return saida;
}

function cortar(valor: string, maximo: number): string {
  if (valor.length <= maximo) return valor;
  return `${valor.slice(0, maximo)}… (texto cortado, ${valor.length} caracteres no total)`;
}

/** Texto seguro: primeiro mascara segredo, só depois corta. */
function textoSeguro(valor: string, maximo = MAX_TEXTO): string {
  return cortar(mascararTexto(valor), maximo);
}

/**
 * Deixa o `detail` pronto para ir ao banco: sem segredo, sem tamanho absurdo,
 * sem referência circular e sem tipo que o JSON não aguenta.
 *
 * Exportada porque é ela que o teste unitário prova — a parte mais importante
 * deste arquivo é o que ela NÃO deixa passar.
 */
export function sanitizeDetail(detail: unknown, profundidade = 0): unknown {
  if (detail === null || detail === undefined) return null;

  const tipo = typeof detail;

  if (tipo === "string") return textoSeguro(detail as string);
  if (tipo === "number") return Number.isFinite(detail as number) ? detail : String(detail);
  if (tipo === "boolean") return detail;
  if (tipo === "bigint") return String(detail);
  // Função, símbolo: não têm representação útil em JSON.
  if (tipo === "function" || tipo === "symbol") return `[${tipo}]`;

  if (detail instanceof Date) {
    return Number.isNaN(detail.getTime()) ? "[data inválida]" : detail.toISOString();
  }

  // Erro: guarda nome, mensagem e a primeira parte da pilha (que ajuda a achar
  // o arquivo) — tudo passando pela máscara, porque mensagem de gateway
  // frequentemente carrega a chave usada na chamada.
  if (detail instanceof Error) {
    return {
      nome: detail.name,
      mensagem: textoSeguro(detail.message),
      pilha: detail.stack ? textoSeguro(detail.stack, 800) : null,
    };
  }

  if (profundidade >= MAX_PROFUNDIDADE) return "[aninhado demais]";

  if (Array.isArray(detail)) {
    const itens = detail.slice(0, MAX_ITENS).map((item) => sanitizeDetail(item, profundidade + 1));
    if (detail.length > MAX_ITENS) itens.push(`… mais ${detail.length - MAX_ITENS} item(ns) não registrados`);
    return itens;
  }

  if (tipo === "object") {
    const entrada = detail as Record<string, unknown>;
    const saida: Record<string, unknown> = {};
    let contador = 0;

    for (const chave of Object.keys(entrada)) {
      if (contador >= MAX_CHAVES) {
        saida["…"] = "mais campos não registrados";
        break;
      }
      contador += 1;

      // O coração da regra: nome de campo sensível NUNCA leva o valor junto.
      if (NOME_SENSIVEL.test(chave)) {
        saida[chave] = REMOVIDO;
        continue;
      }

      try {
        saida[chave] = sanitizeDetail(entrada[chave], profundidade + 1);
      } catch {
        // Getter que lança, proxy estranho, referência circular: o campo vira
        // um aviso em vez de derrubar o registro do erro inteiro.
        saida[chave] = "[não foi possível ler este campo]";
      }
    }
    return saida;
  }

  return String(detail);
}

/** Só aceita os três níveis que o banco aceita; qualquer outra coisa vira "error". */
function nivelValido(level: unknown): ErrorLevel {
  return level === "warning" || level === "error" || level === "critical" ? level : "error";
}

/** UUID: se vier lixo, grava sem loja em vez de fazer o INSERT inteiro falhar. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Monta exatamente a linha que seria gravada em `app_errors`.
 * Separada de `reportError` para o teste poder inspecionar o resultado sem
 * precisar de banco.
 */
export function buildErrorRow(input: ReportErrorInput) {
  const tenantId = typeof input.tenantId === "string" && UUID.test(input.tenantId) ? input.tenantId : null;
  return {
    tenant_id: tenantId,
    module: textoSeguro(String(input.module ?? "desconhecido"), 60) || "desconhecido",
    action: textoSeguro(String(input.action ?? "desconhecida"), 60) || "desconhecida",
    level: nivelValido(input.level),
    // A mensagem também passa pela máscara: no Agentop a chave do gateway
    // apareceu justamente dentro do texto de erro devolvido pela API.
    message: textoSeguro(String(input.message ?? "Erro sem descrição."), MAX_MENSAGEM) || "Erro sem descrição.",
    detail: input.detail === undefined ? null : sanitizeDetail(input.detail),
  };
}

/**
 * Registra um erro. **Não lança, não devolve erro, não decide nada.**
 * Quem chamou continua o próprio caminho como se nada tivesse acontecido.
 */
export async function reportError(input: ReportErrorInput): Promise<void> {
  let linha: ReturnType<typeof buildErrorRow> | null = null;
  try {
    linha = buildErrorRow(input);
  } catch (e) {
    // Nem montar a linha deu certo (detail muito estranho). Registra o mínimo
    // no console e desiste — sem derrubar quem chamou.
    console.error("[report-error] não consegui preparar o registro do erro:", e);
    return;
  }

  try {
    const admin = createAdminClient();
    // `.insert()` não lança: devolve `{ error }`. Sem checar, a falha some.
    const { error } = await admin.from("app_errors").insert(linha);
    if (error) {
      console.error("[report-error] falha ao gravar em app_errors:", error.message, linha);
    }
  } catch (e) {
    // Sem variável de ambiente, banco fora, rede caída: tudo cai aqui e para
    // aqui. O console é o último recurso.
    console.error("[report-error] não foi possível registrar o erro:", e, linha);
  }
}
