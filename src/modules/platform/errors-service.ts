import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Leitura da tabela `app_errors` para a tela /super/erros.
 *
 * Regras herdadas da spec (docs/SUPER-ADMIN-SPEC.md):
 *  - "Uma coluna inexistente derruba a consulta inteira e `data || []` engole o
 *    erro — a lista aparece vazia sem ninguém saber por quê." Aqui, falha de
 *    leitura da lista **lança**. A tela mostra o problema em vez de fingir que
 *    está tudo em paz.
 *  - Dispensar um alerta **não apaga** o registro (ver `errors-actions.ts`).
 */

export type ErrorLevel = "warning" | "error" | "critical";

export type AppErrorItem = {
  id: string;
  tenantId: string | null;
  /** Nome da loja já resolvido — a tela nunca mostra uuid para o dono. */
  tenantName: string | null;
  module: string;
  action: string;
  level: ErrorLevel;
  message: string;
  /** Já sanitizado na gravação; aqui vira texto formatado para a tela. */
  detail: string | null;
  createdAt: string;
  dismissedAt: string | null;
  dismissedBy: string | null;
  /** O que o dono da loja percebe quando este erro acontece, quando dá para inferir. */
  impacto: string | null;
};

export type PeriodoFiltro = "24h" | "7d" | "30d";

export type ErrorFilters = {
  nivel?: ErrorLevel | "";
  tenantId?: string;
  periodo?: PeriodoFiltro;
  incluirDispensados?: boolean;
};

export type ListaDeErros = {
  itens: AppErrorItem[];
  /**
   * `false` quando a migração 0027 ainda não foi rodada (as colunas
   * `dismissed_at`/`dismissed_by` não existem). A tela avisa em vez de
   * mostrar um botão que não funciona — "um controle que não faz nada é pior
   * que não existir".
   */
  dispensaDisponivel: boolean;
  /** Quantos registros dispensados existem no período (para o filtro fazer sentido). */
  dispensados: number;
};

export type DestaqueCritico = {
  /** Quantos erros críticos nas últimas 24 horas (sem contar os dispensados). */
  total: number;
  /** Os 3 mais recentes, para o painel vermelho do topo. */
  recentes: AppErrorItem[];
  /** Quantos erros de QUALQUER nível nas últimas 24 horas. */
  totalGeral: number;
};

const LIMITE_LISTA = 200;

const COLUNAS_BASE = "id, tenant_id, module, action, level, message, detail, created_at";
const COLUNAS_COM_DISPENSA = `${COLUNAS_BASE}, dismissed_at, dismissed_by`;

const HORAS_POR_PERIODO: Record<PeriodoFiltro, number> = { "24h": 24, "7d": 24 * 7, "30d": 24 * 30 };

/**
 * O que o dono percebe quando o erro acontece, por módulo.
 *
 * Isto é o que transforma "erro no módulo email" (que não diz nada para quem
 * não é dev) em "o cliente não recebe a confirmação do pedido" (que diz tudo).
 * Módulo que não estiver aqui simplesmente não mostra frase nenhuma — melhor
 * calar do que inventar uma consequência errada.
 */
const IMPACTO_POR_MODULO: Record<string, string> = {
  pagamento: "O cliente paga e o pedido pode não ser liberado.",
  pagamentos: "O cliente paga e o pedido pode não ser liberado.",
  asaas: "O cliente paga e o pedido pode não ser liberado.",
  webhook: "A confirmação do pagamento pode não chegar ao sistema, e o pedido fica preso como pendente.",
  checkout: "O cliente não consegue terminar a compra e desiste no meio.",
  email: "O cliente não recebe a confirmação do pedido por e-mail.",
  emails: "O cliente não recebe a confirmação do pedido por e-mail.",
  resend: "O cliente não recebe a confirmação do pedido por e-mail.",
  pedidos: "O pedido pode não aparecer no painel da loja, e ninguém separa a encomenda.",
  entregas: "A entrega pode ficar sem data marcada ou some da agenda do dia.",
  entrega: "A entrega pode ficar sem data marcada ou some da agenda do dia.",
  frete: "O cliente vê um valor de entrega errado ou não consegue calcular o frete.",
  produtos: "Um produto pode sumir da loja ou aparecer com preço e estoque errados.",
  catalogo: "Um produto pode sumir da loja ou aparecer com preço e estoque errados.",
  estoque: "A loja pode vender um produto que já acabou.",
  cupons: "O cliente digita o cupom e ele não é aceito.",
  midia: "Uma foto de produto pode não subir ou aparecer quebrada na loja.",
  storage: "Uma foto de produto pode não subir ou aparecer quebrada na loja.",
  upload: "Uma foto de produto pode não subir ou aparecer quebrada na loja.",
  auth: "O lojista ou o cliente pode não conseguir entrar na conta.",
  login: "O lojista ou o cliente pode não conseguir entrar na conta.",
  cms: "Um texto ou banner editado no painel pode não aparecer no site.",
  seo: "A loja pode aparecer no Google com título ou descrição errados.",
  ia: "O assistente de IA não consegue escrever a descrição do produto.",
  suporte: "Uma mensagem de cliente pode não chegar ao atendimento da loja.",
  plataforma: "Uma ação da administração da plataforma não teve efeito.",
  vitrine: "A loja pode ficar fora do ar ou abrir com erro para quem visita.",
};

