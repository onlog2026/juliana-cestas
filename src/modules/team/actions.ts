"use server";

import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureModuleForAction } from "@/lib/auth/require-module";
import { getEntitlements } from "@/modules/entitlements/service";
import { getEnv } from "@/lib/env";
import {
  avaliarLimiteEquipe,
  contarAtivos,
  emailValido,
  getLimitePlanoEquipe,
  limparModulos,
  listTeamInvites,
  listTeamMembers,
  modulosParaPermissao,
  podeDesativarMembro,
  podeTrocarPapel,
  type TeamRole,
} from "@/modules/team/service";

/**
 * AÇÕES DA EQUIPE.
 *
 * Duas coisas que este arquivo NUNCA faz, e não é por preguiça:
 *
 *  1. **Nunca cria conta com senha, nunca gera senha temporária, nunca mexe na
 *     senha de ninguém.** O convite é o do próprio Supabase
 *     (`auth.admin.inviteUserByEmail`): a pessoa recebe um e-mail, clica, e
 *     define a senha dela mesma, num campo que nem nós nem a lojista vemos.
 *     Senha temporária enviada por WhatsApp é como vaza acesso de painel.
 *  2. **Nunca apaga uma pessoa.** Desativa. `profiles` é referenciado por
 *     histórico (quem alterou o quê); apagar a linha apaga o rastro junto.
 *
 * Toda ação passa por `ensureModuleForAction("equipe")` -- server action é um
 * endereço HTTP como qualquer outro; sumir do menu não é trava.
 */

type Ok = { ok: true };
type Falha = { ok: false; error: string };
type Resultado = Ok | Falha;

/** O endereço para onde a pessoa volta depois de definir a senha dela. */
async function enderecoDeVolta(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
      return `${proto}://${host}/admin/login`;
    }
  } catch {
    // Fora de uma requisição (não deveria acontecer numa action) -- cai no env.
  }
  const base = (getEnv().NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "");
  return `${base}/admin/login`;
}

/**
 * Convida alguém para a equipe.
 *
 * O que acontece, em ordem: confere o módulo, confere o e-mail, confere o
 * limite do plano NO SERVIDOR (esconder o botão não é limite), manda o convite
 * do Supabase, e só então cria o perfil já com as permissões marcadas.
 */
export async function convidarPessoa(input: {
  email: string;
  name: string;
  role: TeamRole;
  allowedModules: string[];
}): Promise<Resultado> {
  const gate = await ensureModuleForAction("equipe");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  const email = (input.email ?? "").trim().toLowerCase();
  if (!emailValido(email)) {
    return { ok: false, error: "Escreva um e-mail válido, no formato nome@empresa.com.br." };
  }

  const papel: TeamRole = input.role === "admin" ? "admin" : "staff";

  // O limite do plano é conferido AQUI, no servidor. A tela também esconde o
  // botão quando não há vaga, mas esconder botão não impede ninguém de chamar
  // esta função direto -- foi assim que, no Agentop, uma empresa inadimplente
  // continuou usando módulo pago por meses.
  const [membros, convites, limitePlano, ent] = await Promise.all([
    listTeamMembers(staff.tenantId),
    listTeamInvites(staff.tenantId),
    getLimitePlanoEquipe(staff.tenantId),
    getEntitlements(staff),
  ]);

  const pendentes = convites.filter((c) => !c.aceito && !c.vencido).length;
  const limite = avaliarLimiteEquipe(limitePlano, contarAtivos(membros), pendentes);
  if (!limite.podeConvidar) return { ok: false, error: limite.mensagem };

  if (membros.some((m) => (m.email ?? "").toLowerCase() === email)) {
    return { ok: false, error: "Essa pessoa já faz parte da equipe desta loja." };
  }

  const disponiveis = modulosParaPermissao(ent.allowed).map((m) => m.slug);
  const modulos = limparModulos(input.allowedModules, disponiveis);

  const admin = createAdminClient();

  // O convite de verdade. Nenhuma senha é criada nem enviada por aqui: o
  // Supabase manda o e-mail e a pessoa define a senha dela no link.
  const { data: convite, error: conviteErro } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: await enderecoDeVolta(),
  });

  if (conviteErro || !convite?.user?.id) {
    const codigo = (conviteErro as { code?: string; message?: string } | null)?.code ?? "";
    const texto = (conviteErro?.message ?? "").toLowerCase();
    if (codigo === "email_exists" || texto.includes("already been registered") || texto.includes("already exists")) {
      return {
        ok: false,
        error:
          "Já existe uma conta com esse e-mail nesta plataforma (pode ser uma conta de cliente da loja). Use outro e-mail para o acesso ao painel.",
      };
    }
    console.error("[equipe] falha ao enviar o convite:", conviteErro);
    return {
      ok: false,
      error: "Não foi possível enviar o convite agora. Confira o e-mail e tente de novo em alguns minutos.",
    };
  }

  const novoId = convite.user.id;

  const { data: perfil, error: perfilErro } = await admin
    .from("profiles")
    .insert({
      id: novoId,
      tenant_id: staff.tenantId,
      role: papel,
      name: (input.name ?? "").trim() || null,
      active: true,
      allowed_modules: modulos,
    })
    .select("id");

  // `.insert()` do Supabase não lança: sem checar o retorno, a tela diria
  // "convite enviado" com o perfil inexistente -- e a pessoa entraria e cairia
  // no login de novo, sem ninguém entender por quê.
  if (perfilErro || !perfil || perfil.length === 0) {
    console.error("[equipe] convite enviado mas o perfil não foi criado:", perfilErro);
    return {
      ok: false,
      error:
        "O convite foi enviado, mas não consegui salvar as permissões dessa pessoa. Chame o suporte antes que ela clique no link.",
    };
  }

  // Registro do convite. O token é gerado e guardado em HASH -- nunca em claro.
  const token = randomUUID();
  await admin.from("team_invites").insert({
    tenant_id: staff.tenantId,
    email,
    allowed_modules: modulos,
    invited_by: staff.id,
    token_hash: createHash("sha256").update(token).digest("hex"),
  });

  revalidatePath("/admin/equipe");
  return { ok: true };
}

