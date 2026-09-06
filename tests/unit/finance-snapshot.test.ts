import { describe, expect, it } from "vitest";
import { needsRefresh, type FinanceSnapshotRow } from "@/modules/finance/snapshot";
import {
  csvField,
  buildExtractCsv,
  orderStatusLabel,
  paymentStatusLabel,
  billingTypeLabel,
  type ExtractRow,
} from "@/modules/finance/service";
import { formatCents } from "@/lib/money";

// `formatCents` usa Intl.NumberFormat, que no Node insere um ESPAÇO FIXO
// (U+00A0) entre "R$" e o número -- não o espaço comum (U+0020). Um literal
// "R$ 129,90" digitado à mão no teste teria o caractere errado e falharia por
// um motivo invisível a olho nu. Por isso o valor esperado abaixo sempre
// nasce de `formatCents`, nunca de um literal digitado.
const R129_90 = formatCents(12_990);

/**
 * O financeiro tem duas contas que não podem errar:
 *
 *  1. QUANDO consultar o Asaas de novo (`needsRefresh`) — errar para "sempre"
 *     estoura o limite de taxa da API; errar para "nunca" deixa a lojista
 *     vendo o saldo de ontem para sempre.
 *  2. O CSV do extrato — nome de cliente com vírgula e o próprio valor em
 *     reais formatado (que TEM vírgula: "R$ 129,90") são os dois jeitos reais
 *     de quebrar um CSV se o escape estiver errado.
 */

function snapshot(parcial: Partial<FinanceSnapshotRow>): FinanceSnapshotRow {
  return {
    date: "2026-09-05",
    balanceCents: 10_000,
    pendingCents: 5_000,
    salesCents: 20_000,
    ordersCount: 3,
    createdAt: "2026-09-05T12:00:00.000Z",
    ...parcial,
  };
}

describe("needsRefresh — quando vale a pena consultar o Asaas de novo", () => {
  it("nunca houve snapshot -> sempre consulta", () => {
    expect(needsRefresh(null, "2026-09-06", false)).toBe(true);
  });

  it("snapshot é de um dia anterior -> consulta de novo", () => {
    expect(needsRefresh(snapshot({ date: "2026-09-05" }), "2026-09-06", false)).toBe(true);
  });

  it("snapshot já é de hoje e ninguém forçou -> NÃO consulta de novo (poupa o limite de taxa)", () => {
    expect(needsRefresh(snapshot({ date: "2026-09-06" }), "2026-09-06", false)).toBe(false);
  });

  it("snapshot já é de hoje, mas a lojista clicou em 'Atualizar agora' -> força a consulta", () => {
    expect(needsRefresh(snapshot({ date: "2026-09-06" }), "2026-09-06", true)).toBe(true);
  });
});

function linha(parcial: Partial<ExtractRow>): ExtractRow {
  return {
    orderId: "11111111-1111-1111-1111-111111111111",
    orderNumber: 1042,
    createdAt: "2026-09-05T13:30:00.000Z",
    buyerName: "Ana Souza",
    totalCents: 12_990,
    orderStatus: "pago",
    paymentStatus: "paid",
    billingType: "PIX",
    paidAt: "2026-09-05T13:31:00.000Z",
    ...parcial,
  };
}

describe("csvField — escape RFC 4180", () => {
  it("campo simples não ganha aspas", () => {
    expect(csvField("Ana Souza")).toBe("Ana Souza");
  });

  it("campo com vírgula (nome de cliente 'Silva, Ana') vai entre aspas", () => {
    expect(csvField("Silva, Ana")).toBe('"Silva, Ana"');
  });

  it("campo com aspas dobra as aspas internas", () => {
    expect(csvField('Cesta "Premium"')).toBe('"Cesta ""Premium"""');
  });

  it("campo com quebra de linha vai entre aspas", () => {
    expect(csvField("Rua A\nBloco 2")).toBe('"Rua A\nBloco 2"');
  });

  it("valor em reais formatado (TEM vírgula: 'R$ 129,90') vai entre aspas", () => {
    expect(csvField(R129_90)).toBe(`"${R129_90}"`);
  });
});

describe("buildExtractCsv — o arquivo inteiro continua válido linha a linha", () => {
  it("gera cabeçalho e uma linha por pedido, separados por \\r\\n", () => {
    const csv = buildExtractCsv([linha({})]);
    const linhas = csv.split("\r\n");
    expect(linhas[0]).toBe("Pedido,Data,Cliente,Valor,Status do pedido,Status do pagamento,Forma de pagamento");
    expect(linhas).toHaveLength(2);
  });

  it("cliente com vírgula no nome não quebra a contagem de colunas da linha", () => {
    const csv = buildExtractCsv([
      linha({ orderNumber: 1042, createdAt: "2026-09-05T13:30:00.000Z", buyerName: "Silva, Ana", totalCents: 12_990 }),
    ]);
    const segundaLinha = csv.split("\r\n")[1];
    // Linha inteira, campo a campo: se a vírgula do nome não estivesse
    // escapada, esta linha teria 8 campos separados por vírgula em vez de 7.
    expect(segundaLinha).toBe(`1042,05/09/2026 10:30,"Silva, Ana","${R129_90}",Pago,Pago,Pix`);
  });

  it("o valor formatado em reais (com vírgula) fica entre aspas dentro da linha", () => {
    const csv = buildExtractCsv([linha({ totalCents: 12_990 })]);
    const segundaLinha = csv.split("\r\n")[1];
    expect(segundaLinha).toContain(`"${R129_90}"`);
  });

  it("lista vazia gera só o cabeçalho", () => {
    const csv = buildExtractCsv([]);
    expect(csv.split("\r\n")).toHaveLength(1);
  });
});

describe("rótulos em português", () => {
  it("status de pedido, pagamento e forma de cobrança têm rótulo em português", () => {
    expect(orderStatusLabel("pago")).toBe("Pago");
    expect(paymentStatusLabel("paid")).toBe("Pago");
    expect(billingTypeLabel("PIX")).toBe("Pix");
  });

  it("status desconhecido não quebra -- devolve o próprio valor", () => {
    expect(orderStatusLabel("status_novo_que_ainda_nao_existe")).toBe("status_novo_que_ainda_nao_existe");
  });

  it("pedido sem pagamento no Asaas explica que foi combinado pelo WhatsApp", () => {
    expect(billingTypeLabel(null)).toBe("Combinado pelo WhatsApp");
  });
});
