import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAlwaysAvailable, isCoreModule, MODULE_REGISTRY } from "@/lib/modules/registry";

/**
 * EQUIPE DA LOJA — leitura e, sobretudo, as REGRAS.
 *
 * As regras deste arquivo são funções PURAS (não leem banco, não leem relógio,
 * não leem `headers()`): recebem tudo por parâmetro. É o mesmo desenho de
 * `src/modules/entitlements/resolve.ts`, e pelo mesmo motivo -- regra de acesso
 * que só existe dentro de uma consulta ao banco não pode ser provada, e regra
 * de acesso que não é provada erra em silêncio.
 *
 * As duas que mais importam:
 *
 *  1. `pessoaPodeVerModulo` — licença POR PESSOA. Lista vazia concede NADA além
 *     do núcleo. É o inverso do padrão "vazio = tudo liberado", que parece
 *     conveniente e é como se dá o painel inteiro para a pessoa que você
 *     acabou de contratar para responder o WhatsApp.
 *  2. `podeDesativarMembro` — a loja NUNCA pode ficar sem nenhum dono ativo.
 *     Sem esta trava, um clique deixa a loja sem ninguém que consiga convidar
 *     alguém de volta -- e a saída passa a ser o suporte mexendo no banco.
 */

export type TeamRole = "admin" | "staff";

export type TeamMember = {
  id: string;
  email: string | null;
  name: string | null;
  role: TeamRole;
  active: boolean;
  allowedModules: string[];
  createdAt: string | null;
};

export type TeamInvite = {
  id: string;
  email: string;
  allowedModules: string[];
  createdAt: string | null;
  expiresAt: string | null;
  aceito: boolean;
  vencido: boolean;
};

/** Um módulo que a lojista pode marcar na caixinha de permissão de alguém. */
export type ModuloParaPermissao = {
  slug: string;
  name: string;
  description: string;
  /** Núcleo: todo mundo vê, não dá para desmarcar. */
  core: boolean;
};

// ── Regras puras ────────────────────────────────────────────────────────────

/**
 * Esta pessoa, desta loja, pode abrir este módulo?
 *
 * Ordem deliberada:
 *  1. Pessoa desativada não abre nada. Vem antes de tudo, inclusive de "é dona".
 *  2. Dona da loja (`role = 'admin'`) vê tudo -- exceção implícita, e é ela
 *     quem distribui as permissões dos outros. Dona sem permissão de nada seria
 *     uma loja trancada por dentro.
 *  3. Núcleo e as telas que nunca fecham (configurações, assinatura) valem para
 *     qualquer pessoa da equipe: sem elas "trabalhar na loja" não quer dizer nada.
 *  4. O resto: só o que estiver marcado. Lista vazia = nada além do passo 3.
 *
 * ATENÇÃO (limite conhecido): esta função existe e está testada, mas ainda NÃO
 * é chamada por `requireStaffWithModule` / `ensureModuleForAction`
 * (src/lib/auth/require-module.ts), que hoje só olham o plano da LOJA. Enquanto
 * essa ligação não for feita, a permissão por pessoa vale como organização da
 * equipe, não como trava de servidor.
 */
export function pessoaPodeVerModulo(
  pessoa: { role: TeamRole; active: boolean; allowedModules: string[] | null },
  slug: string
): boolean {
  const modulo = (slug ?? "").trim().toLowerCase();
  if (!pessoa.active) return false;
  if (pessoa.role === "admin") return true;
  if (isCoreModule(modulo) || isAlwaysAvailable(modulo)) return true;
  return (pessoa.allowedModules ?? []).includes(modulo);
}

/** Quantas pessoas ativas a loja tem hoje. */
export function contarAtivos(membros: Pick<TeamMember, "active">[]): number {
  return membros.filter((m) => m.active).length;
}

/** Quantos DONOS ativos a loja tem hoje. */
export function contarDonosAtivos(membros: Pick<TeamMember, "role" | "active">[]): number {
  return membros.filter((m) => m.active && m.role === "admin").length;
}

export type RegraResultado = { ok: true } | { ok: false; mensagem: string };

const SEM_DONO =
  "Esta é a última pessoa com acesso de dona da loja. Se ela sair, ninguém consegue convidar alguém de volta nem mudar permissões. Promova outra pessoa a dona antes de fazer isso.";

const ULTIMA_PESSOA =
  "Esta é a única pessoa da equipe desta loja. Não é possível excluir — sempre precisa sobrar pelo menos uma.";

/**
 * Pode EXCLUIR (apagar de vez, não só desativar) esta pessoa?
 *
 * Duas respostas "não", nesta ordem:
 *  1. Ela é a última pessoa da equipe, ponto -- a loja nunca pode ficar com
 *     zero pessoas. Esta é a trava mais simples e vem antes de tudo.
 *  2. Ela não é a última pessoa, mas é a última DONA ativa -- sobrariam
 *     pessoas, mas nenhuma capaz de convidar alguém de volta ou gerenciar a
 *     equipe. Mesmo raciocínio de `podeDesativarMembro`, só que aqui não tem
 *     volta: excluir apaga o cadastro, não dá para "reativar" depois.
 *
 * Excluir é diferente de desativar: o cadastro em `profiles` some de vez (a
 * pessoa deixa de aparecer em qualquer lista, relatório ou histórico futuro
 * mostrado por nome). Por isso a ação que chama esta regra sempre pede
 * confirmação antes -- ver `EquipeManager`.
 */