/** Muda papel e permissões de quem já está na equipe. */
export async function atualizarPermissoes(input: {
  id: string;
  name: string;
  role: TeamRole;
  allowedModules: string[];
}): Promise<Resultado> {
  const gate = await ensureModuleForAction("equipe");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  const papel: TeamRole = input.role === "admin" ? "admin" : "staff";

  const [membros, ent] = await Promise.all([listTeamMembers(staff.tenantId), getEntitlements(staff)]);

  // A MESMA trava do desativar, pela outra porta: rebaixar a última dona deixa
  // a loja órfã exatamente como desativá-la deixaria.
  const regra = podeTrocarPapel(input.id, papel, membros);
  if (!regra.ok) return { ok: false, error: regra.mensagem };

  const disponiveis = modulosParaPermissao(ent.allowed).map((m) => m.slug);
  const modulos = limparModulos(input.allowedModules, disponiveis);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .update({
      role: papel,
      name: (input.name ?? "").trim() || null,
      allowed_modules: modulos,
    })
    .eq("id", input.id)
    .eq("tenant_id", staff.tenantId)
    .select("id");

  if (error || !data || data.length === 0) {
    console.error("[equipe] falha ao salvar as permissões:", error);
    return { ok: false, error: "Não foi possível salvar as permissões dessa pessoa." };
  }

  revalidatePath("/admin/equipe");
  return { ok: true };
}

/**
 * Ativa ou desativa alguém da equipe.
 *
 * A TRAVA: a loja nunca fica sem nenhuma dona ativa. Recusa com texto que
 * explica o que fazer, não com "operação não permitida".
 */
export async function definirPessoaAtiva(input: { id: string; active: boolean }): Promise<Resultado> {
  const gate = await ensureModuleForAction("equipe");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  const membros = await listTeamMembers(staff.tenantId);

  if (!input.active) {
    const regra = podeDesativarMembro(input.id, membros);
    if (!regra.ok) return { ok: false, error: regra.mensagem };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .update({ active: input.active })
    .eq("id", input.id)
    .eq("tenant_id", staff.tenantId)
    .select("id");

  if (error || !data || data.length === 0) {
    console.error("[equipe] falha ao mudar a situação da pessoa:", error);
    return { ok: false, error: "Não foi possível mudar a situação dessa pessoa." };
  }

  revalidatePath("/admin/equipe");
  return { ok: true };
}

/** Manda o convite de novo (mesmo e-mail, mesmas permissões já salvas). */
export async function reenviarConvite(id: string): Promise<Resultado> {
  const gate = await ensureModuleForAction("equipe");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  const admin = createAdminClient();
  const { data: convite } = await admin
    .from("team_invites")
    .select("id, email, accepted_at")
    .eq("id", id)
    .eq("tenant_id", staff.tenantId)
    .maybeSingle();

  if (!convite) return { ok: false, error: "Convite não encontrado nesta loja." };
  if ((convite as { accepted_at: string | null }).accepted_at) {
    return { ok: false, error: "Esse convite já foi aceito. A pessoa já pode entrar no painel." };
  }

  const email = (convite as { email: string }).email;
  const { error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: await enderecoDeVolta() });
  if (error) {
    console.error("[equipe] falha ao reenviar o convite:", error);
    return {
      ok: false,
      error: "Não foi possível reenviar agora. Se a pessoa já criou a senha dela, peça para ela entrar direto pelo painel.",
    };
  }

  const { data: atualizado } = await admin
    .from("team_invites")
    .update({ expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })
    .eq("id", id)
    .eq("tenant_id", staff.tenantId)
    .select("id");

  if (!atualizado || atualizado.length === 0) {
    return { ok: false, error: "O convite foi reenviado, mas não consegui atualizar o prazo. Confira a lista." };
  }

  revalidatePath("/admin/equipe");
  return { ok: true };
}

/** Apaga o REGISTRO de um convite (não mexe em nenhuma pessoa da equipe). */
export async function cancelarConvite(id: string): Promise<Resultado> {
  const gate = await ensureModuleForAction("equipe");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  const admin = createAdminClient();
  const { error } = await admin.from("team_invites").delete().eq("id", id).eq("tenant_id", staff.tenantId);
  if (error) {
    console.error("[equipe] falha ao cancelar o convite:", error);
    return { ok: false, error: "Não foi possível cancelar esse convite." };
  }

  revalidatePath("/admin/equipe");
  return { ok: true };
}
