import { describe, expect, it } from "vitest";
import {
  aplicarMovimento,
  estoqueBaixo,
  margemMedia,
  novoCustoMedioCents,
  requerMotivo,
  totalDaCompraCents,
  totalDoItemCents,
  validarCentavos,
  validarContagem,
  validarQuantidade,
  validarQuantidadeInteira,
  valorParadoEmEstoque,
  type ProdutoEstoque,
} from "@/modules/inventory/movements";

/**
 * As contas do estoque, provadas uma a uma.
 *
 * A mais importante é o CUSTO MÉDIO PONDERADO: errada, ela faz a lojista olhar
 * a margem na tela, achar que está lucrando, e estar perdendo — sem que nada na
 * tela denuncie. Por isso ela tem caso a caso aqui, inclusive os três casos que
 * NÃO são a fórmula.
 */

function produto(parcial: Partial<ProdutoEstoque>): ProdutoEstoque {
  return {
    id: "p1",
    name: "Cesta",
    priceCents: 10_000,
    costCents: null,
    stockQuantity: null,
    lowStockThreshold: null,
    ...parcial,
  };
}

describe("custo médio ponderado", () => {
  it("faz a média ponderada entre o estoque antigo e a compra nova", () => {
    // 10 unidades a R$ 10,00 + 10 unidades a R$ 20,00 = R$ 15,00 de média.
    expect(
      novoCustoMedioCents({
        estoqueAtual: 10,
        custoAtualCents: 1_000,
        quantidadeEntrada: 10,
        custoUnitarioEntradaCents: 2_000,
      })
    ).toBe(1_500);
  });

  it("pondera de verdade: quantidade maior puxa a média para o lado dela", () => {
    // 1 a R$ 10,00 + 9 a R$ 20,00 = (1000 + 18000) / 10 = R$ 19,00.
    expect(
      novoCustoMedioCents({
        estoqueAtual: 1,
        custoAtualCents: 1_000,
        quantidadeEntrada: 9,
        custoUnitarioEntradaCents: 2_000,
      })
    ).toBe(1_900);
    // A média simples daria R$ 15,00 — o erro clássico que este teste barra.
  });

  it("arredonda para o centavo inteiro", () => {
    // (3 × 1000 + 1 × 1001) / 4 = 1000,25 -> 1000
    expect(
      novoCustoMedioCents({
        estoqueAtual: 3,
        custoAtualCents: 1_000,
        quantidadeEntrada: 1,
        custoUnitarioEntradaCents: 1_001,
      })
    ).toBe(1_000);
    expect(
      Number.isInteger(
        novoCustoMedioCents({
          estoqueAtual: 7,
          custoAtualCents: 333,
          quantidadeEntrada: 5,
          custoUnitarioEntradaCents: 777,
        })
      )
    ).toBe(true);
  });

  it("sem estoque antigo, o custo passa a ser o da compra", () => {
    expect(
      novoCustoMedioCents({
        estoqueAtual: 0,
        custoAtualCents: 5_000,
        quantidadeEntrada: 4,
        custoUnitarioEntradaCents: 1_200,
      })
    ).toBe(1_200);
    expect(
      novoCustoMedioCents({
        estoqueAtual: null,
        custoAtualCents: null,
        quantidadeEntrada: 4,
        custoUnitarioEntradaCents: 1_200,
      })
    ).toBe(1_200);
  });

  it('custo antigo desconhecido NÃO vira zero: usa o custo da compra', () => {
    // Se tratasse null como 0, o resultado seria (10×0 + 10×2000)/20 = 1000 —
    // metade do custo real. É esse número, e não o certo, que faz a margem
    // parecer boa.
    expect(
      novoCustoMedioCents({
        estoqueAtual: 10,
        custoAtualCents: null,
        quantidadeEntrada: 10,
        custoUnitarioEntradaCents: 2_000,
      })
    ).toBe(2_000);
  });

  it("entrada inválida não muda o custo que já existia", () => {
    expect(
      novoCustoMedioCents({
        estoqueAtual: 10,
        custoAtualCents: 1_000,
        quantidadeEntrada: 0,
        custoUnitarioEntradaCents: 5_000,
      })
    ).toBe(1_000);
    expect(
      novoCustoMedioCents({
        estoqueAtual: 10,
        custoAtualCents: 1_000,
        quantidadeEntrada: -3,
        custoUnitarioEntradaCents: 5_000,
      })
    ).toBe(1_000);
    expect(
      novoCustoMedioCents({
        estoqueAtual: 10,
        custoAtualCents: null,
        quantidadeEntrada: 0,
        custoUnitarioEntradaCents: 5_000,
      })
    ).toBeNull();
  });

  it("compra a custo zero (brinde do fornecedor) puxa a média para baixo, e isso é correto", () => {
    expect(
      novoCustoMedioCents({
        estoqueAtual: 10,
        custoAtualCents: 1_000,
        quantidadeEntrada: 10,
        custoUnitarioEntradaCents: 0,
      })
    ).toBe(500);
  });
});

