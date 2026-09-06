import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Leitura das cortesias (vouchers) e das listas que a tela de cortesias
 * precisa (módulos e planos).
 *
 * A tabela `vouchers` nasceu com RLS `using(false)`: o navegador NUNCA lê nem
 * escreve nela. Tudo passa por aqui, com o cliente de service role, e o que
 * chega ao navegador é só o que este arquivo devolve. É de propósito -- no
 * Agentop uma tabela de configuração com RLS aberta deixava qualquer usuário
 * logado ler e escrever a configuração da plataforma inteira.
 */

/** Um módulo que o sistema sabe entregar (lista fechada, mora no banco). */
export type PlatformModule = {
  slug: string;
  name: string;
  description: string | null;
  category: string;
  isCore: boolean;
  sortOrder: number;
};

/** Um plano, do jeito mínimo que a tela de cortesias precisa. */
export type PlanOption = {
  slug: string;
  name: string;
  isVisible: boolean;
};

/**
 * Situação REAL da cortesia, calculada na hora.
 *
 * Não existe coluna "status" na tabela e isso é intencional: coluna gravada
 * desatualiza (uma cortesia vence sozinha quando o relógio passa da data) e a
 * tela passaria a mentir. Aqui a situação sai sempre de `used_count`,
 * `max_uses` e `valid_until`.
 */
export type VoucherSituacao = "disponivel" | "usada" | "expirada";

export type PlatformVoucher = {
  id: string;
  code: string;
  tenantId: string | null;
  /** Nome da loja nominal, já resolvido. `null` = vale para qualquer loja. */
  tenantNome: string | null;
  grantPlanSlug: string | null;
  grantModules: string[];
  /** Quantos dias de acesso o RESGATE concede. */
  accessDays: number;
  /** Prazo para RESGATAR. Não tem nada a ver com a duração do acesso. */
  validUntil: string | null;
  maxUses: number;
  usedCount: number;
  redeemedBy: string | null;
  redeemedAt: string | null;
  note: string | null;
  createdBy: string | null;
  createdAt: string;
  situacao: VoucherSituacao;
  /** Já foi resgatada ao menos uma vez? Se sim, é histórico e não se apaga. */
  jaFoiUsada: boolean;
};

type VoucherRow = {
  id: string;
  code: string;
  tenant_id: string | null;
  grant_plan_slug: string | null;
  grant_modules: string[] | null;
  access_days: number | null;
  valid_until: string | null;
  max_uses: number | null;
  used_count: number | null;
  redeemed_by: string | null;
  redeemed_at: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
};

const VOUCHER_COLUMNS =
  "id, code, tenant_id, grant_plan_slug, grant_modules, access_days, valid_until, max_uses, used_count, redeemed_by, redeemed_at, note, created_by, created_at";

/**
 * A regra de situação, num lugar só.
 * Ordem importa: uma cortesia esgotada continua "usada" mesmo depois de a data
 * de resgate passar -- quem lê a lista quer saber que ela foi aproveitada, não
 * que ela venceu.
 */
export function calcularSituacao(
  usedCount: number,
  maxUses: number,
  validUntil: string | null,
  agora = Date.now()
): VoucherSituacao {
  if (usedCount >= maxUses) return "usada";
  if (validUntil) {
    const limite = new Date(validUntil).getTime();
    if (!Number.isNaN(limite) && limite < agora) return "expirada";
  }
  return "disponivel";
}

function map(row: VoucherRow, nomesDeLoja: Map<string, string>): PlatformVoucher {
  const usedCount = row.used_count ?? 0;
  const maxUses = row.max_uses ?? 1;
  return {
    id: row.id,
    code: row.code,
    tenantId: row.tenant_id,
    tenantNome: row.tenant_id ? (nomesDeLoja.get(row.tenant_id) ?? null) : null,
    grantPlanSlug: row.grant_plan_slug,
    grantModules: row.grant_modules ?? [],
    accessDays: row.access_days ?? 0,
    validUntil: row.valid_until,
    maxUses,
    usedCount,
    redeemedBy: row.redeemed_by,
    redeemedAt: row.redeemed_at,
    note: row.note,
    createdBy: row.created_by,
    createdAt: row.created_at,
    situacao: calcularSituacao(usedCount, maxUses, row.valid_until),
    jaFoiUsada: usedCount > 0,
  };
}

/** Lista de módulos vendáveis. Fonte única: o banco. */
export async function listPlatformModules(): Promise<PlatformModule[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("platform_modules")
    .select("slug, name, description, category, is_core, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    // Erro de leitura NÃO vira lista vazia silenciosa. Uma lista de módulos
    // vazia por engano faria o formulário parecer "sem módulos disponíveis".
    console.error("[platform] falha ao listar módulos:", error);
    throw new Error("Não foi possível carregar a lista de módulos da plataforma.");
  }

  return (data ?? []).map((row) => ({
    slug: row.slug as string,
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    category: (row.category as string) ?? "loja",
    isCore: Boolean(row.is_core),
    sortOrder: Number(row.sort_order ?? 0),
  }));
}

/** Planos existentes, para o seletor "plano concedido". */
export async function listPlanOptions(): Promise<PlanOption[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("subscription_plans")
    .select("slug, name, is_visible, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[platform] falha ao listar planos:", error);
    throw new Error("Não foi possível carregar a lista de planos.");
  }

  return (data ?? []).map((row) => ({
    slug: row.slug as string,
    name: row.name as string,
    isVisible: Boolean(row.is_visible),
  }));
}

/** Nome de cada loja, para mostrar "para quem" em vez de um id cru. */
async function carregarNomesDeLoja(ids: string[]): Promise<Map<string, string>> {
  const mapa = new Map<string, string>();
  if (ids.length === 0) return mapa;

  const admin = createAdminClient();
  const { data, error } = await admin.from("tenants").select("id, name").in("id", ids);
  if (error) {
    console.error("[platform] falha ao carregar nomes das lojas das cortesias:", error);
    throw new Error("Não foi possível carregar as lojas ligadas às cortesias.");
  }
  for (const row of data ?? []) mapa.set(row.id as string, row.name as string);
  return mapa;
}

/** Todas as cortesias, da mais nova para a mais antiga. */
export async function listVouchers(): Promise<PlatformVoucher[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("vouchers")
    .select(VOUCHER_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[platform] falha ao listar cortesias:", error);
    throw new Error("Não foi possível carregar as cortesias.");
  }

  const linhas = (data ?? []) as VoucherRow[];
  const idsDeLoja = [...new Set(linhas.map((l) => l.tenant_id).filter((id): id is string => Boolean(id)))];
  const nomes = await carregarNomesDeLoja(idsDeLoja);
  return linhas.map((linha) => map(linha, nomes));
}
