import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Visão da PLATAFORMA sobre os chamados de atendimento.
 *
 * ATENÇÃO — o que estes dados são de verdade (confirmado lendo
 * `supabase/migrations/0017_support.sql` e `src/modules/support/service.ts`):
 *
 *   `support_tickets` guarda o chamado de um COMPRADOR falando com UMA LOJA.
 *   As colunas dizem isso na cara: `buyer_email`, `buyer_name`, `order_id`, e
 *   `support_messages.sender` só aceita 'customer' (o comprador) ou 'staff'
 *   (a loja). Não existe, hoje, nenhuma tabela onde o LOJISTA abre chamado
 *   com o dono da plataforma.
 *
 * Por isso esta tela é uma CAIXA ÚNICA CONSOLIDADA: o dono da plataforma vê,
 * num lugar só, todos os chamados que os compradores abriram em todas as
 * lojas. É dado real e serve para saber qual loja está deixando cliente sem
 * resposta. O canal "lojista fala com a plataforma" ainda NÃO existe e é uma
 * fase futura (precisa de tabela nova, e a tabela da loja está em produção).
 *
 * Nesta fase a leitura é só leitura: responder pela plataforma exigiria mexer
 * no módulo de atendimento da loja, que está em produção.
 */

export type PlatformTicketStatus = "aberto" | "em_andamento" | "resolvido" | "reaberto";

export type PlatformTicket = {
  id: string;
  tenantId: string;
  /** Nome da loja. "Loja não encontrada" quando o tenant sumiu do banco. */
  tenantName: string;
  tenantSlug: string | null;
  buyerName: string;
  buyerEmail: string;
  subject: string;
  category: string;
  status: PlatformTicketStatus;
  orderId: string | null;
  createdAt: string;
  lastMessageAt: string;
  /** Trecho da última mensagem da conversa (pode não existir). */
  lastMessagePreview: string | null;
  /** Quem escreveu por último: 'customer' (comprador) ou 'staff' (a loja). */
  lastMessageSender: "customer" | "staff" | null;
};

export type PlatformTicketMessage = {
  id: string;
  sender: "customer" | "staff";
  senderName: string | null;
  body: string;
  attachmentUrl: string | null;
  createdAt: string;
};

export type PlatformSupportStore = {
  id: string;
  name: string;
  slug: string;
};

const TICKET_COLUMNS =
  "id, tenant_id, buyer_name, buyer_email, subject, category, status, order_id, created_at, last_message_at";

type TicketRow = {
  id: string;
  tenant_id: string;
  buyer_name: string;
  buyer_email: string;
  subject: string;
  category: string;
  status: string;
  order_id: string | null;
  created_at: string;
  last_message_at: string;
};

type MessageRow = {
  id: string;
  ticket_id: string;
  sender: string;
  sender_name: string | null;
  body: string;
  attachment_url: string | null;
  created_at: string;
};

/** Teto de leitura desta tela. Existe para a página não travar quando a
 *  plataforma tiver muitas lojas; a contagem exibida diz o que está sendo visto. */
const LIMITE_CHAMADOS = 300;

/**
 * Nome e endereço de cada loja, indexados por id.
 *
 * De propósito NÃO usamos o embed do PostgREST (`tenants(name, slug)`) aqui:
 * uma relação ambígua ou uma coluna renomeada derruba a consulta INTEIRA e a
 * tela apareceria vazia sem explicação. Duas leituras simples são mais chatas
 * e nunca mentem.
 */
async function carregarLojas(): Promise<Map<string, PlatformSupportStore>> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("tenants").select("id, name, slug");
  if (error) {
    console.error("[platform/suporte] falha ao listar lojas:", error);
    throw new Error("Não foi possível carregar as lojas para montar a lista de chamados.");
  }
  const mapa = new Map<string, PlatformSupportStore>();
  for (const linha of data ?? []) {
    const loja = linha as PlatformSupportStore;
    mapa.set(loja.id, loja);
  }
  return mapa;
}

/**
 * Última mensagem de cada chamado, em UMA leitura só.
 *
 * Ordenamos do mais novo para o mais velho e ficamos com a primeira ocorrência
 * de cada `ticket_id` -- assim não disparamos uma consulta por chamado.
 */
async function carregarUltimasMensagens(ticketIds: string[]): Promise<Map<string, MessageRow>> {
  const mapa = new Map<string, MessageRow>();
  if (ticketIds.length === 0) return mapa;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("support_messages")
    .select("id, ticket_id, sender, sender_name, body, attachment_url, created_at")
    .in("ticket_id", ticketIds)
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) {
    console.error("[platform/suporte] falha ao ler as mensagens dos chamados:", error);
    throw new Error("Não foi possível carregar as mensagens dos chamados.");
  }

  for (const linha of (data ?? []) as MessageRow[]) {
    if (!mapa.has(linha.ticket_id)) mapa.set(linha.ticket_id, linha);
  }
  return mapa;
}

function normalizaRemetente(valor: string | null | undefined): "customer" | "staff" | null {
  if (valor === "customer" || valor === "staff") return valor;
  return null;
}

/** Corta o texto sem quebrar no meio de forma feia e sem estourar a linha. */
function resumo(texto: string, maximo = 140): string {
  const limpo = texto.replace(/\s+/g, " ").trim();
  if (limpo.length <= maximo) return limpo;
  return `${limpo.slice(0, maximo - 1)}…`;
}

