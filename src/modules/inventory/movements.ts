/**
 * AS CONTAS DE ESTOQUE, PURAS.
 *
 * Este arquivo não fala com banco, não importa `server-only` e não tem efeito
 * colateral nenhum — de propósito. É o único lugar onde mora a aritmética de
 * saldo, de custo médio e de margem, para que `tests/unit/inventory.test.ts`
 * possa provar cada conta sem subir nada.
 *
 * A conta mais perigosa daqui é o CUSTO MÉDIO PONDERADO
 * (`novoCustoMedioCents`). Se ela erra, a lojista olha a margem na tela, acha
 * que está lucrando, e está perdendo — e nada na tela denuncia isso. Por isso
 * ela é pura e testada linha a linha.
 *
 * Regra que atravessa o arquivo inteiro: DINHEIRO SEMPRE EM CENTAVOS, inteiro.
 * A formatação para reais acontece só na hora de exibir (`@/lib/money`).
 *
 * Segunda regra: `null` quer dizer "NÃO SEI", e "não sei" nunca vira zero.
 * Produto sem custo cadastrado não entra na conta de margem nem na de valor
 * parado — ele é CONTADO À PARTE para a tela poder dizer "faltam 3 produtos
 * sem custo" em vez de mostrar um número redondo que é mentira.
 */

export type StockMovementKind = "entrada" | "saida" | "ajuste" | "perda";

export const STOCK_MOVEMENT_KINDS: readonly StockMovementKind[] = ["entrada", "saida", "ajuste", "perda"];

/** Como cada tipo de movimentação aparece para quem não é dev. */
export const MOVEMENT_LABELS: Record<StockMovementKind, string> = {
  entrada: "Entrada",
  saida: "Saída",
  ajuste: "Ajuste de contagem",
  perda: "Perda",
};

/** A frase que explica, na tela, o que a lojista deve digitar em cada tipo. */
export const MOVEMENT_HELP: Record<StockMovementKind, string> = {
  entrada: "Quantas unidades entraram (compra fora do sistema, devolução, produção).",
  saida: "Quantas unidades saíram sem ser por venda (brinde, uso interno, amostra).",
  ajuste: "Quantas unidades existem DE VERDADE na prateleira agora. O sistema corrige o saldo para esse número.",
  perda: "Quantas unidades foram perdidas (quebrou, venceu, estragou).",
};

/** Ajuste e perda exigem motivo escrito. Sem motivo, o extrato não explica nada. */
export const KINDS_REQUIRING_REASON: readonly StockMovementKind[] = ["ajuste", "perda"];

export function isStockMovementKind(value: unknown): value is StockMovementKind {
  return typeof value === "string" && (STOCK_MOVEMENT_KINDS as readonly string[]).includes(value);
}

export function requerMotivo(kind: StockMovementKind): boolean {
  return KINDS_REQUIRING_REASON.includes(kind);
}

/**
 * Limites de sanidade. Não são regra de negócio, são cinto de segurança contra
 * dedo errado e contra formulário adulterado: 10 mil unidades numa cesta
 * artesanal é digitação errada, e R$ 1 milhão numa linha de compra também.
 */
export const MAX_QUANTIDADE = 100_000;
export const MAX_UNIT_COST_CENTS = 100_000_00; // R$ 100.000,00 por unidade
/**
 * Teto de R$ 10.000.000,00 por LINHA e por COMPRA.
 *
 * Não é um palpite: as colunas `_cents` são `integer` no Postgres, que vai até
 * 2.147.483.647 (R$ 21.474.836,47). Deixar passar mais do que isso não daria um
 * erro compreensível — daria `integer out of range` no meio da gravação, com a
 * compra já criada. Melhor recusar antes, com uma frase que a lojista entende.
 */
export const MAX_TOTAL_CENTS = 1_000_000_000;
export const MAX_ITENS_POR_COMPRA = 100;

export type Validacao<T> = { ok: true; valor: T } | { ok: false; erro: string };

/**
 * Quantidade vinda do formulário. Aceita fração (1,5 kg de café) porque item de
 * compra pode ser a granel — mas quem amarra a quantidade a um PRODUTO do
 * catálogo tem que usar número inteiro (ver `validarQuantidadeInteira`), porque
 * `products.stock_quantity` é `integer` no banco. Meia cesta não existe.
 */
export function validarQuantidade(valor: unknown): Validacao<number> {
  const n = typeof valor === "number" ? valor : Number(valor);
  if (!Number.isFinite(n)) return { ok: false, erro: "Informe a quantidade em número." };
  if (n <= 0) return { ok: false, erro: "A quantidade precisa ser maior que zero." };
  if (n > MAX_QUANTIDADE) return { ok: false, erro: `A quantidade máxima por lançamento é ${MAX_QUANTIDADE}.` };
  // 3 casas decimais é o que o banco guarda (numeric(12,3)).
  return { ok: true, valor: Math.round(n * 1000) / 1000 };
}

