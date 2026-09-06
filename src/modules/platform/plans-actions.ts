"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import {
  normalizarSlug,
  parseNumeroOpcional,
  parsePercentual,
  parseReaisToCents,
  type PlanFormInput,
  type PlanModuleFormRow,
} from "@/modules/platform/plans-service";

/**
 * Ações do painel da plataforma sobre PLANOS e sobre o que cada plano libera.
 *
 * ATENÇÃO ao mexer neste arquivo: ele tem `"use server"` no topo, então só
 * pode exportar FUNÇÕES ASSÍNCRONAS. Exportar uma constante (uma lista de
 * rótulos, um objeto de configuração) quebra o módulo inteiro em tempo de
 * execução -- e nem o build nem o `tsc` avisam. Constante vai para
 * `plans-service.ts` ou para o próprio componente de tela.
 */

type Result = { ok: true } | { ok: false; error: string };

/**
 * Auditoria: quem mexeu no preço, quando e o que tinha antes.
 *
 * É uma cópia local, de propósito. `audit()` mora em `actions.ts`, que também
 * é `"use server"` -- e um arquivo desses não pode exportar helper que não
 * seja Server Action. Duas cópias pequenas e iguais valem mais do que um
 * import que quebra em produção.
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
    tenant_id: null, // plano é da plataforma, não de uma loja específica
    actor_email: actorEmail,
    action,
    target,
    before: before ?? null,
    after: after ?? null,
  });
  // Auditoria não pode derrubar a ação, mas silêncio total esconde problema.
  if (error) console.error("[planos] falha ao gravar auditoria:", error);
}

async function carregarPlano(id: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("subscription_plans")
    .select(
      "id, slug, name, badge, description, monthly_cents, annual_discount_pct, max_products, max_team_members, is_visible, is_anchor, sort_order"
    )
    .eq("id", id)
    .maybeSingle();
  return data;
}

/** Quantas lojas estão neste plano hoje. Usado para travar a exclusão. */
async function contarLojasNoPlano(slug: string): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("tenants")
    .select("id", { count: "exact", head: true })
    .eq("subscription_plan", slug);
  if (error) {
    console.error("[planos] falha ao contar lojas do plano:", error);
    // Não sabemos quantas lojas usam. Na dúvida, o número alto TRAVA a
    // exclusão -- é o lado seguro do erro.
    return -1;
  }
  return count ?? 0;
}

/** Quantas lojas têm cortesia apontando para este plano. */
async function contarCortesiasNoPlano(slug: string): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("tenants")
    .select("id", { count: "exact", head: true })
    .eq("bonus_plan_slug", slug);
  if (error) {
    console.error("[planos] falha ao contar cortesias do plano:", error);
    return -1;
  }
  return count ?? 0;
}

/**
 * Converte o que veio do formulário (tudo texto) para o que o banco guarda.
 * Preço em CENTAVOS, sempre. Se qualquer campo estiver mal escrito, devolve a
 * frase que a pessoa vai ler na tela -- nunca um valor "chutado".
 */
