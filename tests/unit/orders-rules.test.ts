import { describe, expect, it } from "vitest";
import { PEDIDO_ENCERRADO, dataDeEntregaValida, podeAlterarPedido } from "../../src/modules/orders/rules";

/**
 * Regras de "o que dá para mexer num pedido depois de criado". Puras, sem
 * banco -- a parte cara de verdade (excluir recusado pelo próprio Postgres
 * quando existe pagamento ou chamado de suporte) só é possível provar contra
 * o banco real; aqui prova-se o que é possível provar sem ele.
 */

describe("podeAlterarPedido", () => {
  it("libera edição em qualquer status do fluxo normal", () => {
    for (const status of ["aguardando_pagamento", "novo", "pago", "em_preparacao", "pronto", "saiu_para_entrega"]) {
      expect(podeAlterarPedido(status)).toBe(true);
    }
  });

  it("recusa editar pedido entregue, cancelado ou reembolsado", () => {
    for (const status of PEDIDO_ENCERRADO) {
      expect(podeAlterarPedido(status)).toBe(false);
    }
  });
});

describe("dataDeEntregaValida", () => {
  it("aceita o formato que o <input type=date> do navegador manda", () => {
    expect(dataDeEntregaValida("2026-12-25")).toBe(true);
  });

  it("recusa formato brasileiro, vazio ou lixo -- nunca grava data quebrada", () => {
    expect(dataDeEntregaValida("25/12/2026")).toBe(false);
    expect(dataDeEntregaValida("")).toBe(false);
    expect(dataDeEntregaValida("2026-12-25T00:00:00Z")).toBe(false);
    expect(dataDeEntregaValida("amanhã")).toBe(false);
  });
});
