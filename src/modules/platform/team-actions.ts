"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

// ATENÇÃO: arquivo com "use server" só pode exportar FUNÇÃO ASYNC. Uma
// constante exportada aqui quebra o módulo inteiro em runtime -- por isso o
// tipo abaixo e as mensagens ficam sem `export`.
type Result = { ok: true; message?: string } | { ok: false; error: string };

/**
 * Mesma auditoria de `src/modules/platform/actions.ts`, reimplementada aqui de
 * propósito: aquele arquivo é "use server" e importar dele traria a função
 * como Server Action, não como helper.
 */
async function audit(
  actorEmail: string,
  action: string,
  target: string | null,
  before: unknown,
  after: unknown
) {
  const admin = createAdminClient();
  const { error } = await admin.from("audit_logs").insert({
    tenant_id: null,
    actor_email: actorEmail,
    action,
    target,
    before: before ?? null,
    after: after ?? null,
  });
  // Auditoria não pode derrubar a ação, mas silêncio total esconde problema.
  if (error) console.error("[platform/equipe] falha ao gravar auditoria:", error);
}

function normalizaEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Validação simples e honesta: tem um @, tem ponto depois dele, sem espaço. */
function emailParecValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function carregarAdmin(email: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("platform_admins")
    .select("email, name, role, is_active, created_at")
    .eq("email", email)
    .maybeSingle();
  if (error) {
    console.error("[platform/equipe] falha ao carregar administrador:", error);
    throw new Error("Não foi possível consultar a lista de administradores.");
  }
  return data;
}

/**
 * Quantos administradores ATIVOS existem além deste e-mail.
 *
 * É a trava que impede a plataforma de ficar sem nenhum dono. Ela mora AQUI,
 * no servidor, e não no botão da tela: um botão escondido não protege nada --
 * qualquer chamada direta à action passaria por cima.
 */
async function contarOutrosAtivos(exceto: string): Promise<number> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("platform_admins")
    .select("email")
    .eq("is_active", true)
    .neq("email", exceto);
  if (error) {
    console.error("[platform/equipe] falha ao contar administradores ativos:", error);
    // Fail-closed: se não dá para provar que sobra alguém, não desativa ninguém.
    throw new Error("Não foi possível conferir quantos administradores ativos existem.");
  }
  return (data ?? []).length;
}

/**
 * Concede o papel de administrador da plataforma a um e-mail.
 *
 * IMPORTANTE, e a tela diz isso ao usuário: esta ação NÃO cria conta, NÃO
 * define senha e NÃO envia senha temporária. Ela só concede permissão. A
 * pessoa precisa ter (ou criar) a própria conta com este mesmo e-mail.
 */
export async function addPlatformAdmin(input: {
  email: string;
  nome: string;
  papel: string;
}): Promise<Result> {
  const platformAdmin = await requireSuperAdmin();

  const email = normalizaEmail(input.email ?? "");
  if (!email) return { ok: false, error: "Escreva o e-mail da pessoa." };
  if (!emailParecValido(email)) {
    return { ok: false, error: "Esse e-mail não parece válido. Confira se está escrito certo." };
  }

  const papel = input.papel === "owner" ? "owner" : "staff";
  const nome = (input.nome ?? "").trim();

  const existente = await carregarAdmin(email);
  if (existente) {
    if (existente.is_active !== false) {
      return { ok: false, error: `${email} já é administrador da plataforma e está ativo.` };
    }
    return {
      ok: false,
      error: `${email} já está cadastrado, mas desativado. Use o botão "Ativar" na lista abaixo para devolver o acesso.`,
    };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("platform_admins")
    .insert({ email, name: nome || null, role: papel, is_active: true })
    .select("email");

  // `.insert()` não lança: devolve `{ error }`. Sem conferir erro E linha
  // afetada, a tela mentiria "salvo!" com o banco tendo recusado em silêncio.
  if (error || !data || data.length === 0) {
    console.error("[platform/equipe] falha ao cadastrar administrador:", error);
    return { ok: false, error: "Não foi possível cadastrar este administrador. Tente de novo." };
  }

  await audit(platformAdmin.email, "administrador_plataforma_adicionado", email, null, {
    email,
    name: nome || null,
    role: papel,
  });
  revalidatePath("/super/equipe");
  return {
    ok: true,
    message: `${email} agora tem permissão de administrador. Ela ainda precisa ter uma conta com este mesmo e-mail para conseguir entrar.`,
  };
}

/**
 * Liga e desliga o acesso de um administrador.
 *
 * A trava mais importante desta tela: nunca deixar a plataforma sem NENHUM
 * administrador ativo. Se sobrar zero, a recusa é aqui no servidor.
 */
export async function setPlatformAdminActive(email: string, ativo: boolean): Promise<Result> {
  const platformAdmin = await requireSuperAdmin();

  const alvo = normalizaEmail(email ?? "");
  if (!alvo) return { ok: false, error: "E-mail não informado." };

  const antes = await carregarAdmin(alvo);
  if (!antes) return { ok: false, error: "Este administrador não foi encontrado." };

  if (antes.is_active === ativo) {
    return { ok: false, error: ativo ? "Este administrador já está ativo." : "Este administrador já está desativado." };
  }

  if (!ativo) {
    const outrosAtivos = await contarOutrosAtivos(alvo);
    if (outrosAtivos === 0) {
      return {
        ok: false,
        error: "Você é o último administrador ativo. Adicione outro antes de se remover.",
      };
    }
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("platform_admins")
    .update({ is_active: ativo })
    .eq("email", alvo)
    .select("email");

  if (error || !data || data.length === 0) {
    console.error("[platform/equipe] falha ao alterar o acesso do administrador:", error);
    return { ok: false, error: "Não foi possível alterar o acesso deste administrador. Tente de novo." };
  }

  await audit(
    platformAdmin.email,
    ativo ? "administrador_plataforma_ativado" : "administrador_plataforma_desativado",
    alvo,
    antes,
    { is_active: ativo }
  );
  revalidatePath("/super/equipe");
  return {
    ok: true,
    message: ativo
      ? `${alvo} voltou a ter acesso ao painel da plataforma.`
      : `${alvo} não entra mais no painel da plataforma.`,
  };
}
