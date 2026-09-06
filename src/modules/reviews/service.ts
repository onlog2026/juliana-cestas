import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { saoPauloDateStr } from "@/lib/time/sao-paulo";

/**
 * LEITURA das avaliações. Nada aqui grava — gravação mora em `actions.ts`
 * (server actions, com gate de módulo) e em `invite.ts` (convite por e-mail).
 *
 * Toda consulta filtra por `tenant_id`. O tenant NUNCA vem do navegador: quem
 * chama passa `getTenantId()` (loja da requisição) ou `staff.tenantId`.
 */

export type ReviewStatus = "pendente" | "aprovada" | "recusada";

export type PublicReview = {
  id: string;
  customerName: string;
  rating: number;
  comment: string | null;
  photoUrl: string | null;
  reply: string | null;
  featured: boolean;
  submittedAt: string | null;
  productName: string | null;
};

export type AdminReview = PublicReview & {
  status: ReviewStatus;
  customerEmail: string | null;
  orderNumber: number | null;
  invitedAt: string | null;
  approvedAt: string | null;
};

export type ReviewsSummary = {
  /** Média das aprovadas, com 1 casa (ex.: 4.8). Zero quando não há nenhuma. */
  average: number;
  total: number;
};

/** Situação do convite, do ponto de vista de quem abre `/avaliar/<token>`. */
export type InviteLookup =
  | { state: "ok"; reviewId: string; customerName: string; orderNumber: number | null; productName: string | null }
  | { state: "ja_respondida" }
  | { state: "invalida" };

// ── Sanitização ───────────────────────────────────────────────────────────
// O que o cliente escreve vai aparecer na home de uma loja de verdade. React
// já escapa o texto ao renderizar, então isto NÃO é a defesa contra XSS — é a
// defesa contra o resto: tag colada de um editor, caractere de controle,
// texto de 40 mil letras que quebra o carrossel, nome com 300 caracteres.

const MAX_COMMENT = 800;
const MAX_NAME = 80;
const MAX_REPLY = 800;

const NEWLINE = "\n";

/**
 * Tira caractere de controle (byte invisível colado de um PDF, tecla exótica).
 * Feito comparando CÓDIGO de caractere, e não com um regex cheio de escapes:
 * escape invisível dentro de regex é exatamente o tipo de coisa que se perde
 * num copiar/colar e passa batido no review. A quebra de linha é a única de
 * controle que sobrevive.
 */
function stripControlChars(value: string): string {
  let out = "";
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    if (code === 10) {
      out += NEWLINE;
      continue;
    }
    if (code < 32 || code === 127) continue;
    out += ch;
  }
  return out;
}