describe("aplicar movimentação no saldo", () => {
  it("entrada soma", () => {
    expect(aplicarMovimento(5, "entrada", 3)).toEqual({ ok: true, saldo: 8 });
  });

  it("saída e perda subtraem", () => {
    expect(aplicarMovimento(5, "saida", 2)).toEqual({ ok: true, saldo: 3 });
    expect(aplicarMovimento(5, "perda", 5)).toEqual({ ok: true, saldo: 0 });
  });

  it("não deixa o estoque ficar negativo e explica o que fazer", () => {
    const resultado = aplicarMovimento(2, "saida", 3);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.erro).toContain("Ajuste de contagem");
  });

  it("ajuste define o saldo (é a contagem da prateleira, não uma diferença)", () => {
    expect(aplicarMovimento(50, "ajuste", 47)).toEqual({ ok: true, saldo: 47 });
    expect(aplicarMovimento(2, "ajuste", 0)).toEqual({ ok: true, saldo: 0 });
  });

  it("produto sem controle de estoque (null) começa do zero", () => {
    expect(aplicarMovimento(null, "entrada", 4)).toEqual({ ok: true, saldo: 4 });
    // E não pode sair do nada: null vira 0, não vira "infinito".
    expect(aplicarMovimento(null, "saida", 1).ok).toBe(false);
  });

  it("quantidade zero ou negativa é recusada (exceto ajuste)", () => {
    expect(aplicarMovimento(5, "entrada", 0).ok).toBe(false);
    expect(aplicarMovimento(5, "saida", -1).ok).toBe(false);
  });
});

describe("motivo obrigatório", () => {
  it("ajuste e perda exigem motivo; entrada e saída não", () => {
    expect(requerMotivo("ajuste")).toBe(true);
    expect(requerMotivo("perda")).toBe(true);
    expect(requerMotivo("entrada")).toBe(false);
    expect(requerMotivo("saida")).toBe(false);
  });
});

describe("validação do que vem do formulário", () => {
  it("recusa quantidade não numérica, zero, negativa e absurda", () => {
    expect(validarQuantidade("abc").ok).toBe(false);
    expect(validarQuantidade(0).ok).toBe(false);
    expect(validarQuantidade(-5).ok).toBe(false);
    expect(validarQuantidade(999_999_999).ok).toBe(false);
    expect(validarQuantidade("2,5")).toEqual({ ok: false, erro: expect.any(String) });
    expect(validarQuantidade(2.5)).toEqual({ ok: true, valor: 2.5 });
  });

  it("quantidade ligada a produto do catálogo tem que ser inteira", () => {
    expect(validarQuantidadeInteira(3)).toEqual({ ok: true, valor: 3 });
    expect(validarQuantidadeInteira(1.5).ok).toBe(false);
  });

  it("contagem aceita zero (contei e não tem nenhuma), mas não fração nem negativo", () => {
    expect(validarContagem(0)).toEqual({ ok: true, valor: 0 });
    expect(validarContagem(-1).ok).toBe(false);
    expect(validarContagem(1.5).ok).toBe(false);
  });

  it("valor em dinheiro só passa se for centavo inteiro e não negativo", () => {
    expect(validarCentavos(1_999)).toEqual({ ok: true, valor: 1_999 });
    expect(validarCentavos(0)).toEqual({ ok: true, valor: 0 });
    expect(validarCentavos(19.99).ok).toBe(false); // reais entrando onde só entra centavo
    expect(validarCentavos(-1).ok).toBe(false);
    expect(validarCentavos(999_999_999).ok).toBe(false);
  });
});