function validarFormulario(
  input: PlanFormInput
): { ok: true; valores: Record<string, unknown>; slug: string } | { ok: false; error: string } {
  const nome = (input.name ?? "").trim();
  if (!nome) return { ok: false, error: "Escreva o nome do plano." };

  const slug = normalizarSlug(input.slug || input.name);
  if (!slug) {
    return {
      ok: false,
      error: "O identificador do plano ficou vazio. Use letras e números no nome, por exemplo: Essencial.",
    };
  }

  const centavos = parseReaisToCents(input.precoMensalTexto);
  if (centavos === null) {
    return {
      ok: false,
      error: 'Preço mensal inválido. Escreva só o valor em reais, com vírgula. Exemplo: 129,90 (ou 0 para plano gratuito).',
    };
  }

  const desconto = parsePercentual(input.descontoAnualTexto);
  if (desconto === null) {
    return { ok: false, error: "Desconto anual inválido. Escreva um número de 0 a 100. Exemplo: 20." };
  }

  const produtos = parseNumeroOpcional(input.maxProductsTexto, { min: 0, max: 1000000 });
  if (!produtos.ok) {
    return { ok: false, error: "Limite de produtos inválido. Escreva um número inteiro ou deixe vazio para sem limite." };
  }

  const equipe = parseNumeroOpcional(input.maxTeamMembersTexto, { min: 0, max: 10000 });
  if (!equipe.ok) {
    return { ok: false, error: "Limite de pessoas na equipe inválido. Escreva um número inteiro ou deixe vazio para sem limite." };
  }

  const ordem = parseNumeroOpcional(input.sortOrderTexto, { min: 0, max: 999 });
  if (!ordem.ok) {
    return { ok: false, error: "Ordem de exibição inválida. Escreva um número de 0 a 999." };
  }

  return {
    ok: true,
    slug,
    valores: {
      slug,
      name: nome,
      badge: (input.badge ?? "").trim() || null,
      description: (input.description ?? "").trim() || null,
      monthly_cents: centavos,
      annual_discount_pct: desconto,
      max_products: produtos.valor,
      max_team_members: equipe.valor,
      is_visible: input.isVisible === true,
      is_anchor: input.isAnchor === true,
      sort_order: ordem.valor ?? 0,
    },
  };
}

/**
 * Só um plano pode ser o "mais popular" da vitrine. Ao marcar um, os outros
 * são desmarcados aqui no servidor -- se isso ficasse a cargo da tela, dois
 * planos apareceriam como âncora e ninguém entenderia por quê.
 */
async function desmarcarOutrasAncoras(idQueFica: string | null) {
  const admin = createAdminClient();
  let query = admin.from("subscription_plans").update({ is_anchor: false }).eq("is_anchor", true);
  if (idQueFica) query = query.neq("id", idQueFica);
  const { error } = await query.select("id");
  if (error) console.error("[planos] falha ao desmarcar as outras âncoras:", error);
}

function revalidar() {
  revalidatePath("/super/planos");
  revalidatePath("/super/lojas");
}

/** Cria um plano novo. */
export async function createPlan(input: PlanFormInput): Promise<Result> {
  const platformAdmin = await requireSuperAdmin();

  const validado = validarFormulario(input);
  if (!validado.ok) return validado;

  const admin = createAdminClient();

  // Slug repetido tem mensagem própria: o erro cru do Postgres não diz nada
  // para quem não é dev.
  const { data: existente } = await admin
    .from("subscription_plans")
    .select("id")
    .eq("slug", validado.slug)
    .maybeSingle();
  if (existente) {
    return {
      ok: false,
      error: `Já existe um plano com o identificador "${validado.slug}". Escolha outro nome ou outro identificador.`,
    };
  }

  const { data, error } = await admin.from("subscription_plans").insert(validado.valores).select("id");

  // `.select("id")` + checagem de linha: sem isso, uma recusa do banco não
  // vira exceção e a tela diz "salvo!" sem ter salvado nada.
  if (error || !data || data.length === 0) {
    console.error("[planos] falha ao criar plano:", error);
    return { ok: false, error: "Não foi possível criar o plano. Tente de novo." };
  }

  if (input.isAnchor === true) await desmarcarOutrasAncoras(data[0].id as string);

  await audit(platformAdmin.email, "plano_criado", validado.slug, null, validado.valores);
  revalidar();
  return { ok: true };
}

