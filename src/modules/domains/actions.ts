"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureModuleForAction } from "@/lib/auth/require-module";
import { getEnv } from "@/lib/env";
import {
  buildDnsInstructions,
  getTenantDomain,
  hostJaCadastrado,
  isPlatformOrInternalHost,
  isValidHostnameFormat,
  normalizeDomainHost,
} from "@/modules/domains/service";
import { verificarDnsDoHost } from "@/modules/domains/verify";

/**
 * AÇÕES DO MÓDULO "DOMÍNIO PRÓPRIO".
 *
 * As três coisas que a lojista pode fazer: cadastrar, conferir o DNS de novo,
 * e remover. Nenhuma delas fala com a Vercel -- ver o comentário no topo de
 * `service.ts` para a explicação completa do que este módulo é e não é.
 */

type Ok = { ok: true };
type Falha = { ok: false; error: string };
type Resultado = Ok | Falha;

const PATH = "/admin/dominio";

/** Cadastra um domínio novo para a loja e devolve as instruções de DNS já salvas. */
export async function cadastrarDominio(input: { host: string }): Promise<Resultado> {
  const gate = await ensureModuleForAction("dominio");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  const host = normalizeDomainHost(input.host);
  if (!isValidHostnameFormat(host)) {
    return {
      ok: false,
      error: "Escreva um endereço de domínio válido, por exemplo www.sualoja.com.br.",
    };
  }

  const env = getEnv();
  if (isPlatformOrInternalHost(host, { platformDomain: env.PLATFORM_DOMAIN, siteUrl: env.NEXT_PUBLIC_SITE_URL })) {
    return {
      ok: false,
      error: "Esse endereço é reservado da própria plataforma e não pode ser usado como domínio de loja.",
    };
  }

  // Checagem amigável ANTES do banco. A constraint UNIQUE de `tenant_domains`
  // continua sendo a garantia final contra duas gravações ao mesmo tempo --
  // isto só existe para não devolver um erro técnico numa tela de lojista.
  if (await hostJaCadastrado(host)) {
    return {
      ok: false,
      error: "Esse domínio já está cadastrado (por esta ou por outra loja). Use outro endereço.",
    };
  }

  const instrucoes = buildDnsInstructions(host, env.PLATFORM_DOMAIN);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tenant_domains")
    .insert({
      tenant_id: staff.tenantId,
      host,
      status: "pendente",
      dns_instructions: instrucoes,
    })
    .select("id");

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Esse domínio já está cadastrado (por esta ou por outra loja). Use outro endereço." };
    }
    console.error("[dominio] falha ao cadastrar:", error);
    return { ok: false, error: "Não foi possível cadastrar esse domínio agora. Tente de novo em alguns minutos." };
  }
  if (!data || data.length === 0) {
    console.error("[dominio] insert sem erro mas sem linha devolvida");
    return { ok: false, error: "Não foi possível confirmar o cadastro. Recarregue a página e confira se ele apareceu." };
  }

  revalidatePath(PATH);
  return { ok: true };
}

/**
 * Consulta o DNS agora e grava o resultado.
 *
 * Sempre atualiza `last_checked_at`, esteja o resultado certo ou não -- é o
 * que permite a tela dizer "última conferência: agora há pouco" mesmo quando
 * dá erro.
 */
export async function verificarDominioAgora(id: string): Promise<Resultado> {
  const gate = await ensureModuleForAction("dominio");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  const dominio = await getTenantDomain(staff.tenantId, id);
  if (!dominio) return { ok: false, error: "Esse domínio não foi encontrado nesta loja." };

  const admin = createAdminClient();
  const agora = new Date().toISOString();

  const resultado = await verificarDnsDoHost(dominio.host, dominio.dnsInstructions);

  const { data, error } = await admin
    .from("tenant_domains")
    .update({
      status: resultado.status,
      last_checked_at: agora,
      verified_at: resultado.status === "verificado" ? agora : dominio.verifiedAt,
      error_message: resultado.status === "erro" ? resultado.motivo : null,
    })
    .eq("id", id)
    .eq("tenant_id", staff.tenantId)
    .select("id");

  if (error || !data || data.length === 0) {
    console.error("[dominio] falha ao salvar o resultado da verificação:", error);
    return { ok: false, error: "A verificação rodou, mas não consegui salvar o resultado. Tente de novo." };
  }

  revalidatePath(PATH);

  if (resultado.status === "erro") return { ok: false, error: resultado.motivo };
  return { ok: true };
}

/** Remove o cadastro. Pode ser feito a qualquer momento -- não é uma ação irreversível de dados de venda. */
export async function removerDominio(id: string): Promise<Resultado> {
  const gate = await ensureModuleForAction("dominio");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  const admin = createAdminClient();
  const { error } = await admin.from("tenant_domains").delete().eq("id", id).eq("tenant_id", staff.tenantId);
  if (error) {
    console.error("[dominio] falha ao remover:", error);
    return { ok: false, error: "Não foi possível remover esse domínio agora." };
  }

  revalidatePath(PATH);
  return { ok: true };
}
