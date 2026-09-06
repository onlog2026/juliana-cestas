"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureModuleForAction } from "@/lib/auth/require-module";
import {
  MAX_ITENS_POR_COMPRA,
  MAX_TOTAL_CENTS,
  aplicarMovimento,
  novoCustoMedioCents,
  totalDaCompraCents,
  totalDoItemCents,
  validarCentavos,
  validarQuantidade,
  validarQuantidadeInteira,
} from "@/modules/inventory/movements";

/**
 * REGISTRAR UMA COMPRA é a ação mais delicada deste módulo, porque ela toca
 * TRÊS coisas de uma vez: a nota (financeiro), o estoque (unidades) e o custo
 * do produto (margem). Ou as três acontecem, ou nenhuma.
 *
 * O PostgREST não abre transação. Então a garantia de "tudo ou nada" é feita à
 * mão, em duas partes:
 *
 *   1. ORDEM QUE MENOS ESTRAGA. Grava primeiro o que é inofensivo sozinho (a
 *      nota e os itens: uma compra sem movimentação é só um papel guardado) e
 *      por último o que muda número que a lojista usa para decidir (saldo e
 *      custo do produto).
 *   2. DESFAZER O QUE JÁ GRAVOU. Cada produto alterado tem saldo e custo
 *      anteriores guardados em memória ANTES do update; se qualquer passo
 *      falhar, tudo volta e a compra é apagada.
 *
 * Sobre apagar movimentação: a regra do módulo é que movimentação nunca é
 * apagada. A exceção — única — é esta: uma compra que NÃO chegou a existir não
 * pode deixar rastro pela metade. Ela é apagada dentro da mesma chamada que a
 * criou, antes de qualquer pessoa ver o extrato. Correção de compra JÁ gravada
 * continua sendo lançamento novo, nunca exclusão.
 */

export type ItemCompraInput = {
  /** null = insumo que não é produto do catálogo (embalagem, fita, cartão). */
  productId: string | null;
  description: string;
  quantity: number;
  unitCostCents: number;
};

export type CompraInput = {
  supplierId: string | null;
  /** "YYYY-MM-DD" no calendário de Brasília. */
  purchasedAt: string;
  invoiceNumber: string;
  notes: string;
  itens: ItemCompraInput[];
};

export type ResultadoCompra = { ok: true; id: string } | { ok: false; error: string };
export type ResultadoAcao = { ok: true } | { ok: false; error: string };

export type FornecedorInput = {
  id?: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
};

export async function salvarFornecedor(input: FornecedorInput): Promise<ResultadoAcao> {
  const gate = await ensureModuleForAction("compras");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  const nome = (input.name ?? "").trim();
  if (!nome) return { ok: false, error: "Dê um nome para o fornecedor." };
  if (nome.length > 160) return { ok: false, error: "O nome do fornecedor é longo demais." };

  const admin = createAdminClient();
  const linha = {
    tenant_id: staff.tenantId,
    name: nome,
    phone: (input.phone ?? "").trim() || null,
    email: (input.email ?? "").trim() || null,
    notes: (input.notes ?? "").trim() || null,
  };

  const query = input.id
    ? admin.from("suppliers").update(linha).eq("id", input.id).eq("tenant_id", staff.tenantId).select("id")
    : admin.from("suppliers").insert(linha).select("id");

  const { data, error } = await query;
  if (error || !data || data.length === 0) {
    return { ok: false, error: "Não consegui salvar o fornecedor. Nada foi gravado." };
  }

  revalidatePath("/admin/compras");
  return { ok: true };
}

const DATA_VALIDA = /^\d{4}-\d{2}-\d{2}$/;

