"use server";

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureModuleForAction } from "@/lib/auth/require-module";
import { generateProductContent, type ProductContentOutput } from "@/modules/ai/product-content";
import { avaliarCota, getLimiteIaDoPlano, getUsoIaDoMes, mensagemCotaEstourada } from "@/modules/ai/usage";

export type GerarConteudoInput = {
  /** Produto sendo editado. `null` quando a cesta ainda não foi salva. */
  productId: string | null;
  nome: string;
  itens: string[];
  ocasiao: string;
  tom: string;
  /** URL da foto de capa já salva no produto, se houver. */
  imageUrl: string;
};

export type GerarConteudoResult =
  | { ok: true; content: ProductContentOutput }
  | { ok: false; error: string };

/**
 * Gera descrição, SEO e legenda de UM produto com IA.
 *
 * Ordem, de propósito (regra do módulo `ia`): confere o módulo -> confere a
 * cota -> RESERVA a cota (grava a linha em `ai_usage` ANTES de chamar a IA) ->
 * chama a IA -> confirma (grava os tokens de verdade) ou estorna (apaga a
 * reserva) se a chamada falhar. Reservar antes existe para nunca vazar geração
 * de graça: se o processo cair NO MEIO da chamada à IA, a cota já foi
 * debitada -- o pior cenário é a lojista perder um uso por uma falha de
 * infraestrutura, nunca o contrário (gerar sem contar).
 */
export async function gerarConteudoProdutoComIA(input: GerarConteudoInput): Promise<GerarConteudoResult> {
  // TRAVA DE SERVIDOR (módulo "ia"): a action é um endpoint HTTP -- some do
  // menu não quer dizer que sumiu da rede.
  const gate = await ensureModuleForAction("ia");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  const nome = input.nome.trim();
  if (!nome) return { ok: false, error: "Dê um nome para a cesta antes de gerar o conteúdo." };

  const itens = input.itens.map((i) => i.trim()).filter(Boolean);
  if (itens.length === 0) {
    return { ok: false, error: "Liste ao menos um item da cesta antes de gerar o conteúdo." };
  }

  const admin = createAdminClient();

  // O id do produto vem do navegador: só aceita se for realmente DESTA loja.
  let productId: string | null = null;
  if (input.productId) {
    const { data: owned } = await admin
      .from("products")
      .select("id")
      .eq("id", input.productId)
      .eq("tenant_id", staff.tenantId)
      .maybeSingle();
    if (!owned) return { ok: false, error: "Produto não encontrado nesta loja." };
    productId = owned.id;
  }

  let usado: number;
  let limite: number | null;
  try {
    [usado, limite] = await Promise.all([getUsoIaDoMes(staff.tenantId), getLimiteIaDoPlano(staff.tenantId)]);
  } catch (e) {
    console.error("[ai/actions] falha ao ler a cota de IA:", e);
    return { ok: false, error: "Não foi possível conferir sua cota de IA agora. Tente de novo em instantes." };
  }

  const cota = avaliarCota(usado, limite);
  if (!cota.permitido) {
    // `limite` não pode ser null aqui: `avaliarCota` só recusa quando há limite.
    return { ok: false, error: mensagemCotaEstourada(limite as number) };
  }

  // Reserva a cota ANTES de chamar a IA (ver comentário do topo da função).
  const { data: reserva, error: reservaError } = await admin
    .from("ai_usage")
    .insert({
      tenant_id: staff.tenantId,
      product_id: productId,
      kind: "descricao",
      tokens_used: 0,
      created_by: staff.id,
    })
    .select("id")
    .single();

  if (reservaError || !reserva) {
    console.error("[ai/actions] falha ao reservar o uso de IA:", reservaError);
    return { ok: false, error: "Não foi possível reservar o uso da IA agora. Tente de novo." };
  }

  const resultado = await generateProductContent({
    nome,
    itens,
    ocasiao: input.ocasiao.trim(),
    tom: input.tom.trim(),
    imageUrl: input.imageUrl.trim() || undefined,
  });

  if (!resultado.ok) {
    // Estorna: a tentativa falhou, a lojista não perde cota por causa disso.
    const { error: estornoError } = await admin.from("ai_usage").delete().eq("id", reserva.id);
    if (estornoError) console.error("[ai/actions] falha ao estornar reserva de IA:", estornoError);
    return { ok: false, error: resultado.error };
  }

  const { error: confirmError } = await admin
    .from("ai_usage")
    .update({ tokens_used: resultado.tokensUsed })
    .eq("id", reserva.id);
  if (confirmError) {
    // O conteúdo já foi gerado e a cota já está corretamente debitada (a linha
    // existe desde a reserva); só o número de tokens não foi atualizado. Não
    // vale a pena devolver erro para a lojista por causa de um dado só de
    // telemetria.
    console.error("[ai/actions] falha ao confirmar tokens da reserva de IA:", confirmError);
  }

  return { ok: true, content: resultado.content };
}