function impactoDoModulo(modulo: string): string | null {
  return IMPACTO_POR_MODULO[modulo.trim().toLowerCase()] ?? null;
}

/** Transforma o `detail` (jsonb) em texto legível. Nunca lança. */
function formatarDetalhe(detail: unknown): string | null {
  if (detail === null || detail === undefined) return null;
  try {
    if (typeof detail === "string") return detail;
    const texto = JSON.stringify(detail, null, 2);
    return texto && texto !== "{}" && texto !== "null" ? texto : null;
  } catch {
    return "(não foi possível mostrar os detalhes deste erro)";
  }
}

type Row = {
  id: string;
  tenant_id: string | null;
  module: string;
  action: string;
  level: string;
  message: string;
  detail: unknown;
  created_at: string;
  dismissed_at?: string | null;
  dismissed_by?: string | null;
};

function map(row: Row, nomesDeLoja: Map<string, string>): AppErrorItem {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    tenantName: row.tenant_id ? (nomesDeLoja.get(row.tenant_id) ?? null) : null,
    module: row.module,
    action: row.action,
    level: (row.level as ErrorLevel) ?? "error",
    message: row.message,
    detail: formatarDetalhe(row.detail),
    createdAt: row.created_at,
    dismissedAt: row.dismissed_at ?? null,
    dismissedBy: row.dismissed_by ?? null,
    impacto: impactoDoModulo(row.module),
  };
}

/** Erro do PostgREST de "essa coluna não existe" (migração 0027 ainda não rodada). */
function colunaNaoExiste(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "42703") return true;
  return /column .* does not exist|does not exist on table/i.test(error.message ?? "");
}

/**
 * Nome de cada loja, para a tela não mostrar uuid.
 *
 * Consulta separada de propósito, em vez de embed do PostgREST: se a relação
 * mudar de nome, a lista de erros continua carregando — só perde o nome bonito
 * da loja. Falha aqui NÃO derruba a tela (não é a leitura da lista).
 */
export async function carregarNomesDeLoja(): Promise<Map<string, string>> {
  const mapa = new Map<string, string>();
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("tenants").select("id, name");
    if (error) {
      console.error("[platform/erros] falha ao carregar nomes das lojas:", error);
      return mapa;
    }
    for (const linha of data ?? []) {
      const t = linha as { id: string; name: string | null };
      if (t.id && t.name) mapa.set(t.id, t.name);
    }
  } catch (e) {
    console.error("[platform/erros] falha ao carregar nomes das lojas:", e);
  }
  return mapa;
}