export async function registrarCompra(input: CompraInput): Promise<ResultadoCompra> {
  const gate = await ensureModuleForAction("compras");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  if (!DATA_VALIDA.test(input.purchasedAt ?? "")) {
    return { ok: false, error: "Informe a data da compra." };
  }
  const itensBrutos = Array.isArray(input.itens) ? input.itens : [];
  if (itensBrutos.length === 0) {
    return { ok: false, error: "Adicione pelo menos um item na compra." };
  }
  if (itensBrutos.length > MAX_ITENS_POR_COMPRA) {
    return { ok: false, error: `Uma compra pode ter no máximo ${MAX_ITENS_POR_COMPRA} itens.` };
  }

  // ── Validação item a item, TODA no servidor ──────────────────────────────
  type ItemValidado = {
    productId: string | null;
    description: string;
    quantity: number;
    unitCostCents: number;
    totalCents: number;
  };
  const itens: ItemValidado[] = [];

  for (const [indice, bruto] of itensBrutos.entries()) {
    const linha = indice + 1;
    const descricao = (bruto.description ?? "").trim();
    if (!descricao) return { ok: false, error: `Item ${linha}: escreva o que foi comprado.` };
    if (descricao.length > 200) return { ok: false, error: `Item ${linha}: a descrição é longa demais.` };

    const productId =
      typeof bruto.productId === "string" && bruto.productId.length >= 10 ? bruto.productId : null;

    // Item ligado a uma cesta do catálogo tem que ser inteiro: o saldo do
    // produto é `integer` no banco, e meia cesta não existe.
    const quantidade = productId ? validarQuantidadeInteira(bruto.quantity) : validarQuantidade(bruto.quantity);
    if (!quantidade.ok) return { ok: false, error: `Item ${linha}: ${quantidade.erro}` };

    const custo = validarCentavos(bruto.unitCostCents);
    if (!custo.ok) return { ok: false, error: `Item ${linha}: ${custo.erro}` };

    // Teto POR LINHA, não só no total: a coluna `total_cents` do item também é
    // `integer`, e estourar ela daria "integer out of range" no meio da
    // gravação, com a compra já criada.
    const totalDoItem = totalDoItemCents({ quantity: quantidade.valor, unitCostCents: custo.valor });
    if (totalDoItem > MAX_TOTAL_CENTS) {
      return { ok: false, error: `Item ${linha}: o total ficou alto demais. Confira a quantidade e o valor.` };
    }

    itens.push({
      productId,
      description: descricao,
      quantity: quantidade.valor,
      unitCostCents: custo.valor,
      totalCents: totalDoItem,
    });
  }

  // O TOTAL É SEMPRE A SOMA DOS ITENS, calculada aqui. O formulário até mostra
  // um total para conferência, mas ele não é aceito: total digitado à mão é o
  // caminho mais curto para o financeiro não bater com o estoque.
  const totalCents = totalDaCompraCents(itens);
  if (totalCents > MAX_TOTAL_CENTS) {
    return { ok: false, error: "O total da compra ficou alto demais. Confira as quantidades e os valores." };
  }

  const admin = createAdminClient();

  // Fornecedor: confere que é DESTA loja antes de amarrar.
  let supplierId: string | null = null;
  if (input.supplierId) {
    const { data: fornecedor } = await admin
      .from("suppliers")
      .select("id")
      .eq("id", input.supplierId)
      .eq("tenant_id", staff.tenantId)
      .maybeSingle();
    if (!fornecedor) return { ok: false, error: "Esse fornecedor não existe nesta loja." };
    supplierId = fornecedor.id;
  }

  // Produtos: lê saldo e custo ANTES de qualquer escrita. Esta leitura é o que
  // torna possível desfazer depois.
  const idsDeProduto = [...new Set(itens.map((i) => i.productId).filter((id): id is string => id !== null))];
  const anteriores = new Map<string, { estoque: number | null; custo: number | null }>();

  if (idsDeProduto.length > 0) {
    const { data: produtos, error: erroProdutos } = await admin
      .from("products")
      .select("id, stock_quantity, cost_cents")
      .eq("tenant_id", staff.tenantId)
      .in("id", idsDeProduto);

    if (erroProdutos) return { ok: false, error: "Não consegui ler as cestas da compra. Nada foi gravado." };

    for (const p of produtos ?? []) {
      anteriores.set(p.id, {
        estoque: p.stock_quantity === null ? null : Number(p.stock_quantity),
        custo: p.cost_cents === null ? null : Number(p.cost_cents),
      });
    }

    const faltando = idsDeProduto.filter((id) => !anteriores.has(id));
    if (faltando.length > 0) {
      return { ok: false, error: "Um dos itens aponta para uma cesta que não existe nesta loja." };
    }
  }

  // ── Passo 1: a nota ──────────────────────────────────────────────────────
  const { data: compraCriada, error: erroCompra } = await admin
    .from("purchases")
    .insert({
      tenant_id: staff.tenantId,
      supplier_id: supplierId,
      purchased_at: input.purchasedAt,
      invoice_number: (input.invoiceNumber ?? "").trim() || null,
      total_cents: totalCents,
      notes: (input.notes ?? "").trim() || null,
      created_by: staff.id,
    })
    .select("id");

  if (erroCompra || !compraCriada || compraCriada.length === 0) {
    return { ok: false, error: "Não consegui gravar a compra. Nada foi alterado." };
  }
  const compraId = compraCriada[0].id as string;

  /** Apaga a compra inteira (os itens caem junto, por `on delete cascade`). */
  async function desfazerCompra() {
    await admin.from("stock_movements").delete().eq("tenant_id", staff.tenantId).eq("reference_type", "compra").eq("reference_id", compraId);
    await admin.from("purchases").delete().eq("id", compraId).eq("tenant_id", staff.tenantId);
  }

  /** Volta saldo e custo de cada produto já alterado ao valor exato de antes. */
  async function desfazerProdutos(alterados: readonly string[]) {
    for (const id of alterados) {
      const antes = anteriores.get(id);
      if (!antes) continue;
      await admin
        .from("products")
        .update({ stock_quantity: antes.estoque, cost_cents: antes.custo })
        .eq("id", id)
        .eq("tenant_id", staff.tenantId);
    }
  }

  // ── Passo 2: os itens ────────────────────────────────────────────────────
  const { data: itensCriados, error: erroItens } = await admin
    .from("purchase_items")
    .insert(
      itens.map((item) => ({
        tenant_id: staff.tenantId,
        purchase_id: compraId,
        product_id: item.productId,
        description: item.description,
        quantity: item.quantity,
        unit_cost_cents: item.unitCostCents,
        total_cents: item.totalCents,
      }))
    )
    .select("id");

  if (erroItens || !itensCriados || itensCriados.length !== itens.length) {
    await desfazerCompra();
    return { ok: false, error: "Não consegui gravar os itens da compra. Nada foi gravado." };
  }

  // ── Passo 3: estoque e custo, uma cesta por vez ──────────────────────────
  // Agrupa por produto: duas linhas da mesma cesta na mesma nota viram UMA
  // entrada com o custo médio das duas. Sem isso, a segunda linha calcularia o
  // custo médio em cima de um saldo que a primeira já tinha mudado, e a conta
  // sairia diferente dependendo da ordem de digitação.
  const porProduto = new Map<string, { quantidade: number; totalCents: number }>();
  for (const item of itens) {
    if (!item.productId) continue;
    const atual = porProduto.get(item.productId) ?? { quantidade: 0, totalCents: 0 };
    porProduto.set(item.productId, {
      quantidade: atual.quantidade + item.quantity,
      totalCents: atual.totalCents + item.totalCents,
    });
  }

  const produtosAlterados: string[] = [];

  for (const [productId, agregado] of porProduto.entries()) {
    const antes = anteriores.get(productId);
    if (!antes) continue;

    const custoUnitario = Math.round(agregado.totalCents / agregado.quantidade);
    const saldo = aplicarMovimento(antes.estoque, "entrada", agregado.quantidade);
    if (!saldo.ok) {
      await desfazerProdutos(produtosAlterados);
      await desfazerCompra();
      return { ok: false, error: saldo.erro };
    }

    const custoMedio = novoCustoMedioCents({
      estoqueAtual: antes.estoque,
      custoAtualCents: antes.custo,
      quantidadeEntrada: agregado.quantidade,
      custoUnitarioEntradaCents: custoUnitario,
    });

    const { data: atualizado, error: erroUpdate } = await admin
      .from("products")
      .update({
        stock_quantity: Math.round(saldo.saldo),
        cost_cents: custoMedio,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .eq("tenant_id", staff.tenantId)
      .select("id");

    if (erroUpdate || !atualizado || atualizado.length === 0) {
      await desfazerProdutos(produtosAlterados);
      await desfazerCompra();
      return { ok: false, error: "Não consegui atualizar o estoque das cestas. A compra não foi gravada." };
    }
    produtosAlterados.push(productId);

    const { data: movimento, error: erroMovimento } = await admin
      .from("stock_movements")
      .insert({
        tenant_id: staff.tenantId,
        product_id: productId,
        kind: "entrada",
        quantity: agregado.quantidade,
        unit_cost_cents: custoUnitario,
        reason: null,
        reference_type: "compra",
        reference_id: compraId,
        balance_after: saldo.saldo,
        created_by: staff.id,
      })
      .select("id");

    if (erroMovimento || !movimento || movimento.length === 0) {
      await desfazerProdutos(produtosAlterados);
      await desfazerCompra();
      return { ok: false, error: "Não consegui gravar o histórico de estoque. A compra não foi gravada." };
    }
  }

  revalidatePath("/admin/compras");
  revalidatePath("/admin/estoque");
  revalidatePath("/admin/produtos");
  return { ok: true, id: compraId };
}