/** Igual à de cima, mas para quantidade que vai virar saldo de produto. */
export function validarQuantidadeInteira(valor: unknown): Validacao<number> {
  const base = validarQuantidade(valor);
  if (!base.ok) return base;
  if (!Number.isInteger(base.valor)) {
    return { ok: false, erro: "Para uma cesta do catálogo, a quantidade precisa ser um número inteiro." };
  }
  return base;
}

/**
 * Quantidade de um AJUSTE de contagem: aqui zero é resposta legítima
 * ("contei a prateleira e não tem nenhuma"), diferente de todos os outros
 * lançamentos.
 */
export function validarContagem(valor: unknown): Validacao<number> {
  const n = typeof valor === "number" ? valor : Number(valor);
  if (!Number.isFinite(n)) return { ok: false, erro: "Informe a contagem em número." };
  if (n < 0) return { ok: false, erro: "A contagem não pode ser negativa." };
  if (!Number.isInteger(n)) return { ok: false, erro: "A contagem precisa ser um número inteiro de unidades." };
  if (n > MAX_QUANTIDADE) return { ok: false, erro: `A contagem máxima é ${MAX_QUANTIDADE}.` };
  return { ok: true, valor: n };
}

/** Valor em centavos vindo do formulário. Inteiro, nunca negativo. */
export function validarCentavos(valor: unknown, maximo = MAX_UNIT_COST_CENTS): Validacao<number> {
  const n = typeof valor === "number" ? valor : Number(valor);
  if (!Number.isFinite(n)) return { ok: false, erro: "Informe o valor em número." };
  if (!Number.isInteger(n)) return { ok: false, erro: "O valor precisa estar em centavos (número inteiro)." };
  if (n < 0) return { ok: false, erro: "O valor não pode ser negativo." };
  if (n > maximo) return { ok: false, erro: "O valor informado é alto demais. Confira antes de salvar." };
  return { ok: true, valor: n };
}

// ── Saldo ───────────────────────────────────────────────────────────────────

export type SaldoResultado = { ok: true; saldo: number } | { ok: false; erro: string };

/**
 * Aplica uma movimentação sobre o saldo atual e devolve o saldo depois.
 *
 * `saldoAtual === null` significa "produto sem controle de estoque"
 * (ilimitado/sob encomenda). A partir do PRIMEIRO lançamento ele passa a ter
 * controle, começando de zero — e a tela avisa isso em português antes de
 * confirmar. Tratar `null` como "conta a partir de zero" caladamente seria
 * transformar "ilimitado" em "esgotado" sem ninguém pedir.
 */
export function aplicarMovimento(
  saldoAtual: number | null,
  kind: StockMovementKind,
  quantidade: number
): SaldoResultado {
  const base = saldoAtual ?? 0;

  if (kind === "ajuste") {
    // No ajuste, a quantidade É o novo saldo (contagem física).
    if (quantidade < 0) return { ok: false, erro: "A contagem não pode ser negativa." };
    return { ok: true, saldo: quantidade };
  }

  if (quantidade <= 0) return { ok: false, erro: "A quantidade precisa ser maior que zero." };

  if (kind === "entrada") return { ok: true, saldo: arredondar3(base + quantidade) };

  // saída e perda
  const novo = arredondar3(base - quantidade);
  if (novo < 0) {
    return {
      ok: false,
      erro: `Não dá para tirar ${quantidade} unidade(s): o estoque atual é ${base}. Se a prateleira não bate com o sistema, use "Ajuste de contagem".`,
    };
  }
  return { ok: true, saldo: novo };
}

function arredondar3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

// ── Custo médio ponderado ───────────────────────────────────────────────────

export type EntradaDeCusto = {
  /** Saldo ANTES da entrada. `null` = produto ainda sem controle de estoque. */
  estoqueAtual: number | null;
  /** Custo unitário médio ANTES da entrada, em centavos. `null` = não sei. */
  custoAtualCents: number | null;
  /** Quantas unidades entraram agora. */
  quantidadeEntrada: number;
  /** Quanto custou cada unidade desta entrada, em centavos. */
  custoUnitarioEntradaCents: number;
};

/**
 * O NOVO custo unitário médio, em centavos inteiros, depois de uma entrada.
 *
 *   novo = (estoque_antigo × custo_antigo + qtd_entrada × custo_entrada)
 *          ÷ (estoque_antigo + qtd_entrada)
 *
 * Três casos que NÃO são a fórmula, e por quê:
 *
 *  - `quantidadeEntrada <= 0`: não houve entrada, então nada muda. Devolve o
 *    custo que já existia (inclusive `null`).
 *  - `estoqueAtual <= 0` (ou null): não há estoque antigo para ponderar. O novo
 *    custo é simplesmente o desta compra. Ponderar com zero unidades daria o
 *    mesmo resultado, mas escrever explícito evita divisão por zero.
 *  - `custoAtualCents === null`: o custo antigo é DESCONHECIDO, não é zero.
 *    Misturar "não sei" com um número real produziria um custo médio
 *    artificialmente baixo — exatamente o erro que faz a margem parecer boa.
 *    Nesse caso o custo passa a ser o desta compra, que é o único que sabemos.
 */