describe("total da compra (conferido no servidor)", () => {
  it("total do item é quantidade × custo unitário, no centavo", () => {
    expect(totalDoItemCents({ quantity: 3, unitCostCents: 1_250 })).toBe(3_750);
    expect(totalDoItemCents({ quantity: 1.5, unitCostCents: 1_001 })).toBe(1_502); // 1501,5 -> 1502
  });

  it("total da compra é a soma dos itens", () => {
    expect(
      totalDaCompraCents([
        { quantity: 2, unitCostCents: 1_000 },
        { quantity: 3, unitCostCents: 500 },
      ])
    ).toBe(3_500);
    expect(totalDaCompraCents([])).toBe(0);
  });
});

describe("valor parado em estoque", () => {
  it("soma custo × saldo só de quem tem os dois", () => {
    const resultado = valorParadoEmEstoque([
      produto({ id: "a", costCents: 1_000, stockQuantity: 3 }),
      produto({ id: "b", costCents: 2_000, stockQuantity: 1 }),
    ]);
    expect(resultado.valorCents).toBe(5_000);
    expect(resultado.produtosContados).toBe(2);
    expect(resultado.produtosIncompletos).toBe(0);
  });

  it('produto sem custo NÃO entra como zero: fica contado como "não sei"', () => {
    const resultado = valorParadoEmEstoque([
      produto({ id: "a", costCents: 1_000, stockQuantity: 3 }),
      produto({ id: "b", costCents: null, stockQuantity: 100 }),
      produto({ id: "c", costCents: 500, stockQuantity: null }),
    ]);
    expect(resultado.valorCents).toBe(3_000);
    expect(resultado.produtosContados).toBe(1);
    expect(resultado.produtosIncompletos).toBe(2);
  });
});

describe("margem média", () => {
  it("é (preço − custo) ÷ preço, em média simples", () => {
    const resultado = margemMedia([
      produto({ id: "a", priceCents: 10_000, costCents: 6_000 }), // 40%
      produto({ id: "b", priceCents: 10_000, costCents: 8_000 }), // 20%
    ]);
    expect(resultado.percentual).toBe(30);
    expect(resultado.produtosContados).toBe(2);
  });

  it('sem nenhum custo cadastrado devolve null (a tela mostra "—", nunca zero)', () => {
    const resultado = margemMedia([produto({ id: "a", costCents: null })]);
    expect(resultado.percentual).toBeNull();
    expect(resultado.produtosSemCusto).toBe(1);
  });

  it("margem negativa aparece negativa (vender abaixo do custo tem que doer na tela)", () => {
    const resultado = margemMedia([produto({ id: "a", priceCents: 5_000, costCents: 7_500 })]);
    expect(resultado.percentual).toBe(-50);
  });

  it("produto sem preço fica de fora em vez de dividir por zero", () => {
    const resultado = margemMedia([produto({ id: "a", priceCents: 0, costCents: 1_000 })]);
    expect(resultado.percentual).toBeNull();
    expect(resultado.produtosSemCusto).toBe(1);
  });
});

describe("alerta de estoque baixo", () => {
  it("dispara quando o saldo é menor OU IGUAL ao mínimo", () => {
    expect(estoqueBaixo(produto({ stockQuantity: 2, lowStockThreshold: 3 }))).toBe(true);
    expect(estoqueBaixo(produto({ stockQuantity: 3, lowStockThreshold: 3 }))).toBe(true);
    expect(estoqueBaixo(produto({ stockQuantity: 4, lowStockThreshold: 3 }))).toBe(false);
  });

  it("sem saldo ou sem mínimo cadastrado não dispara alarme falso", () => {
    expect(estoqueBaixo(produto({ stockQuantity: null, lowStockThreshold: 3 }))).toBe(false);
    expect(estoqueBaixo(produto({ stockQuantity: 0, lowStockThreshold: null }))).toBe(false);
  });
});
