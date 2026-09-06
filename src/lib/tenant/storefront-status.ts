/**
 * A VITRINE DESTA LOJA ESTÁ SUSPENSA?
 *
 * Roda no middleware (`src/proxy.ts`), que é Edge — por isso este arquivo não
 * importa `server-only`, nada de Node e nada do cliente do Supabase: só
 * `fetch`. Um import pesado aqui entra no pacote do middleware, e o middleware
 * roda em TODA visita à loja.
 *
 * ═══ AS TRÊS REGRAS QUE MANDAM AQUI ═══
 *
 * 1. **Erro nunca derruba a loja.** Banco fora, variável faltando, rede caída,
 *    resposta estranha: tudo devolve `false` (= "não está suspensa") e a
 *    vitrine continua no ar. O estrago dos dois erros não tem o mesmo tamanho:
 *    deixar no ar por engano a vitrine de uma loja inadimplente custa alguns
 *    minutos de venda que talvez não devessem acontecer; tirar do ar por engano
 *    a vitrine de uma loja em dia custa as vendas do dia inteiro e a confiança
 *    da lojista. A loja da Juliana está em produção: entre os dois, o erro
 *    barato é deixar no ar.
 *
 * 2. **Uma consulta por minuto, no máximo.** Sem o cache abaixo, cada foto,
 *    cada página e cada visitante viraria uma ida ao banco antes de qualquer
 *    byte sair. O cache vive na memória da instância do Edge: some quando a
 *    instância recicla, e é isso mesmo — ele existe para cortar rajada, não
 *    para ser fonte de verdade. O preço é que uma suspensão (ou uma
 *    reativação) leva até um minuto para valer em cada instância.
 *
 * 3. **Sem configuração, não faz nada.** Sem as variáveis do banco, responde
 *    `false` na hora, sem tentar rede nenhuma.
 */

/** Quanto tempo a resposta vale antes de perguntar ao banco de novo. */
const VALIDADE_MS = 60_000;

type Anotacao = { suspensa: boolean; expiraEm: number };

/**
 * Escopo de módulo: no Edge isso sobrevive entre requisições da mesma
 * instância. Nunca é fonte de verdade — é só um amortecedor.
 */
const cache = new Map<string, Anotacao>();

/** Só para o teste: apaga o amortecedor entre cenários. */
export function limparCacheDeStatus(): void {
  cache.clear();
}

export async function vitrineSuspensa(tenantId: string, agora = Date.now()): Promise<boolean> {
  if (!tenantId) return false;

  const anotado = cache.get(tenantId);
  if (anotado && anotado.expiraEm > agora) return anotado.suspensa;

  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  // Sem configuração de banco não há como saber — e "não sei" nunca fecha a loja.
  if (!url || !chave) return false;

  try {
    const resposta = await fetch(
      `${url}/rest/v1/tenants?select=status&id=eq.${encodeURIComponent(tenantId)}`,
      {
        method: "GET",
        headers: { apikey: chave, authorization: `Bearer ${chave}`, accept: "application/json" },
        cache: "no-store",
      }
    );
    if (!resposta.ok) {
      console.error("[vitrine] não consegui ler o status da loja:", resposta.status);
      return false;
    }
    const linhas = (await resposta.json()) as { status?: string | null }[];
    // Loja não encontrada também é "não sei": nunca vira bloqueio.
    if (!Array.isArray(linhas) || linhas.length === 0) return false;

    const suspensa = linhas[0]?.status === "suspended";
    cache.set(tenantId, { suspensa, expiraEm: agora + VALIDADE_MS });
    return suspensa;
  } catch (e) {
    console.error("[vitrine] falha ao consultar o status da loja:", e);
    return false;
  }
}