/** Tira marcação, caractere de controle e espaço sobrando; corta no limite. */
export function sanitizeText(value: string | null | undefined, maxLength: number): string {
  if (!value) return "";
  return stripControlChars(value)
    // Bloco de script/estilo sai INTEIRO (com o conteúdo). Só tirar as tags
    // deixaria o miolo virando texto visível na home — feio e confuso.
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ") // e o resto: qualquer coisa entre < > vira espaço
    .replace(/[<>]/g, " ") // e o "<" solto, que o regex acima não pega
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeComment(value: string | null | undefined): string {
  return sanitizeText(value, MAX_COMMENT);
}

export function sanitizeName(value: string | null | undefined): string {
  return sanitizeText(value, MAX_NAME);
}

export function sanitizeReply(value: string | null | undefined): string {
  return sanitizeText(value, MAX_REPLY);
}

/** Nota válida? Vem do cliente, então é sempre revalidada no servidor. */
export function isValidRating(value: unknown): value is 1 | 2 | 3 | 4 | 5 {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5;
}

/** Nome curto para a vitrine: "Maria S." em vez do nome completo do cliente. */
export function shortenName(fullName: string): string {
  const parts = sanitizeName(fullName).split(" ").filter(Boolean);
  if (parts.length === 0) return "Cliente";
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  return `${parts[0]} ${last.charAt(0).toUpperCase()}.`;
}

// ── Embaralhamento com semente do dia ─────────────────────────────────────
// `Math.random()` no cliente mudaria a cada render: o HTML do servidor não
// bateria com o do navegador e o React reclamaria de hidratação em produção
// (erro #418/#423 — já aconteceu neste projeto). Aqui a ordem é uma FUNÇÃO da
// data: mesmo dia, mesma ordem, servidor e cliente idênticos; dia seguinte,
// ordem nova.

/** Hash estável de string -> inteiro 32 bits (determinístico, sem lib). */
export function seedFromString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Gerador pseudoaleatório determinístico (mulberry32). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates com semente. Não altera o array recebido. */
export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const out = items.slice();
  const rand = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Ordem do dia: destaque primeiro (a lojista escolheu), o resto embaralhado
 * com a semente do dia de hoje em São Paulo + a loja (duas lojas não veem a
 * mesma sequência).
 */
export function orderForDay<T extends { featured: boolean; id: string }>(
  reviews: readonly T[],
  tenantId: string,
  dateStr: string = saoPauloDateStr()
): T[] {
  const seed = seedFromString(`${tenantId}|${dateStr}`);
  const destaques = reviews.filter((r) => r.featured);
  const demais = reviews.filter((r) => !r.featured);
  return [...seededShuffle(destaques, seed), ...seededShuffle(demais, seed ^ 0x9e3779b9)];
}

// ── Consultas ─────────────────────────────────────────────────────────────

type Row = {
  id: string;
  customer_name: string;
  customer_email?: string | null;
  rating: number | null;
  comment: string | null;
  photo_url: string | null;
  reply: string | null;
  featured: boolean;
  submitted_at: string | null;
  status?: string;
  invited_at?: string | null;
  approved_at?: string | null;
  products?: { name: string } | { name: string }[] | null;
  orders?: { number: number } | { number: number }[] | null;
};

function firstRelated<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function toPublicReview(row: Row): PublicReview {
  return {
    id: row.id,
    customerName: shortenName(row.customer_name),
    rating: row.rating ?? 0,
    comment: sanitizeComment(row.comment) || null,
    photoUrl: row.photo_url,
    reply: sanitizeReply(row.reply) || null,
    featured: row.featured,
    submittedAt: row.submitted_at,
    productName: firstRelated(row.products)?.name ?? null,
  };
}

const PUBLIC_COLUMNS =
  "id, customer_name, rating, comment, photo_url, reply, featured, submitted_at, products(name)";

/**
 * As avaliações que a loja pode mostrar: aprovadas e já respondidas.
 * `limit`/`offset` servem à página `/avaliacoes` (link universal, paginada).
 */
export async function getApprovedReviews(
  tenantId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<PublicReview[]> {
  const limit = Math.min(Math.max(options.limit ?? 24, 1), 100);
  const offset = Math.max(options.offset ?? 0, 0);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("product_reviews")
    .select(PUBLIC_COLUMNS)
    .eq("tenant_id", tenantId)
    .eq("status", "aprovada")
    .not("submitted_at", "is", null)
    .order("featured", { ascending: false })
    .order("submitted_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data) return [];
  return (data as unknown as Row[]).map(toPublicReview);
}

/** Média e total das aprovadas. Vitrine sem isso vira "estrelas sem contexto". */
export async function getReviewsSummary(tenantId: string): Promise<ReviewsSummary> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("product_reviews")
    .select("rating")
    .eq("tenant_id", tenantId)
    .eq("status", "aprovada")
    .not("submitted_at", "is", null)
    .limit(1000);

  if (error || !data || data.length === 0) return { average: 0, total: 0 };

  const notas = (data as { rating: number | null }[])
    .map((r) => r.rating)
    .filter((n): n is number => typeof n === "number");
  if (notas.length === 0) return { average: 0, total: 0 };

  const soma = notas.reduce((acc, n) => acc + n, 0);
  return { average: Math.round((soma / notas.length) * 10) / 10, total: notas.length };
}

/** Avaliações aprovadas na ordem do dia — o que a vitrine da home consome. */
export async function getShowcaseReviews(
  tenantId: string,
  limit = 12
): Promise<{ reviews: PublicReview[]; summary: ReviewsSummary }> {
  const [aprovadas, summary] = await Promise.all([
    getApprovedReviews(tenantId, { limit: 60 }),
    getReviewsSummary(tenantId),
  ]);
  return { reviews: orderForDay(aprovadas, tenantId).slice(0, limit), summary };
}

/** Quantas aprovadas existem no total (paginação de `/avaliacoes`). */
export async function countApprovedReviews(tenantId: string): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("product_reviews")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "aprovada")
    .not("submitted_at", "is", null);
  if (error) return 0;
  return count ?? 0;
}

