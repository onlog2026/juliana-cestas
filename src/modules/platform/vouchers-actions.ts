"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

/**
 * Ações da tela de cortesias (vouchers).
 *
 * ATENÇÃO ao mexer neste arquivo: um arquivo com `"use server"` só pode
 * EXPORTAR função async. Uma constante exportada aqui quebra o módulo inteiro
 * em runtime -- por isso todas as constantes abaixo ficam sem `export`.
 */

/** Alfabeto sem caracteres que se confundem ao ditar por telefone (0/O, 1/I). */
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PREFIXO = "CESTA";

/**
 * Auditoria reimplementada aqui de propósito (e não importada de actions.ts):
 * um arquivo `"use server"` não pode exportar função utilitária não-async para
 * outro, e duplicar 15 linhas é mais barato que criar um acoplamento frágil
 * entre dois arquivos de action.
 */
async function audit(
  tenantId: string | null,
  actorEmail: string,
  action: string,
  target: string | null,
  before: unknown,
  after: unknown
) {
  const admin = createAdminClient();
  const { error } = await admin.from("audit_logs").insert({
    tenant_id: tenantId,
    actor_email: actorEmail,
    action,
    target,
    before: before ?? null,
    after: after ?? null,
  });
  // Auditoria não pode derrubar a ação, mas silêncio total esconde problema.
  if (error) console.error("[platform] falha ao gravar auditoria:", error);
}

/** Sorteia um bloco de 4 caracteres usando aleatoriedade criptográfica. */
function bloco(tamanho: number): string {
  const bytes = new Uint32Array(tamanho);
  globalThis.crypto.getRandomValues(bytes);
  let saida = "";
  for (const valor of bytes) saida += ALFABETO[valor % ALFABETO.length];
  return saida;
}

/**
 * Normaliza o código digitado: maiúsculas, sem acento e sem espaço solto.
 * `NFD` separa a letra do acento e a faixa ̀-ͯ apaga só o acento,
 * então "CESTÃO" vira "CESTAO" e não "CESTO".
 */
function normalizarCodigo(bruto: string): string {
  return bruto
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^A-Z0-9-]/g, "");
}

/**
 * "2026-12-31" (o que o campo de data manda) vira o FIM daquele dia no
 * relógio de Brasília. Sem isso, uma cortesia com prazo "31/12" morreria às
 * 21h do dia 30 para quem está no Brasil -- exatamente o tipo de detalhe que
 * faz o lojista ligar dizendo que o código não funciona.
 */
function fimDoDiaEmBrasilia(data: string): string | null {
  if (!data) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return null;
  const iso = new Date(`${data}T23:59:59.999-03:00`);
  if (Number.isNaN(iso.getTime())) return null;
  return iso.toISOString();
}

/** Este código já existe na tabela? */
async function codigoJaExiste(codigo: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("vouchers").select("id").eq("code", codigo).maybeSingle();
  if (error) {
    console.error("[platform] falha ao conferir se o código já existe:", error);
    // Na dúvida, trata como existente: gerar um código repetido estouraria a
    // constraint e o dono veria um erro sem explicação.
    return true;
  }
  return Boolean(data);
}

/**
 * Cria uma cortesia.
 *
 * Os dois prazos são DIFERENTES e a tela precisa dizer isso em português:
 *  - `validUntil`  = até quando o código pode ser RESGATADO;
 *  - `accessDays`  = quantos dias de acesso o resgate concede, contados a
 *                    partir do dia em que a pessoa resgatar.
 * No Agentop os dois eram confundidos e a cortesia expirava antes de alguém
 * conseguir usá-la.
 */