/** Altera um plano que já existe. */
export async function updatePlan(planId: string, input: PlanFormInput): Promise<Result> {
  const platformAdmin = await requireSuperAdmin();

  const antes = await carregarPlano(planId);
  if (!antes) return { ok: false, error: "Plano não encontrado." };

  const validado = validarFormulario(input);
  if (!validado.ok) return validado;

  const admin = createAdminClient();

  // Trocar o slug de um plano em uso desliga as lojas daquele plano, porque a
  // loja guarda o slug, não o id. Então o slug de um plano em uso é congelado.
  if (validado.slug !== antes.slug) {
    const emUso = await contarLojasNoPlano(antes.slug as string);
    if (emUso !== 0) {
      return {
        ok: false,
        error:
          emUso < 0
            ? "Não foi possível conferir quantas lojas usam este plano, então o identificador não foi alterado. Tente de novo."
            : `${emUso === 1 ? "1 loja usa" : `${emUso} lojas usam`} este plano e ${emUso === 1 ? "ela é ligada" : "elas são ligadas"} pelo identificador "${antes.slug}". Mude ${emUso === 1 ? "essa loja" : "essas lojas"} de plano antes de trocar o identificador.`,
      };
    }
  }

  const { data, error } = await admin
    .from("subscription_plans")
    .update({ ...validado.valores, updated_at: new Date().toISOString() })
    .eq("id", planId)
    .select("id");

  if (error || !data || data.length === 0) {
    console.error("[planos] falha ao salvar plano:", error);
    return { ok: false, error: "Não foi possível salvar o plano. Tente de novo." };
  }

  if (input.isAnchor === true) await desmarcarOutrasAncoras(planId);

  await audit(platformAdmin.email, "plano_alterado", validado.slug, antes, validado.valores);
  revalidar();
  return { ok: true };
}

/**
 * Tira o plano da vitrine (ou coloca de volta).
 *
 * É o "desativar" seguro: quem já está no plano continua exatamente como
 * está; o plano só deixa de ser oferecido para quem ainda vai assinar.
 */