export function novoCustoMedioCents(entrada: EntradaDeCusto): number | null {
  const { estoqueAtual, custoAtualCents, quantidadeEntrada, custoUnitarioEntradaCents } = entrada;

  if (!Number.isFinite(quantidadeEntrada) || quantidadeEntrada <= 0) return custoAtualCents;
  if (!Number.isFinite(custoUnitarioEntradaCents) || custoUnitarioEntradaCents < 0) return custoAtualCents;

  const estoque = estoqueAtual ?? 0;
  if (estoque <= 0) return Math.round(custoUnitarioEntradaCents);
  if (custoAtualCents === null) return Math.round(custoUnitarioEntradaCents);

  const totalAntigo = estoque * custoAtualCents;
  const totalNovo = quantidadeEntrada * custoUnitarioEntradaCents;
  const unidades = estoque + quantidadeEntrada;
  return Math.round((totalAntigo + totalNovo) / unidades);
}

// ── Resumos do painel ───────────────────────────────────────────────────────

export type ProdutoEstoque = {
  id: string;
  name: string;
  priceCents: number;
  costCents: number | null;
  stockQuantity: number | null;
  lowStockThreshold: number | null;
};

/** Produto abaixo (ou em cima) do mínimo. Sem estoque ou sem mínimo = não sei. */
export function estoqueBaixo(p: ProdutoEstoque): boolean {
  if (p.stockQuantity === null || p.lowStockThreshold === null) return false;
  return p.stockQuantity <= p.lowStockThreshold;
}

export type ValorParado = {
  /** Soma de (saldo × custo) só dos produtos que têm OS DOIS números. */
  valorCents: number;
  /** Quantos produtos entraram na conta. */
  produtosContados: number;
  /**
   * Quantos ficaram DE FORA por falta de custo ou de estoque. Enquanto isso for
   * maior que zero, o valor acima é um piso, não o total — e a tela precisa
   * dizer isso.
   */
  produtosIncompletos: number;
};

export function valorParadoEmEstoque(produtos: readonly ProdutoEstoque[]): ValorParado {
  let valorCents = 0;
  let produtosContados = 0;
  let produtosIncompletos = 0;

  for (const p of produtos) {
    if (p.costCents === null || p.stockQuantity === null) {
      produtosIncompletos += 1;
      continue;
    }
    valorCents += p.costCents * p.stockQuantity;
    produtosContados += 1;
  }

  return { valorCents, produtosContados, produtosIncompletos };
}

export type MargemMedia = {
  /**
   * Margem média em pontos percentuais, ou `null` quando NENHUM produto tem
   * custo cadastrado. `null` vira "—" na tela: não sabemos, e zero seria uma
   * afirmação falsa.
   */
  percentual: number | null;
  produtosContados: number;
  produtosSemCusto: number;
};

/**
 * Margem de um produto = (preço − custo) ÷ preço × 100.
 *
 * Média SIMPLES entre os produtos que têm custo (não ponderada por venda):
 * ponderar por venda exigiria juntar as vendas do período, e uma média de
 * margem que muda quando a lojista vende mais confunde mais do que ajuda aqui.
 * Produto com preço zero ou sem custo fica de fora e é contado à parte.
 */
export function margemMedia(produtos: readonly ProdutoEstoque[]): MargemMedia {
  let soma = 0;
  let produtosContados = 0;
  let produtosSemCusto = 0;

  for (const p of produtos) {
    if (p.costCents === null || p.priceCents <= 0) {
      produtosSemCusto += 1;
      continue;
    }
    soma += ((p.priceCents - p.costCents) / p.priceCents) * 100;
    produtosContados += 1;
  }

  if (produtosContados === 0) {
    return { percentual: null, produtosContados: 0, produtosSemCusto };
  }

  return {
    percentual: Math.round((soma / produtosContados) * 10) / 10,
    produtosContados,
    produtosSemCusto,
  };
}

// ── Total de uma compra ─────────────────────────────────────────────────────

export type ItemParaTotal = { quantity: number; unitCostCents: number };

/**
 * Total de uma linha: quantidade × custo unitário, arredondado para o centavo.
 * Nunca vem do formulário — quem soma é o servidor.
 */
export function totalDoItemCents(item: ItemParaTotal): number {
  return Math.round(item.quantity * item.unitCostCents);
}

/** Total da compra: a soma dos itens, e nada mais. */
export function totalDaCompraCents(itens: readonly ItemParaTotal[]): number {
  return itens.reduce((soma, item) => soma + totalDoItemCents(item), 0);
}