export async function createVoucher(input: {
  codigo: string;
  tenantId: string;
  planoSlug: string;
  modulos: string[];
  diasDeAcesso: number;
  prazoParaResgatar: string;
  quantidadeDeUsos: number;
  motivo: string;
}): Promise<{ ok: true; codigo: string } | { ok: false; error: string }> {
  const platformAdmin = await requireSuperAdmin();

  const motivo = (input.motivo ?? "").trim();
  if (!motivo) {
    return { ok: false, error: "Escreva o motivo desta cortesia. É o que explica, daqui a seis meses, por que ela existiu." };
  }

  const diasDeAcesso = Number(input.diasDeAcesso);
  if (!Number.isInteger(diasDeAcesso) || diasDeAcesso < 1 || diasDeAcesso > 365) {
    return { ok: false, error: "Os dias de acesso precisam ser um número inteiro de 1 a 365." };
  }

  const quantidadeDeUsos = Number(input.quantidadeDeUsos);
  if (!Number.isInteger(quantidadeDeUsos) || quantidadeDeUsos < 1 || quantidadeDeUsos > 1000) {
    return { ok: false, error: "A quantidade de usos precisa ser um número inteiro de 1 a 1000." };
  }

  let validUntil: string | null = null;
  if ((input.prazoParaResgatar ?? "").trim()) {
    validUntil = fimDoDiaEmBrasilia(input.prazoParaResgatar.trim());
    if (!validUntil) {
      return { ok: false, error: "A data limite para resgatar não foi entendida. Use o seletor de data." };
    }
  }

  const admin = createAdminClient();

  // Loja nominal: se veio um id, ele precisa existir de verdade.
  let tenantId: string | null = null;
  if ((input.tenantId ?? "").trim()) {
    const { data: loja, error: erroLoja } = await admin
      .from("tenants")
      .select("id, name")
      .eq("id", input.tenantId.trim())
      .maybeSingle();
    if (erroLoja) {
      console.error("[platform] falha ao conferir a loja da cortesia:", erroLoja);
      return { ok: false, error: "Não foi possível conferir a loja escolhida. Tente de novo." };
    }
    if (!loja) return { ok: false, error: "A loja escolhida não foi encontrada." };
    tenantId = loja.id as string;
  }

  // Módulos: só o que o sistema sabe entregar. A lista fechada mora no banco
  // (`platform_modules`) -- lista espelhada no código diverge, sempre.
  const modulosPedidos = [...new Set((input.modulos ?? []).map((m) => (m ?? "").trim()).filter(Boolean))];
  let modulos: string[] = [];
  if (modulosPedidos.length > 0) {
    const { data: conhecidos, error: erroModulos } = await admin
      .from("platform_modules")
      .select("slug")
      .in("slug", modulosPedidos);
    if (erroModulos) {
      console.error("[platform] falha ao validar os módulos da cortesia:", erroModulos);
      return { ok: false, error: "Não foi possível conferir os módulos escolhidos. Tente de novo." };
    }
    modulos = (conhecidos ?? []).map((m) => m.slug as string);
    if (modulos.length !== modulosPedidos.length) {
      return {
        ok: false,
        error: "Um dos módulos escolhidos não existe mais na plataforma. Recarregue a página e escolha de novo.",
      };
    }
  }

  // Plano: também só de uma lista conhecida. Cortesia de um plano que não
  // existe seria um código que promete algo que ninguém sabe entregar.
  let planoSlug: string | null = null;
  if ((input.planoSlug ?? "").trim()) {
    const { data: plano, error: erroPlano } = await admin
      .from("subscription_plans")
      .select("slug")
      .eq("slug", input.planoSlug.trim())
      .maybeSingle();
    if (erroPlano) {
      console.error("[platform] falha ao validar o plano da cortesia:", erroPlano);
      return { ok: false, error: "Não foi possível conferir o plano escolhido. Tente de novo." };
    }
    if (!plano) return { ok: false, error: "O plano escolhido não existe mais. Recarregue a página." };
    planoSlug = plano.slug as string;
  }

  if (!planoSlug && modulos.length === 0) {
    return {
      ok: false,
      error: "Escolha ao menos um plano ou um módulo extra: uma cortesia que não concede nada não serve para nada.",
    };
  }

  // Código: o que foi digitado, ou um gerado que ainda não existe.
  let codigo = normalizarCodigo(input.codigo ?? "");
  if (codigo) {
    if (codigo.length < 4 || codigo.length > 32) {
      return { ok: false, error: "O código precisa ter de 4 a 32 caracteres (letras, números e hífen)." };
    }
    if (await codigoJaExiste(codigo)) {
      return { ok: false, error: `Já existe uma cortesia com o código ${codigo}. Escolha outro ou deixe o campo vazio.` };
    }
  } else {
    let tentativas = 0;
    do {
      codigo = `${PREFIXO}-${bloco(4)}`;
      tentativas += 1;
    } while ((await codigoJaExiste(codigo)) && tentativas < 8);
    if (tentativas >= 8) {
      return { ok: false, error: "Não foi possível gerar um código novo agora. Tente de novo em alguns segundos." };
    }
  }

  const { data, error } = await admin
    .from("vouchers")
    .insert({
      code: codigo,
      tenant_id: tenantId,
      grant_plan_slug: planoSlug,
      grant_modules: modulos,
      access_days: diasDeAcesso,
      valid_until: validUntil,
      max_uses: quantidadeDeUsos,
      note: motivo,
      created_by: platformAdmin.email,
    })
    .select("id");

  // `.insert()` do Supabase não lança: devolve `{ error }`. Sem esta checagem
  // a tela diria "cortesia criada!" com o banco vazio.
  if (error || !data || data.length === 0) {
    console.error("[platform] falha ao criar cortesia:", error);
    return { ok: false, error: "Não foi possível criar a cortesia. Nada foi gravado." };
  }

  await audit(tenantId, platformAdmin.email, "cortesia_voucher_criada", codigo, null, {
    codigo,
    tenant_id: tenantId,
    plano: planoSlug,
    modulos,
    dias_de_acesso: diasDeAcesso,
    prazo_para_resgatar: validUntil,
    usos: quantidadeDeUsos,
    motivo,
  });

  revalidatePath("/super/vouchers");
  return { ok: true, codigo };
}

