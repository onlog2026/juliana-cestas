import { describe, expect, it } from "vitest";
import {
  isValidRating,
  orderForDay,
  sanitizeComment,
  sanitizeName,
  sanitizeReply,
  sanitizeText,
  seedFromString,
  seededShuffle,
  shortenName,
} from "@/modules/reviews/service";
import { reviewInviteEmail } from "@/modules/notifications/templates/review-invite";

/**
 * O que se prova aqui são as partes PURAS do módulo de avaliações — as que não
 * dependem de banco, de sessão nem do relógio: validação da nota (que vem do
 * navegador), sanitização (texto que vai parar na home de uma loja real) e a
 * ordem embaralhada da vitrine (que, se não for determinística, quebra a
 * hidratação do React em produção).
 *
 * Cada caso abaixo é uma armadilha concreta, não "cobertura".
 */

describe("nota (vem do cliente, revalidada no servidor)", () => {
  it("aceita só inteiros de 1 a 5", () => {
    expect(isValidRating(1)).toBe(true);
    expect(isValidRating(5)).toBe(true);
    expect(isValidRating(3)).toBe(true);
  });

  it("recusa fora da faixa, quebrado, texto e nulo", () => {
    // 0 e 6 são o chute mais provável de quem mexe no formulário pelo devtools.
    expect(isValidRating(0)).toBe(false);
    expect(isValidRating(6)).toBe(false);
    expect(isValidRating(-1)).toBe(false);
    expect(isValidRating(4.5)).toBe(false);
    expect(isValidRating("5")).toBe(false);
    expect(isValidRating(null)).toBe(false);
    expect(isValidRating(undefined)).toBe(false);
    expect(isValidRating(Number.NaN)).toBe(false);
  });
});

describe("sanitização do que o cliente escreve", () => {
  it("remove marcação colada de um editor", () => {
    expect(sanitizeComment("<b>Amei</b> a cesta")).toBe("Amei a cesta");
    expect(sanitizeComment("<script>alert(1)</script>ok")).toBe("ok");
  });

  it("remove '<' e '>' soltos, que o regex de tag não pega", () => {
    expect(sanitizeComment("nota 5 < isso é pouco")).not.toContain("<");
  });

  it("tira caractere de controle sem comer a quebra de linha", () => {
    const comControle = `linha 1${String.fromCharCode(0)}${String.fromCharCode(7)}\nlinha 2`;
    const limpo = sanitizeComment(comControle);
    expect(limpo).toBe("linha 1\nlinha 2");
  });

  it("corta no limite em vez de deixar um texto de 40 mil letras quebrar o carrossel", () => {
    expect(sanitizeComment("a".repeat(5000))).toHaveLength(800);
    expect(sanitizeName("a".repeat(500))).toHaveLength(80);
    expect(sanitizeReply("a".repeat(5000))).toHaveLength(800);
  });

  it("nulo/indefinido/vazio viram string vazia, nunca 'null' na tela", () => {
    expect(sanitizeText(null, 10)).toBe("");
    expect(sanitizeText(undefined, 10)).toBe("");
    expect(sanitizeText("   ", 10)).toBe("");
  });
});

describe("nome curto na vitrine", () => {
  it("mostra primeiro nome e inicial do sobrenome", () => {
    expect(shortenName("Maria Aparecida Souza")).toBe("Maria S.");
    expect(shortenName("Joao Silva")).toBe("Joao S.");
  });

  it("nome único fica inteiro e nome vazio nunca vira string vazia", () => {
    expect(shortenName("Juliana")).toBe("Juliana");
    expect(shortenName("   ")).toBe("Cliente");
  });
});