/**
 * Todos os chamados de todas as lojas, do mais recente para o mais antigo.
 * Erro de leitura LANÇA -- nunca vira lista vazia silenciosa.
 */
export async function listPlatformTickets(): Promise<PlatformTicket[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("support_tickets")
    .select(TICKET_COLUMNS)
    .order("last_message_at", { ascending: false })
    .limit(LIMITE_CHAMADOS);

  if (error) {
    console.error("[platform/suporte] falha ao listar chamados:", error);
    throw new Error("Não foi possível carregar os chamados de atendimento.");
  }

  const linhas = (data ?? []) as TicketRow[];
  if (linhas.length === 0) return [];

  const [lojas, ultimas] = await Promise.all([
    carregarLojas(),
    carregarUltimasMensagens(linhas.map((l) => l.id)),
  ]);

  return linhas.map((linha) => {
    const loja = lojas.get(linha.tenant_id);
    const ultima = ultimas.get(linha.id);
    return {
      id: linha.id,
      tenantId: linha.tenant_id,
      tenantName: loja?.name ?? "Loja não encontrada",
      tenantSlug: loja?.slug ?? null,
      buyerName: linha.buyer_name,
      buyerEmail: linha.buyer_email,
      subject: linha.subject,
      category: linha.category,
      status: (linha.status as PlatformTicketStatus) ?? "aberto",
      orderId: linha.order_id,
      createdAt: linha.created_at,
      lastMessageAt: linha.last_message_at,
      lastMessagePreview: ultima ? resumo(ultima.body) : null,
      lastMessageSender: normalizaRemetente(ultima?.sender),
    };
  });
}

/** As lojas que aparecem no filtro, já ordenadas por nome. */
export async function listStoresWithTickets(tickets: PlatformTicket[]): Promise<PlatformSupportStore[]> {
  const vistas = new Map<string, PlatformSupportStore>();
  for (const t of tickets) {
    if (!vistas.has(t.tenantId)) {
      vistas.set(t.tenantId, { id: t.tenantId, name: t.tenantName, slug: t.tenantSlug ?? "" });
    }
  }
  return [...vistas.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export type PlatformTicketDetail = {
  ticket: PlatformTicket;
  messages: PlatformTicketMessage[];
};

/**
 * A conversa completa de um chamado. Só leitura.
 * Devolve `null` quando o chamado não existe (a tela mostra recado, não erro).
 */
export async function getPlatformTicketDetail(ticketId: string): Promise<PlatformTicketDetail | null> {
  const admin = createAdminClient();

  const { data: ticket, error: erroTicket } = await admin
    .from("support_tickets")
    .select(TICKET_COLUMNS)
    .eq("id", ticketId)
    .maybeSingle();

  if (erroTicket) {
    console.error("[platform/suporte] falha ao carregar o chamado:", erroTicket);
    throw new Error("Não foi possível carregar este chamado.");
  }
  if (!ticket) return null;

  const linha = ticket as TicketRow;

  const { data: mensagens, error: erroMensagens } = await admin
    .from("support_messages")
    .select("id, ticket_id, sender, sender_name, body, attachment_url, created_at")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (erroMensagens) {
    console.error("[platform/suporte] falha ao carregar as mensagens do chamado:", erroMensagens);
    throw new Error("Não foi possível carregar a conversa deste chamado.");
  }

  const lojas = await carregarLojas();
  const loja = lojas.get(linha.tenant_id);
  const lista = (mensagens ?? []) as MessageRow[];
  const ultima = lista.length > 0 ? lista[lista.length - 1] : undefined;

  return {
    ticket: {
      id: linha.id,
      tenantId: linha.tenant_id,
      tenantName: loja?.name ?? "Loja não encontrada",
      tenantSlug: loja?.slug ?? null,
      buyerName: linha.buyer_name,
      buyerEmail: linha.buyer_email,
      subject: linha.subject,
      category: linha.category,
      status: (linha.status as PlatformTicketStatus) ?? "aberto",
      orderId: linha.order_id,
      createdAt: linha.created_at,
      lastMessageAt: linha.last_message_at,
      lastMessagePreview: ultima ? resumo(ultima.body) : null,
      lastMessageSender: normalizaRemetente(ultima?.sender),
    },
    messages: lista.map((m) => ({
      id: m.id,
      sender: normalizaRemetente(m.sender) ?? "customer",
      senderName: m.sender_name,
      body: m.body,
      attachmentUrl: m.attachment_url,
      createdAt: m.created_at,
    })),
  };
}

export type PlatformSupportCounters = {
  total: number;
  abertos: number;
  emAndamento: number;
  reabertos: number;
  resolvidos: number;
  /** Chamados em que quem falou por último foi o comprador (a loja deve resposta). */
  aguardandoResposta: number;
};

/** Contadores do topo da tela, calculados a partir da lista já carregada. */
export function contarChamados(tickets: PlatformTicket[]): PlatformSupportCounters {
  return {
    total: tickets.length,
    abertos: tickets.filter((t) => t.status === "aberto").length,
    emAndamento: tickets.filter((t) => t.status === "em_andamento").length,
    reabertos: tickets.filter((t) => t.status === "reaberto").length,
    resolvidos: tickets.filter((t) => t.status === "resolvido").length,
    aguardandoResposta: tickets.filter(
      (t) => t.lastMessageSender === "customer" && t.status !== "resolvido"
    ).length,
  };
}