export async function setPlanVisibility(planId: string, visivel: boolean): Promise<Result> {
  const platformAdmin = await requireSuperAdmin();

  const antes = await carregarPlano(planId);
  if (!antes) return { ok: false, error: "Plano não encontrado." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("subscription_plans")
    .update({ is_visible: visivel, updated_at: new Date().toISOString() })
    .eq("id", planId)
    .select("id");

  if (error || !data || data.length === 0) {
    console.error("[planos] falha ao mudar a visibilidade do plano:", error);
    return { ok: false, error: "Não foi possível mudar a visibilidade do plano. Tente de novo." };
  }

  await audit(
    platformAdmin.email,
    visivel ? "plano_publicado_na_vitrine" : "plano_retirado_da_vitrine",
    antes.slug as string,
    antes,
    { is_visible: visivel }
  );
  revalidar();
  return { ok: true };
}

/**
 * Exclui um plano DE VERDADE. Só quando ninguém está usando.
 *
 * A trava é aqui no servidor, não só no botão desabilitado da tela: botão
 * desabilitado é dica visual, não é segurança.
 */
export async function deletePlan(planId: string): Promise<Result> {
  const platformAdmin = await requireSuperAdmin();

  const antes = await carregarPlano(planId);
  if (!antes) return { ok: false, error: "Plano não encontrado." };

  const slug = antes.slug as string;

  const lojas = await contarLojasNoPlano(slug);
  if (lojas < 0) {
    return {
      ok: false,
      error: "Não foi possível conferir quantas lojas usam este plano, então nada foi excluído. Tente de novo.",
    };
  }
  if (lojas > 0) {
    return {
      ok: false,
      error: `${lojas === 1 ? "1 loja usa" : `${lojas} lojas usam`} este plano. Mude ${lojas === 1 ? "essa loja" : "essas lojas"} de plano antes de excluir.`,
    };
  }

  const cortesias = await contarCortesiasNoPlano(slug);
  if (cortesias < 0) {
    return {
      ok: false,
      error: "Não foi possível conferir se alguma cortesia usa este plano, então nada foi excluído. Tente de novo.",
    };
  }
  if (cortesias > 0) {
    return {
      ok: false,
      error: `${cortesias === 1 ? "1 loja está com uma cortesia" : `${cortesias} lojas estão com cortesia`} neste plano. Troque ou remova ${cortesias === 1 ? "essa cortesia" : "essas cortesias"} antes de excluir.`,
    };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("subscription_plans").delete().eq("id", planId).select("id");

  if (error || !data || data.length === 0) {
    console.error("[planos] falha ao excluir plano:", error);
    return { ok: false, error: "Não foi possível excluir o plano. Tente de novo." };
  }

  await audit(platformAdmin.email, "plano_excluido", slug, antes, null);
  revalidar();
  return { ok: true };
}

/**
 * Salva a matriz "este plano × cada módulo" de uma vez só.
 *
 * Regras que o servidor impõe, independentemente do que a tela mandar:
 *  - módulo do NÚCLEO é sempre "incluído" (o núcleo não se vende);
 *  - módulo que o sistema não conhece é ignorado (a lista de módulos é
 *    fechada -- no Agentop dava para criar e cobrar por um add-on que nenhuma
 *    linha de código sabia liberar);
 *  - `limit_display` é só texto de vitrine e `limit_value` é a trava real.
 */
export async function savePlanModules(planId: string, linhas: PlanModuleFormRow[]): Promise<Result> {
  const platformAdmin = await requireSuperAdmin();

  const antes = await carregarPlano(planId);
  if (!antes) return { ok: false, error: "Plano não encontrado." };

  const admin = createAdminClient();

  const { data: modulosData, error: modulosErro } = await admin
    .from("platform_modules")
    .select("slug, is_core");

  if (modulosErro) {
    console.error("[planos] falha ao ler os módulos antes de salvar:", modulosErro);
    return { ok: false, error: "Não foi possível ler a lista de módulos. Nada foi salvo." };
  }

  const conhecidos = new Map<string, boolean>();
  for (const m of modulosData ?? []) {
    const row = m as { slug: string; is_core: boolean };
    conhecidos.set(row.slug, row.is_core === true);
  }

  const paraGravar: {
    plan_id: string;
    module_slug: string;
    status: string;
    limit_display: string | null;
    limit_value: number | null;
  }[] = [];

  for (const linha of linhas ?? []) {
    if (!conhecidos.has(linha.moduleSlug)) continue;
    const ehNucleo = conhecidos.get(linha.moduleSlug) === true;

    const status = ehNucleo
      ? "included"
      : linha.status === "included" || linha.status === "addon"
        ? linha.status
        : "excluded";

    const limite = parseNumeroOpcional(linha.limitValueTexto, { min: 0, max: 10000000 });
    if (!limite.ok) {
      return {
        ok: false,
        error: `O campo "Limite que o sistema obedece" do módulo "${linha.moduleSlug}" precisa ser um número inteiro (ou vazio, para sem limite). Nada foi salvo.`,
      };
    }

    paraGravar.push({
      plan_id: planId,
      module_slug: linha.moduleSlug,
      status,
      limit_display: (linha.limitDisplay ?? "").trim() || null,
      limit_value: limite.valor,
    });
  }

  if (paraGravar.length === 0) {
    return { ok: false, error: "Nenhum módulo válido foi enviado. Nada foi salvo." };
  }

  const { data, error } = await admin
    .from("plan_modules")
    .upsert(paraGravar, { onConflict: "plan_id,module_slug" })
    .select("module_slug");

  if (error || !data || data.length === 0) {
    console.error("[planos] falha ao salvar a matriz de módulos:", error);
    return { ok: false, error: "Não foi possível salvar o que este plano libera. Tente de novo." };
  }

  await audit(platformAdmin.email, "plano_modulos_alterados", antes.slug as string, null, {
    plano: antes.slug,
    modulos: paraGravar.map((m) => ({
      modulo: m.module_slug,
      situacao: m.status,
      texto_do_cliente: m.limit_display,
      limite_real: m.limit_value,
    })),
  });
  revalidar();
  return { ok: true };
}