describe("ordem da vitrine (embaralhada com semente do dia)", () => {
  const avaliacoes = Array.from({ length: 12 }, (_, i) => ({
    id: `r${i}`,
    featured: i < 3,
  }));

  it("mesma loja + mesmo dia = MESMA ordem (senão a hidratação do React quebra)", () => {
    const a = orderForDay(avaliacoes, "loja-1", "2026-09-06");
    const b = orderForDay(avaliacoes, "loja-1", "2026-09-06");
    expect(a.map((r) => r.id)).toEqual(b.map((r) => r.id));
  });

  it("dia seguinte = ordem diferente (é o que faz a vitrine rodar)", () => {
    const hoje = orderForDay(avaliacoes, "loja-1", "2026-09-06").map((r) => r.id);
    const amanha = orderForDay(avaliacoes, "loja-1", "2026-09-07").map((r) => r.id);
    expect(hoje).not.toEqual(amanha);
  });

  it("lojas diferentes não veem a mesma sequência", () => {
    const loja1 = orderForDay(avaliacoes, "loja-1", "2026-09-06").map((r) => r.id);
    const loja2 = orderForDay(avaliacoes, "loja-2", "2026-09-06").map((r) => r.id);
    expect(loja1).not.toEqual(loja2);
  });

  it("destaques vêm sempre antes das demais", () => {
    const ordenadas = orderForDay(avaliacoes, "loja-1", "2026-09-06");
    expect(ordenadas.slice(0, 3).every((r) => r.featured)).toBe(true);
    expect(ordenadas.slice(3).some((r) => r.featured)).toBe(false);
  });

  it("não perde nem duplica avaliação ao embaralhar", () => {
    const ordenadas = orderForDay(avaliacoes, "loja-1", "2026-09-06");
    expect(ordenadas).toHaveLength(avaliacoes.length);
    expect(new Set(ordenadas.map((r) => r.id)).size).toBe(avaliacoes.length);
  });

  it("lista vazia e lista de um item não quebram", () => {
    expect(orderForDay([], "loja-1", "2026-09-06")).toEqual([]);
    expect(orderForDay([{ id: "x", featured: false }], "loja-1", "2026-09-06")).toHaveLength(1);
  });

  it("seededShuffle não altera o array recebido", () => {
    const original = [1, 2, 3, 4, 5];
    const copia = original.slice();
    seededShuffle(original, seedFromString("qualquer"));
    expect(original).toEqual(copia);
  });
});

describe("e-mail de convite", () => {
  const base = {
    orderNumber: 1042,
    buyerName: "Maria Aparecida",
    itemNames: ["Cesta Café da Manhã"],
    reviewUrl: "https://loja.example.com/avaliar/abc123",
  };

  it("as cinco estrelas levam a nota na URL (um clique resolve)", () => {
    const { html } = reviewInviteEmail(base);
    for (const nota of [1, 2, 3, 4, 5]) {
      expect(html).toContain(`${base.reviewUrl}?nota=${nota}`);
    }
  });

  it("tem fallback em texto com o link legível, para cliente que não renderiza HTML", () => {
    const { html, text } = reviewInviteEmail(base);
    expect(html).toContain(base.reviewUrl);
    expect(text).toContain(`${base.reviewUrl}?nota=5`);
    expect(text).not.toContain("<");
  });

  it("assunto e corpo saem sem marca quando a loja não tem nome cadastrado", () => {
    const { subject } = reviewInviteEmail(base);
    // Sem nome de loja, o assunto NUNCA pode terminar com um travessão solto.
    expect(subject.trim().endsWith("—")).toBe(false);
    expect(subject).toContain("Maria");
  });

  it("usa o nome da loja quando existe", () => {
    const { subject, html } = reviewInviteEmail(base, {
      storeName: "Juliana Present",
      logoUrl: "https://cdn.example.com/logo.png",
      siteUrl: "https://loja.example.com",
      replyTo: "contato@example.com",
    });
    expect(subject).toContain("Juliana Present");
    // O logo da loja tem que estar no e-mail — foi pedido explicitamente.
    expect(html).toContain("https://cdn.example.com/logo.png");
  });

  it("mostra o que a pessoa comprou", () => {
    const { html } = reviewInviteEmail(base);
    expect(html).toContain("Cesta Café da Manhã");
  });
});