/** Painel da lojista: fila de moderação, filtrada por situação. */
export async function listReviewsAdmin(
  tenantId: string,
  status?: ReviewStatus
): Promise<AdminReview[]> {
  const admin = createAdminClient();
  let query = admin
    .from("product_reviews")
    .select(
      "id, customer_name, customer_email, rating, comment, photo_url, reply, featured, status, invited_at, submitted_at, approved_at, products(name), orders(number)"
    )
    .eq("tenant_id", tenantId)
    // Convite ainda não respondido não é "avaliação": não entra na fila.
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: false })
    .limit(200);

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error || !data) return [];

  return (data as unknown as Row[]).map((row) => ({
    ...toPublicReview(row),
    // No painel a lojista precisa ver o nome inteiro, não o encurtado.
    customerName: sanitizeName(row.customer_name) || "Cliente",
    status: (row.status as ReviewStatus | undefined) ?? "pendente",
    customerEmail: row.customer_email ?? null,
    orderNumber: firstRelated(row.orders)?.number ?? null,
    invitedAt: row.invited_at ?? null,
    approvedAt: row.approved_at ?? null,
  }));
}

export type ReviewCounts = {
  pendente: number;
  aprovada: number;
  recusada: number;
  /** Convites enviados que ninguém respondeu ainda. */
  aguardandoResposta: number;
};

export async function getReviewCounts(tenantId: string): Promise<ReviewCounts> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("product_reviews")
    .select("status, submitted_at")
    .eq("tenant_id", tenantId)
    .limit(2000);

  const zero: ReviewCounts = { pendente: 0, aprovada: 0, recusada: 0, aguardandoResposta: 0 };
  if (error || !data) return zero;

  return (data as { status: string; submitted_at: string | null }[]).reduce((acc, row) => {
    if (!row.submitted_at) {
      acc.aguardandoResposta += 1;
      return acc;
    }
    if (row.status === "pendente") acc.pendente += 1;
    else if (row.status === "aprovada") acc.aprovada += 1;
    else if (row.status === "recusada") acc.recusada += 1;
    return acc;
  }, zero);
}

/**
 * Quem está por trás de `/avaliar/<token>`. Recebe o HASH (a página nunca
 * manda o token cru para cá além de calcular o hash) e devolve um estado
 * legível — nunca um erro cru na cara do cliente.
 */
export async function lookupInviteByHash(
  tenantId: string,
  tokenHash: string
): Promise<InviteLookup> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("product_reviews")
    .select("id, customer_name, submitted_at, products(name), orders(number)")
    .eq("tenant_id", tenantId)
    .eq("invite_token_hash", tokenHash)
    .maybeSingle();

  if (error || !data) return { state: "invalida" };
  const row = data as unknown as Row;
  if (row.submitted_at) return { state: "ja_respondida" };

  return {
    state: "ok",
    reviewId: row.id,
    customerName: sanitizeName(row.customer_name) || "Cliente",
    orderNumber: firstRelated(row.orders)?.number ?? null,
    productName: firstRelated(row.products)?.name ?? null,
  };
}