/** Lojas que têm pelo menos um erro registrado, para montar o seletor de loja. */
export async function listarLojasComErro(): Promise<{ id: string; nome: string }[]> {
  const nomes = await carregarNomesDeLoja();
  const admin = createAdminClient();
  const { data, error } = await admin.from("app_errors").select("tenant_id").not("tenant_id", "is", null).limit(1000);
  if (error) {
    console.error("[platform/erros] falha ao listar lojas com erro:", error);
    return [];
  }
  const ids = new Set<string>();
  for (const linha of data ?? []) {
    const id = (linha as { tenant_id: string | null }).tenant_id;
    if (id) ids.add(id);
  }
  return [...ids]
    .map((id) => ({ id, nome: nomes.get(id) ?? "Loja sem nome cadastrado" }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

function desdeQuando(periodo: PeriodoFiltro): string {
  return new Date(Date.now() - HORAS_POR_PERIODO[periodo] * 3600000).toISOString();
}

/**
 * Lista de erros já filtrada.
 *
 * ATENÇÃO: falha de leitura **lança**. Não existe "devolver lista vazia e
 * seguir a vida" — foi exatamente isso que, no Agentop, deixou uma tela vazia
 * por dias sem ninguém saber que estava quebrada.
 */
export async function listAppErrors(filtros: ErrorFilters = {}): Promise<ListaDeErros> {
  const periodo: PeriodoFiltro = filtros.periodo ?? "7d";
  const desde = desdeQuando(periodo);
  const nomesDeLoja = await carregarNomesDeLoja();
  const admin = createAdminClient();

  function montar(colunas: string, comDispensa: boolean) {
    let q = admin.from("app_errors").select(colunas).gte("created_at", desde);
    if (filtros.nivel) q = q.eq("level", filtros.nivel);
    if (filtros.tenantId) q = q.eq("tenant_id", filtros.tenantId);
    if (comDispensa && !filtros.incluirDispensados) q = q.is("dismissed_at", null);
    return q.order("created_at", { ascending: false }).limit(LIMITE_LISTA);
  }

  let dispensaDisponivel = true;
  let { data, error } = await montar(COLUNAS_COM_DISPENSA, true);

  if (error && colunaNaoExiste(error)) {
    // A migração 0027 ainda não rodou. Em vez de quebrar a tela, carrega sem a
    // coluna e avisa lá em cima que o botão "Dispensar" ainda não existe.
    dispensaDisponivel = false;
    ({ data, error } = await montar(COLUNAS_BASE, false));
  }

  if (error) {
    console.error("[platform/erros] falha ao ler app_errors:", error);
    throw new Error("Não foi possível carregar os erros da plataforma.");
  }

  const linhas = (data ?? []) as unknown as Row[];
  const itens = linhas.map((linha) => map(linha, nomesDeLoja));
  const dispensados = itens.filter((item) => item.dismissedAt).length;

  return { itens, dispensaDisponivel, dispensados };
}

/**
 * O painel vermelho do topo: erros críticos das últimas 24 horas.
 * Sempre olha 24 horas, independente do filtro escolhido na tela — é um alarme,
 * não uma consulta.
 */
export async function getDestaqueCritico(): Promise<DestaqueCritico> {
  const desde = desdeQuando("24h");
  const nomesDeLoja = await carregarNomesDeLoja();
  const admin = createAdminClient();

  // Os críticos vêm FILTRADOS PELO BANCO, com a contagem exata vinda junto.
  // Filtrar em memória sobre uma página de resultados diria "3 críticos"
  // quando existem 40 — um alarme que mente para baixo é pior que alarme
  // nenhum.
  function montarCriticos(colunas: string, comDispensa: boolean) {
    let q = admin
      .from("app_errors")
      .select(colunas, { count: "exact" })
      .gte("created_at", desde)
      .eq("level", "critical");
    if (comDispensa) q = q.is("dismissed_at", null);
    return q.order("created_at", { ascending: false }).limit(3);
  }

  function montarTotalGeral(comDispensa: boolean) {
    let q = admin.from("app_errors").select("id", { count: "exact", head: true }).gte("created_at", desde);
    if (comDispensa) q = q.is("dismissed_at", null);
    return q;
  }

  let comDispensa = true;
  let { data, error, count } = await montarCriticos(COLUNAS_COM_DISPENSA, true);
  if (error && colunaNaoExiste(error)) {
    // Migração 0027 ainda não rodada.
    comDispensa = false;
    ({ data, error, count } = await montarCriticos(COLUNAS_BASE, false));
  }
  if (error) {
    console.error("[platform/erros] falha ao ler o destaque de críticos:", error);
    throw new Error("Não foi possível verificar se há erros críticos.");
  }

  const geral = await montarTotalGeral(comDispensa);
  if (geral.error) {
    console.error("[platform/erros] falha ao contar os erros das últimas 24h:", geral.error);
    throw new Error("Não foi possível verificar se há erros críticos.");
  }

  const linhas = (data ?? []) as unknown as Row[];
  return {
    total: count ?? linhas.length,
    recentes: linhas.map((linha) => map(linha, nomesDeLoja)),
    totalGeral: geral.count ?? 0,
  };
}
