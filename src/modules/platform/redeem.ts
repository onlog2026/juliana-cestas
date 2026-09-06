import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Resgate de cortesia pela LOJISTA.
 *
 * Esta é a outra metade da tela `/super/vouchers`: lá o dono da plataforma
 * GERA o código; aqui alguém RESGATA. Sem este arquivo o código entregue não
 * libera nada e a cortesia fica eternamente "Disponível" -- botão sem backend
 * é exatamente o tipo de ponta solta que não pode ir para produção.
 *
 * Três coisas que valem o comentário:
 *
 * 1. O código chega do navegador; a LOJA não. `tenantId` vem sempre de
 *    `requireStaff()`. Se viesse do formulário, qualquer um resgataria uma
 *    cortesia nominal na loja de outro.
 * 2. O consumo do uso é feito com trava otimista (`.eq("used_count", n)`).
 *    Dois cliques ao mesmo tempo num código de uso único: o segundo não
 *    encontra a linha com aquele contador e é recusado. Sem isso, um código
 *    de "1 uso" liberaria duas lojas.
 * 3. Cortesia NUNCA encurta acesso existente. Se a loja já tem bônus até
 *    dezembro e resgata mais 30 dias, vai para janeiro -- nunca volta.
 */

export type RedeemResult =
  | { ok: true; ate: string; planoSlug: string | null; modulos: string[] }
  | { ok: false; error: string };

type VoucherRow = {
  id: string;
  code: string;
  tenant_id: string | null;
  grant_plan_slug: string | null;
  grant_modules: string[] | null;
  access_days: number;
  valid_until: string | null;
  max_uses: number;
  used_count: number;
  note: string | null;
};

/** Normaliza o que a pessoa digitou: espaço sobrando e minúscula não invalidam. */
export function normalizeVoucherCode(raw: string): string {
  return (raw ?? "").trim().toUpperCase().replace(/\s+/g, "");
}

/** Junta listas de módulos sem repetir e sem perder o que já estava liberado. */
export function mergeModules(atuais: string[] | null, novos: string[] | null): string[] {
  return Array.from(new Set([...(atuais ?? []), ...(novos ?? [])].map((m) => m.trim()).filter(Boolean)));
}

/**
 * A data em que a cortesia termina.
 * Parte do maior valor entre "agora" e o bônus que já existe -- nunca encurta.
 */
export function calcularFimDoBonus(
  bonusAtual: string | null,
  dias: number,
  agora: Date
): Date {
  const atual = bonusAtual ? new Date(bonusAtual) : null;
  const base = atual && !Number.isNaN(atual.getTime()) && atual > agora ? atual : agora;
  return new Date(base.getTime() + dias * 86400000);
}

export async function redeemVoucherForTenant(
  tenantId: string,
  codigoDigitado: string,
  actorEmail: string | null
): Promise<RedeemResult> {
  const code = normalizeVoucherCode(codigoDigitado);
  if (!code) return { ok: false, error: "Digite o código da cortesia." };

  const admin = createAdminClient();
  const agora = new Date();

  const { data: voucher, error: erroLeitura } = await admin
    .from("vouchers")
    .select(
      "id, code, tenant_id, grant_plan_slug, grant_modules, access_days, valid_until, max_uses, used_count, note"
    )
    .eq("code", code)
    .maybeSingle<VoucherRow>();

  if (erroLeitura) {
    console.error("[vouchers] falha ao ler a cortesia:", erroLeitura);
    return { ok: false, error: "Não consegui verificar o código agora. Tente de novo em instantes." };
  }

  // Mensagem de propósito genérica: dizer "esse código existe mas não é seu"
  // entregaria informação para quem fica tentando códigos no chute.
  const recusa = { ok: false as const, error: "Código inválido, já usado ou fora do prazo." };

  if (!voucher) return recusa;
  if (voucher.used_count >= voucher.max_uses) return recusa;
  if (voucher.valid_until && new Date(voucher.valid_until) < agora) return recusa;
  if (voucher.tenant_id && voucher.tenant_id !== tenantId) return recusa;

  const { data: loja, error: erroLoja } = await admin
    .from("tenants")
    .select("id, slug, bonus_until, granted_modules")
    .eq("id", tenantId)
    .maybeSingle<{
      id: string;
      slug: string;
      bonus_until: string | null;
      granted_modules: string[] | null;
    }>();

  if (erroLoja || !loja) {
    console.error("[vouchers] falha ao ler a loja:", erroLoja);
    return { ok: false, error: "Não consegui carregar os dados da sua loja. Tente de novo." };
  }

  const ate = calcularFimDoBonus(loja.bonus_until, voucher.access_days, agora);
  const modulos = mergeModules(loja.granted_modules, voucher.grant_modules);

  // Passo 1: consumir o uso com trava otimista. Se outra pessoa resgatou entre
  // a leitura e agora, o contador mudou e esta linha não é encontrada.
  const { data: consumido, error: erroConsumo } = await admin
    .from("vouchers")
    .update({
      used_count: voucher.used_count + 1,
      redeemed_by: actorEmail,
      redeemed_at: agora.toISOString(),
    })
    .eq("id", voucher.id)
    .eq("used_count", voucher.used_count)
    .select("id");

  if (erroConsumo || !consumido || consumido.length === 0) {
    return recusa;
  }

  // Passo 2: liberar o acesso. Se ISTO falhar, devolvemos o uso -- cortesia
  // consumida sem acesso liberado é o pior estado possível: o cliente perdeu
  // o código e não ganhou nada.
  const { data: liberado, error: erroLiberacao } = await admin
    .from("tenants")
    .update({
      bonus_until: ate.toISOString(),
      bonus_plan_slug: voucher.grant_plan_slug,
      bonus_reason: `Cortesia ${voucher.code}${voucher.note ? ` — ${voucher.note}` : ""}`,
      bonus_granted_by: `resgate:${actorEmail ?? "desconhecido"}`,
      bonus_granted_at: agora.toISOString(),
      granted_modules: modulos,
      granted_modules_until: ate.toISOString(),
    })
    .eq("id", tenantId)
    .select("id");

  if (erroLiberacao || !liberado || liberado.length === 0) {
    console.error("[vouchers] liberação falhou, devolvendo o uso:", erroLiberacao);
    await admin
      .from("vouchers")
      .update({ used_count: voucher.used_count, redeemed_by: null, redeemed_at: null })
      .eq("id", voucher.id)
      .eq("used_count", voucher.used_count + 1);
    return { ok: false, error: "Não consegui liberar o acesso agora. Seu código continua válido — tente de novo." };
  }

  await admin.from("audit_logs").insert({
    tenant_id: tenantId,
    actor_email: actorEmail,
    action: "cortesia_resgatada",
    target: loja.slug,
    before: { bonus_until: loja.bonus_until, granted_modules: loja.granted_modules },
    after: { codigo: voucher.code, ate: ate.toISOString(), plano: voucher.grant_plan_slug, modulos },
  });

  return {
    ok: true,
    ate: ate.toISOString(),
    planoSlug: voucher.grant_plan_slug,
    modulos: voucher.grant_modules ?? [],
  };
}
