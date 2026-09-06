import { describe, expect, it } from "vitest";
import {
  clampDelayHours,
  isAbandonedCartCandidate,
  MIN_DELAY_HOURS,
  MAX_DELAY_HOURS,
  MAX_CANDIDATE_AGE_DAYS,
} from "@/modules/automations/service";
import { cartRecoveryEmail } from "@/modules/notifications/templates/cart-recovery";

/**
 * O que se prova aqui são as partes PURAS do módulo de automações — as que não
 * dependem de banco nem de sessão: a trava do prazo configurável (que o
 * painel deixa a lojista digitar, então tem que aguentar qualquer número) e a
 * regra de quem É candidato a "carrinho abandonado" (o coração da automação:
 * se ela errar, ou ninguém recebe e-mail, ou todo mundo recebe cedo demais).
 */

describe("clampDelayHours (o que a lojista digita no painel)", () => {
  it("aceita a faixa normal sem alterar", () => {
    expect(clampDelayHours(2)).toBe(2);
    expect(clampDelayHours(24)).toBe(24);
  });

  it("nunca deixa passar de 48h nem cair abaixo de 1h", () => {
    expect(clampDelayHours(0)).toBe(MIN_DELAY_HOURS);
    expect(clampDelayHours(-5)).toBe(MIN_DELAY_HOURS);
    expect(clampDelayHours(999)).toBe(MAX_DELAY_HOURS);
  });

  it("arredonda fração para o inteiro mais próximo", () => {
    expect(clampDelayHours(2.6)).toBe(3);
    expect(clampDelayHours(2.4)).toBe(2);
  });

  it("lixo (NaN, string via cast, infinito) cai no padrão de 2h, nunca quebra", () => {
    expect(clampDelayHours(Number.NaN)).toBe(2);
    expect(clampDelayHours(Number.POSITIVE_INFINITY)).toBe(2);
  });
});

describe("isAbandonedCartCandidate (quem entra na lista de e-mail)", () => {
  const agora = new Date("2026-09-06T12:00:00Z");

  it("pedido pago NUNCA é candidato, mesmo muito antigo", () => {
    const criadoHa10Dias = new Date(agora.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
    expect(isAbandonedCartCandidate({ status: "pago", createdAt: criadoHa10Dias }, agora, 2)).toBe(false);
  });

  it("pedido cancelado NUNCA é candidato", () => {
    const criadoHa5Horas = new Date(agora.getTime() - 5 * 60 * 60 * 1000).toISOString();
    expect(isAbandonedCartCandidate({ status: "cancelado", createdAt: criadoHa5Horas }, agora, 2)).toBe(false);
  });

  it("pedido recém-criado (antes do prazo configurado) ainda NÃO é candidato", () => {
    const criadoHa1Hora = new Date(agora.getTime() - 1 * 60 * 60 * 1000).toISOString();
    expect(
      isAbandonedCartCandidate({ status: "aguardando_pagamento", createdAt: criadoHa1Hora }, agora, 2)
    ).toBe(false);
  });

  it("pedido exatamente no prazo configurado já é candidato (>=)", () => {
    const criadoHa2Horas = new Date(agora.getTime() - 2 * 60 * 60 * 1000).toISOString();
    expect(
      isAbandonedCartCandidate({ status: "aguardando_pagamento", createdAt: criadoHa2Horas }, agora, 2)
    ).toBe(true);
  });

  it("pedido de 3 dias atrás com regra de 2h é candidato", () => {
    const criadoHa3Dias = new Date(agora.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(
      isAbandonedCartCandidate({ status: "aguardando_pagamento", createdAt: criadoHa3Dias }, agora, 2)
    ).toBe(true);
  });

  it(`pedido de mais de ${MAX_CANDIDATE_AGE_DAYS} dias NÃO é candidato -- carrinho de mês passado`, () => {
    const criadoHa10Dias = new Date(agora.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
    expect(
      isAbandonedCartCandidate({ status: "aguardando_pagamento", createdAt: criadoHa10Dias }, agora, 2)
    ).toBe(false);
  });

  it("data de criação inválida nunca vira candidato (nunca quebra a varredura)", () => {
    expect(
      isAbandonedCartCandidate({ status: "aguardando_pagamento", createdAt: "data-invalida" }, agora, 2)
    ).toBe(false);
  });

  it("aceita Date além de string ISO", () => {
    const criadoHa3Horas = new Date(agora.getTime() - 3 * 60 * 60 * 1000);
    expect(isAbandonedCartCandidate({ status: "aguardando_pagamento", createdAt: criadoHa3Horas }, agora, 2)).toBe(
      true
    );
  });
});

describe("e-mail de recuperação de carrinho", () => {
  const base = {
    orderNumber: 2048,
    buyerName: "Carla Mendes",
    itemNames: ["Cesta Manhã Especial"],
    checkoutUrl: "https://loja.example.com/pedido/abc-123?t=xyz789",
  };

  it("o botão e o link de apoio levam para a página do pedido", () => {
    const { html } = cartRecoveryEmail(base);
    expect(html).toContain(base.checkoutUrl);
  });

  it("tem fallback em texto com o link legível, para cliente que não renderiza HTML", () => {
    const { html, text } = cartRecoveryEmail(base);
    expect(html).toContain(base.checkoutUrl);
    expect(text).toContain(base.checkoutUrl);
    expect(text).not.toContain("<");
  });

  it("assunto nunca termina com travessão solto quando a loja não tem nome cadastrado", () => {
    const { subject } = cartRecoveryEmail(base);
    expect(subject.trim().endsWith("—")).toBe(false);
  });

  it("usa o nome da loja quando existe", () => {
    const { subject } = cartRecoveryEmail(base, {
      storeName: "Juliana Present",
      logoUrl: null,
      siteUrl: "https://loja.example.com",
      replyTo: null,
    });
    expect(subject).toContain("Juliana Present");
  });

  it("mostra o que a pessoa tinha escolhido", () => {
    const { html, text } = cartRecoveryEmail(base);
    expect(html).toContain("Cesta Manhã Especial");
    expect(text).toContain("Cesta Manhã Especial");
  });

  it("mostra o número do pedido", () => {
    const { html } = cartRecoveryEmail(base);
    expect(html).toContain("2048");
  });
});
