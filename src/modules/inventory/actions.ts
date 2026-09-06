"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureModuleForAction } from "@/lib/auth/require-module";
import {
  aplicarMovimento,
  isStockMovementKind,
  novoCustoMedioCents,
  requerMotivo,
  validarCentavos,
  validarContagem,
  validarQuantidadeInteira,
  type StockMovementKind,
} from "@/modules/inventory/movements";

/**
 * AÇÕES DE ESTOQUE.
 *
 * Arquivo `"use server"`: só exporta função `async`. Tipo e constante ficam em
 * `movements.ts`, que é puro e pode ser importado por qualquer lado.
 *
 * A REGRA QUE MANDA AQUI: o estoque não é editado, ele é o resultado das
 * movimentações. Nenhuma outra parte do sistema deve escrever em
 * `products.stock_quantity` sem gravar a linha correspondente em
 * `stock_movements` — senão volta a ser impossível responder "por que sumiram
 * 3 unidades?".
 */

export type MovimentoInput = {
  productId: string;
  kind: StockMovementKind;
  /** Em "ajuste" isto é a CONTAGEM (novo saldo). Nos outros, quanto entrou/saiu. */
  quantity: number;
  /** Obrigatório em ajuste e perda. */
  reason: string;
  /** Só faz sentido em "entrada": quanto custou cada unidade, em centavos. */
  unitCostCents: number | null;
};

export type ResultadoAcao = { ok: true } | { ok: false; error: string };

export async function registrarMovimento(input: MovimentoInput): Promise<ResultadoAcao> {
  const gate = await ensureModuleForAction("estoque");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  if (!isStockMovementKind(input.kind)) {
    return { ok: false, error: "Tipo de movimentação inválido." };
  }
  if (typeof input.productId !== "string" || input.productId.length < 10) {
    return { ok: false, error: "Escolha a cesta que vai ser movimentada." };
  }

  const motivo = (input.reason ?? "").trim();
  if (requerMotivo(input.kind) && !motivo) {
    return {
      ok: false,
      error: "Ajuste e perda precisam de um motivo escrito. Sem isso, ninguém entende o extrato depois.",
    };
  }

  const quantidade =
    input.kind === "ajuste" ? validarContagem(input.quantity) : validarQuantidadeInteira(input.quantity);
  if (!quantidade.ok) return { ok: false, error: quantidade.erro };

  let custoUnitario: number | null = null;
  if (input.kind === "entrada" && input.unitCostCents !== null && input.unitCostCents !== undefined) {
    const custo = validarCentavos(input.unitCostCents);
    if (!custo.ok) return { ok: false, error: custo.erro };
    custoUnitario = custo.valor;
  }

  const admin = createAdminClient();

  // Filtro por loja na LEITURA também: sem isto, um id de produto de outra loja
  // colado no formulário movimentaria o estoque alheio.
  const { data: produto, error: erroProduto } = await admin
    .from("products")
    .select("id, stock_quantity, cost_cents")
    .eq("id", input.productId)
    .eq("tenant_id", staff.tenantId)
    .maybeSingle();

  if (erroProduto) return { ok: false, error: "Não consegui ler a cesta. Tente de novo." };
  if (!produto) return { ok: false, error: "Essa cesta não existe nesta loja." };

  const saldoAnterior: number | null =
    produto.stock_quantity === null ? null : Number(produto.stock_quantity);
  const custoAnterior: number | null = produto.cost_cents === null ? null : Number(produto.cost_cents);

  const saldo = aplicarMovimento(saldoAnterior, input.kind, quantidade.valor);
  if (!saldo.ok) return { ok: false, error: saldo.erro };

  const novoCusto =
    input.kind === "entrada" && custoUnitario !== null
      ? novoCustoMedioCents({
          estoqueAtual: saldoAnterior,
          custoAtualCents: custoAnterior,
          quantidadeEntrada: quantidade.valor,
          custoUnitarioEntradaCents: custoUnitario,
        })
      : custoAnterior;

  // ── Ordem escolhida: PRODUTO primeiro, EXTRATO depois ────────────────────
  // O PostgREST não tem transação, então alguma coisa pode gravar e a seguinte
  // falhar. Escolhi a ordem que menos estraga:
  //   * se o extrato falhar, o saldo do produto volta ao valor exato de antes
  //     (guardado em `saldoAnterior`/`custoAnterior`) e nada fica gravado;
  //   * a ordem inversa exigiria APAGAR uma movimentação já gravada, e
  //     movimentação não se apaga — é livro-caixa.
  const { data: atualizado, error: erroUpdate } = await admin
    .from("products")
    .update({
      stock_quantity: Math.round(saldo.saldo),
      cost_cents: novoCusto,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.productId)
    .eq("tenant_id", staff.tenantId)
    .select("id");

  // RLS/filtro que não casa devolve 0 linhas SEM erro. Sem esta checagem a tela
  // diria "salvo!" com nada gravado.
  if (erroUpdate || !atualizado || atualizado.length === 0) {
    return { ok: false, error: "Não consegui atualizar o estoque da cesta. Nada foi gravado." };
  }

  const { data: movimento, error: erroMovimento } = await admin
    .from("stock_movements")
    .insert({
      tenant_id: staff.tenantId,
      product_id: input.productId,
      kind: input.kind,
      quantity: quantidade.valor,
      unit_cost_cents: custoUnitario,
      reason: motivo || null,
      reference_type: "manual",
      reference_id: null,
      balance_after: saldo.saldo,
      created_by: staff.id,
    })
    .select("id");

  if (erroMovimento || !movimento || movimento.length === 0) {
    // Desfaz o que já tinha gravado: sem a linha do extrato, o saldo novo seria
    // um número sem origem — exatamente o problema que este módulo existe para
    // acabar.
    const { error: erroVolta } = await admin
      .from("products")
      .update({ stock_quantity: saldoAnterior, cost_cents: custoAnterior })
      .eq("id", input.productId)
      .eq("tenant_id", staff.tenantId);

    if (erroVolta) {
      return {
        ok: false,
        error:
          "O estoque foi alterado, mas o histórico não foi gravado e não consegui desfazer. Confira o saldo dessa cesta na tela de estoque antes de continuar.",
      };
    }
    return { ok: false, error: "Não consegui gravar o histórico. Nada foi alterado." };
  }

  revalidatePath("/admin/estoque");
  revalidatePath("/admin/produtos");
  revalidatePath("/admin");
  return { ok: true };
}
