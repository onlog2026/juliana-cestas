import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { SUPER_ADMIN_EMAILS } from "@/lib/platform/super-admins";

/**
 * Quem administra a PLATAFORMA (não uma loja).
 *
 * Existem DUAS listas no sistema e elas precisam concordar:
 *
 *  1. A tabela `platform_admins` (migration 0025). É ela que manda: o login
 *     (`src/lib/auth/require-super-admin.ts`) e a função SQL
 *     `public.is_platform_admin()` leem daqui.
 *  2. A lista fixa em `src/lib/platform/super-admins.ts`, que é o PLANO B --
 *     usada só quando a leitura da tabela falha, para o dono não ficar
 *     trancado fora do próprio painel.
 *
 * No Agentop essas duas listas divergiram e um e-mail ficou "administrador
 * para a API e cego na tela". Por isso este arquivo não só lista a tabela: ele
 * COMPARA as duas e devolve as divergências prontas para a tela mostrar.
 */

export type PlatformAdminRow = {
  email: string;
  name: string | null;
  role: "owner" | "staff";
  modules: string[];
  isActive: boolean;
  createdAt: string;
  /** Este e-mail também está na lista de emergência do código? */
  naListaDoCodigo: boolean;
};

const COLUMNS = "email, name, role, modules, is_active, created_at";

type Row = {
  email: string;
  name: string | null;
  role: string;
  modules: string[] | null;
  is_active: boolean;
  created_at: string;
};

function normaliza(email: string): string {
  return email.trim().toLowerCase();
}

const CODIGO = new Set(SUPER_ADMIN_EMAILS.map(normaliza));

function map(row: Row): PlatformAdminRow {
  const email = row.email;
  return {
    email,
    name: row.name,
    role: (row.role as PlatformAdminRow["role"]) ?? "staff",
    modules: row.modules ?? [],
    isActive: row.is_active !== false,
    createdAt: row.created_at,
    naListaDoCodigo: CODIGO.has(normaliza(email)),
  };
}

/**
 * Todos os administradores da plataforma, ativos e inativos.
 * Erro de leitura LANÇA -- nunca vira lista vazia silenciosa, porque uma lista
 * de acesso que aparece vazia por engano é o pior tipo de mentira de tela.
 */
export async function listPlatformAdmins(): Promise<PlatformAdminRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("platform_admins").select(COLUMNS).order("created_at", { ascending: true });

  if (error) {
    console.error("[platform/equipe] falha ao listar administradores:", error);
    throw new Error("Não foi possível carregar a lista de administradores da plataforma.");
  }

  return (data ?? []).map((r) => map(r as Row));
}

export type Divergencia = {
  email: string;
  /** 'so_na_tabela' = está na tabela e não na lista do código.
   *  'so_no_codigo'  = está na lista do código e não na tabela (ou desativado nela). */
  tipo: "so_na_tabela" | "so_no_codigo";
  /** Consequência prática, escrita para quem não é dev. */
  consequencia: string;
};

/**
 * Compara a tabela com a lista fixa do código e explica o que cada diferença
 * significa NA PRÁTICA para o acesso da pessoa. Esta é a parte mais valiosa
 * da tela: é o alarme que faltou no Agentop.
 */
export function compararListas(admins: PlatformAdminRow[]): Divergencia[] {
  const divergencias: Divergencia[] = [];

  // Só administradores ATIVOS contam como "acesso concedido pela tabela".
  const ativosNaTabela = new Set(admins.filter((a) => a.isActive).map((a) => normaliza(a.email)));

  for (const admin of admins) {
    if (admin.isActive && !admin.naListaDoCodigo) {
      divergencias.push({
        email: admin.email,
        tipo: "so_na_tabela",
        consequencia:
          "Esta pessoa entra no painel normalmente hoje. Mas ela NÃO está na lista de emergência que fica dentro do código. " +
          "Se o banco de dados ficar fora do ar, o sistema cai nessa lista de emergência e esta pessoa perde o acesso até o banco voltar.",
      });
    }
  }

  for (const email of SUPER_ADMIN_EMAILS) {
    if (!ativosNaTabela.has(normaliza(email))) {
      const existeDesativado = admins.some((a) => normaliza(a.email) === normaliza(email));
      divergencias.push({
        email,
        tipo: "so_no_codigo",
        consequencia: existeDesativado
          ? "Este e-mail está DESATIVADO na tabela, então hoje ele não entra no painel. Mas ele continua na lista de emergência do código: " +
            "se o banco de dados ficar fora do ar, ele volta a entrar. Ou reative a pessoa, ou tire o e-mail da lista do código."
          : "Este e-mail está na lista de emergência do código, mas NÃO está cadastrado na tabela. Hoje ele não entra no painel. " +
            "Se o banco de dados ficar fora do ar, ele passa a entrar. Ou cadastre a pessoa aqui, ou tire o e-mail da lista do código.",
      });
    }
  }

  return divergencias;
}

/** Os e-mails que estão gravados dentro do código como plano B. */
export function listarPlanoB(): string[] {
  return [...SUPER_ADMIN_EMAILS];
}

export type ResumoEquipe = {
  total: number;
  ativos: number;
  inativos: number;
};

export function resumirEquipe(admins: PlatformAdminRow[]): ResumoEquipe {
  const ativos = admins.filter((a) => a.isActive).length;
  return { total: admins.length, ativos, inativos: admins.length - ativos };
}