/**
 * Apaga uma cortesia que AINDA NÃO foi resgatada.
 *
 * Cortesia já usada nunca sai da lista: ela é o comprovante de que alguém
 * ganhou acesso de graça, em que dia e por ordem de quem. Apagar isso seria
 * apagar histórico de dinheiro que deixou de entrar.
 */
export async function deleteVoucher(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const platformAdmin = await requireSuperAdmin();

  const admin = createAdminClient();
  const { data: antes, error: erroLeitura } = await admin
    .from("vouchers")
    .select("id, code, tenant_id, used_count, redeemed_by, redeemed_at, note, grant_plan_slug, grant_modules")
    .eq("id", id)
    .maybeSingle();

  if (erroLeitura) {
    console.error("[platform] falha ao carregar a cortesia para apagar:", erroLeitura);
    return { ok: false, error: "Não foi possível carregar a cortesia. Nada foi apagado." };
  }
  if (!antes) return { ok: false, error: "Esta cortesia não existe mais. Recarregue a página." };

  const usosFeitos = (antes.used_count as number | null) ?? 0;
  if (usosFeitos > 0) {
    return {
      ok: false,
      error: "Esta cortesia já foi resgatada e faz parte do histórico da plataforma. Ela não pode ser apagada.",
    };
  }

  const { data, error } = await admin.from("vouchers").delete().eq("id", id).select("id");
  if (error || !data || data.length === 0) {
    console.error("[platform] falha ao apagar cortesia:", error);
    return { ok: false, error: "Não foi possível apagar a cortesia. Nada foi alterado." };
  }

  await audit(
    (antes.tenant_id as string | null) ?? null,
    platformAdmin.email,
    "cortesia_voucher_cancelada",
    (antes.code as string) ?? null,
    antes,
    null
  );

  revalidatePath("/super/vouchers");
  return { ok: true };
}