export function podeExcluirMembro(
  alvoId: string,
  membros: Pick<TeamMember, "id" | "role" | "active">[]
): RegraResultado {
  const alvo = membros.find((m) => m.id === alvoId);
  if (!alvo) return { ok: false, mensagem: "Essa pessoa não faz parte da equipe desta loja." };
  if (membros.length <= 1) return { ok: false, mensagem: ULTIMA_PESSOA };

  if (alvo.active && alvo.role === "admin") {
    const outrosDonosAtivos = membros.filter((m) => m.id !== alvoId && m.active && m.role === "admin").length;
    if (outrosDonosAtivos === 0) return { ok: false, mensagem: SEM_DONO };
  }

  return { ok: true };
}

/**
 * Pode desativar esta pessoa?
 *
 * A única resposta "não" é: ela é a última dona ATIVA da loja.
 */
export function podeDesativarMembro(
  alvoId: string,
  membros: Pick<TeamMember, "id" | "role" | "active">[]
): RegraResultado {
  const alvo = membros.find((m) => m.id === alvoId);
  if (!alvo) return { ok: false, mensagem: "Essa pessoa não faz parte da equipe desta loja." };
  if (!alvo.active) return { ok: true }; // já está desativada: nada muda
  if (alvo.role !== "admin") return { ok: true };

  const outrosDonosAtivos = membros.filter((m) => m.id !== alvoId && m.active && m.role === "admin").length;
  if (outrosDonosAtivos === 0) return { ok: false, mensagem: SEM_DONO };
  return { ok: true };
}

/**
 * Pode mudar o papel desta pessoa para `novoPapel`?
 *
 * Mesma trava, por outra porta: rebaixar a última dona para "equipe" deixa a
 * loja sem dono exatamente como desativá-la deixaria. Duas telas, um único
 * jeito de a loja ficar órfã -- as duas passam por aqui.
 */
export function podeTrocarPapel(
  alvoId: string,
  novoPapel: TeamRole,
  membros: Pick<TeamMember, "id" | "role" | "active">[]
): RegraResultado {
  const alvo = membros.find((m) => m.id === alvoId);
  if (!alvo) return { ok: false, mensagem: "Essa pessoa não faz parte da equipe desta loja." };
  if (novoPapel === "admin") return { ok: true };
  if (alvo.role !== "admin" || !alvo.active) return { ok: true };

  const outrosDonosAtivos = membros.filter((m) => m.id !== alvoId && m.active && m.role === "admin").length;
  if (outrosDonosAtivos === 0) return { ok: false, mensagem: SEM_DONO };
  return { ok: true };
}

export type LimiteEquipe = {
  /** `null` = o plano não define limite. Não inventamos um. */
  maximo: number | null;
  ativos: number;
  /** Pendentes contam: o convite já foi enviado, a vaga já está reservada. */
  convitesPendentes: number;
  ocupadas: number;
  podeConvidar: boolean;
  /** Frase pronta para a tela, sempre em português. */
  mensagem: string;
};

/**
 * O limite de pessoas do plano, resolvido.
 *
 * Regra explícita do dono: **se o plano não define limite, não limitamos** -- e
 * a tela diz isso com todas as letras, em vez de deixar a lojista adivinhando
 * se pode convidar mais alguém.
 */
export function avaliarLimiteEquipe(
  maxTeamMembers: number | null | undefined,
  ativos: number,
  convitesPendentes: number
): LimiteEquipe {
  const ocupadas = ativos + convitesPendentes;
  const maximo =
    typeof maxTeamMembers === "number" && Number.isFinite(maxTeamMembers) && maxTeamMembers > 0
      ? Math.floor(maxTeamMembers)
      : null;

  if (maximo === null) {
    return {
      maximo: null,
      ativos,
      convitesPendentes,
      ocupadas,
      podeConvidar: true,
      mensagem: "Seu plano não define um limite de pessoas na equipe. Você pode convidar quantas precisar.",
    };
  }

  const restantes = maximo - ocupadas;
  if (restantes <= 0) {
    return {
      maximo,
      ativos,
      convitesPendentes,
      ocupadas,
      podeConvidar: false,
      mensagem: `Seu plano permite ${maximo} ${maximo === 1 ? "pessoa" : "pessoas"} na equipe e as vagas já estão ocupadas. Desative alguém ou mude de plano para convidar mais.`,
    };
  }

  return {
    maximo,
    ativos,
    convitesPendentes,
    ocupadas,
    podeConvidar: true,
    mensagem: `Seu plano permite ${maximo} ${maximo === 1 ? "pessoa" : "pessoas"} na equipe. ${restantes === 1 ? "Falta 1 vaga" : `Faltam ${restantes} vagas`}.`,
  };
}

/** E-mail escrito de um jeito que dá para enviar convite. */
export function emailValido(email: string): boolean {
  const limpo = (email ?? "").trim().toLowerCase();
  if (limpo.length < 5 || limpo.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(limpo);
}

/**
 * Só entram permissões que EXISTEM no registro de módulos, sem repetição e sem
 * o núcleo (que todo mundo já tem). O que vem do navegador é sugestão, não
 * verdade: sem esta limpeza, um `allowed_modules` com lixo viraria dado
 * permanente no banco.
 */
export function limparModulos(entrada: unknown, disponiveis: readonly string[]): string[] {
  if (!Array.isArray(entrada)) return [];
  const permitidos = new Set(disponiveis);
  const saida = new Set<string>();
  for (const item of entrada) {
    if (typeof item !== "string") continue;
    const slug = item.trim().toLowerCase();
    if (!slug || isCoreModule(slug) || isAlwaysAvailable(slug)) continue;
    if (!permitidos.has(slug)) continue;
    saida.add(slug);
  }
  return [...saida];
}

// ── Leitura do banco ────────────────────────────────────────────────────────

/**
 * Os módulos que esta LOJA pode distribuir para a equipe.
 *
 * Não dá para dar a alguém o que a loja não tem: a lista sai do que o plano
 * liberou (`entitlements.allowed`), cruzado com o registro de módulos. O núcleo
 * fica de fora porque não é escolha -- é o mínimo de todo mundo.
 */
export function modulosParaPermissao(liberadosDaLoja: readonly string[]): ModuloParaPermissao[] {
  const liberados = new Set(liberadosDaLoja);
  return MODULE_REGISTRY.filter((m) => !m.isCore && liberados.has(m.slug)).map((m) => ({
    slug: m.slug,
    name: m.name,
    description: m.description,
    core: false,
  }));
}

type ProfileRow = {
  id: string;
  role: string;
  name: string | null;
  active: boolean | null;
  allowed_modules: string[] | null;
  created_at: string | null;
};

/**
 * A equipe da loja, com o e-mail de cada pessoa.
 *
 * O e-mail mora em `auth.users`, não em `profiles` -- por isso a segunda ida.
 * É `getUserById` por pessoa, e não `listUsers()`, de propósito: `listUsers()`
 * traria TODOS os usuários do projeto (inclusive os clientes da loja, que também
 * têm conta) só para descobrir três e-mails.
 */
export async function listTeamMembers(tenantId: string): Promise<TeamMember[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, role, name, active, allowed_modules, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[equipe] falha ao ler a equipe:", error);
    return [];
  }

  const linhas = (data ?? []) as ProfileRow[];

  const emails = await Promise.all(
    linhas.map(async (linha) => {
      try {
        const { data: userData } = await admin.auth.admin.getUserById(linha.id);
        return userData?.user?.email ?? null;
      } catch {
        return null;
      }
    })
  );

  return linhas.map((linha, i) => ({
    id: linha.id,
    email: emails[i],
    name: linha.name,
    role: linha.role === "admin" ? "admin" : "staff",
    active: linha.active !== false,
    allowedModules: linha.allowed_modules ?? [],
    createdAt: linha.created_at,
  }));
}

/** Convites desta loja (mais novos primeiro). */
export async function listTeamInvites(tenantId: string): Promise<TeamInvite[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("team_invites")
    .select("id, email, allowed_modules, created_at, expires_at, accepted_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[equipe] falha ao ler os convites:", error);
    return [];
  }

  const agora = Date.now();
  return (data ?? []).map((r) => {
    const row = r as {
      id: string;
      email: string;
      allowed_modules: string[] | null;
      created_at: string | null;
      expires_at: string | null;
      accepted_at: string | null;
    };
    const venc = row.expires_at ? new Date(row.expires_at).getTime() : null;
    return {
      id: row.id,
      email: row.email,
      allowedModules: row.allowed_modules ?? [],
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      aceito: Boolean(row.accepted_at),
      vencido: !row.accepted_at && venc !== null && venc < agora,
    };
  });
}

/**
 * Quantas pessoas o plano desta loja permite.
 *
 * Devolve `null` quando não dá para saber (loja sem plano, plano sem limite,
 * consulta que falhou). `null` significa "não limite" -- errar liberando é o
 * lado certo de errar quando a alternativa é impedir a lojista de colocar a
 * própria irmã para ajudar num sábado de dia das mães.
 */
export async function getLimitePlanoEquipe(tenantId: string): Promise<number | null> {
  const admin = createAdminClient();

  const { data: tenantRow, error: tenantErr } = await admin
    .from("tenants")
    .select("subscription_plan")
    .eq("id", tenantId)
    .maybeSingle();
  if (tenantErr || !tenantRow?.subscription_plan) return null;

  const { data: planRow, error: planErr } = await admin
    .from("subscription_plans")
    .select("max_team_members")
    .eq("slug", tenantRow.subscription_plan as string)
    .maybeSingle();
  if (planErr || !planRow) return null;

  const valor = (planRow as { max_team_members: number | null }).max_team_members;
  return typeof valor === "number" ? valor : null;
}
