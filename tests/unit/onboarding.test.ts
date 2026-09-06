import { describe, expect, it } from "vitest";
import {
  RESERVED_SLUGS,
  SLUG_MAX,
  SLUG_MIN,
  isWhatsappValido,
  normalizeSlug,
  normalizeWhatsapp,
  painelUrlDaLoja,
  validateSlug,
} from "../../src/modules/platform/onboarding";

/**
 * O endereço da loja é a única coisa do cadastro que, na prática, NÃO tem
 * volta: no dia seguinte já está num cartão impresso, num QR code e na bio do
 * Instagram. Trocar depois quebra tudo isso.
 *
 * Por isso as duas funções que decidem qual endereço pode existir são puras e
 * têm teste — e por isso o servidor as chama DE NOVO antes de gravar, mesmo o
 * formulário já tendo conferido.
 */

describe("normalizeSlug", () => {
  it("transforma o que a pessoa digita no endereço que o sistema usaria", () => {
    expect(normalizeSlug("Cestas da Ju")).toBe("cestas-da-ju");
  });

  it("tira acento de verdade, sem comer a letra", () => {
    expect(normalizeSlug("Café São João")).toBe("cafe-sao-joao");
    expect(normalizeSlug("Açaí")).toBe("acai");
    expect(normalizeSlug("coração")).toBe("coracao");
  });

  it("junta espaço, símbolo e emoji num hífen só", () => {
    expect(normalizeSlug("  Flores   &   Cia  ")).toBe("flores-cia");
    expect(normalizeSlug("Doces ✿ da ✿ Vó")).toBe("doces-da-vo");
  });

  it("não deixa hífen sobrando no começo, no fim nem dobrado", () => {
    expect(normalizeSlug("---loja---")).toBe("loja");
    expect(normalizeSlug("loja -- top")).toBe("loja-top");
    expect(normalizeSlug("-a-b-")).toBe("a-b");
  });

  it("corta no tamanho máximo sem terminar em hífen", () => {
    const gerado = normalizeSlug("a".repeat(SLUG_MAX - 1) + " bcdef");
    expect(gerado.length).toBeLessThanOrEqual(SLUG_MAX);
    expect(gerado.endsWith("-")).toBe(false);
  });

  it("devolve vazio para entrada que não vira endereço nenhum", () => {
    expect(normalizeSlug("")).toBe("");
    expect(normalizeSlug("   ")).toBe("");
    expect(normalizeSlug("!!!")).toBe("");
    expect(normalizeSlug(null)).toBe("");
    expect(normalizeSlug(undefined)).toBe("");
  });

  it("o que sai da normalização SEMPRE passa na validação (ou é vazio)", () => {
    const entradas = ["Cestas da Ju", "Café São João", "  Flores & Cia  ", "LOJA-TOP", "a b c"];
    for (const entrada of entradas) {
      const slug = normalizeSlug(entrada);
      expect(validateSlug(slug, []).ok, `falhou para "${entrada}" -> "${slug}"`).toBe(true);
    }
  });
});

describe("validateSlug", () => {
  it("aceita o formato certo", () => {
    expect(validateSlug("cestas-da-ju", RESERVED_SLUGS).ok).toBe(true);
    expect(validateSlug("loja123", RESERVED_SLUGS).ok).toBe(true);
    expect(validateSlug("a1b", RESERVED_SLUGS).ok).toBe(true);
  });

  it("recusa acento, espaço e maiúscula", () => {
    for (const ruim of ["café", "minha loja", "Loja", "MINHALOJA", "loja_top", "loja.top"]) {
      const r = validateSlug(ruim, RESERVED_SLUGS);
      expect(r.ok, `deveria recusar "${ruim}"`).toBe(false);
      if (!r.ok) expect(r.motivo).toBe("formato");
    }
  });

  it("recusa hífen no começo, no fim e dobrado", () => {
    for (const ruim of ["-loja", "loja-", "-loja-", "loja--top"]) {
      const r = validateSlug(ruim, RESERVED_SLUGS);
      expect(r.ok, `deveria recusar "${ruim}"`).toBe(false);
      if (!r.ok) expect(r.motivo).toBe("formato");
    }
  });

  it("recusa endereço curto demais", () => {
    const r = validateSlug("ab", RESERVED_SLUGS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe("curto");
    expect(SLUG_MIN).toBe(3);
  });

  it("recusa endereço comprido demais", () => {
    const r = validateSlug("a".repeat(SLUG_MAX + 1), RESERVED_SLUGS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe("longo");
  });

  it("recusa vazio com motivo próprio, não como erro de formato", () => {
    for (const vazio of ["", "   ", null, undefined]) {
      const r = validateSlug(vazio, RESERVED_SLUGS);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.motivo).toBe("vazio");
    }
  });

  it("recusa palavra reservada", () => {
    for (const reservado of ["admin", "api", "checkout", "planos", "cadastro", "juliana-cestas"]) {
      const r = validateSlug(reservado, RESERVED_SLUGS);
      expect(r.ok, `deveria recusar "${reservado}"`).toBe(false);
      if (!r.ok) expect(r.motivo).toBe("reservado");
    }
  });

  it("compara reservados sem se importar com maiúscula e espaço na lista", () => {
    const r = validateSlug("minha-loja", ["  MINHA-LOJA  "]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe("reservado");
  });

  it("com lista vazia de reservados, o endereço reservado passaria — a lista é obrigação de quem chama", () => {
    // Documenta a fronteira: `validateSlug` não conhece nenhuma lista sozinha.
    // Quem grava (createStoreForUser) soma a lista do código com a do banco.
    expect(validateSlug("admin", []).ok).toBe(true);
  });

  it("a lista do código traz as palavras críticas de rota", () => {
    for (const obrigatoria of [
      "admin",
      "api",
      "super",
      "app",
      "www",
      "plataforma",
      "planos",
      "cadastro",
      "entrar",
      "conta",
      "checkout",
      "pedido",
      "blog",
      "ajuda",
      "suporte",
      "loja",
      "teste",
      "juliana-cestas",
    ]) {
      expect(RESERVED_SLUGS, `faltou "${obrigatoria}" na lista do código`).toContain(obrigatoria);
    }
  });
});

describe("normalizeWhatsapp", () => {
  it("grava só dígitos, no mesmo formato da loja fundadora", () => {
    expect(normalizeWhatsapp("(61) 99889-4889")).toBe("5561998894889");
    expect(normalizeWhatsapp("61 9988-4889")).toBe("556199884889");
  });

  it("não põe 55 duas vezes em quem já digitou o país", () => {
    expect(normalizeWhatsapp("+55 61 99889-4889")).toBe("5561998894889");
  });

  it("devolve vazio quando não há número", () => {
    expect(normalizeWhatsapp("")).toBe("");
    expect(normalizeWhatsapp("sem número")).toBe("");
    expect(normalizeWhatsapp(null)).toBe("");
  });
});

describe("isWhatsappValido", () => {
  it("aceita celular e fixo com DDD", () => {
    expect(isWhatsappValido("(61) 99889-4889")).toBe(true);
    expect(isWhatsappValido("6132345678")).toBe(true);
  });

  it("recusa número curto demais ou lixo", () => {
    expect(isWhatsappValido("998894889")).toBe(false);
    expect(isWhatsappValido("123")).toBe(false);
    expect(isWhatsappValido("")).toBe(false);
  });
});

describe("painelUrlDaLoja", () => {
  it("com domínio configurado, cada loja tem o próprio endereço", () => {
    expect(painelUrlDaLoja("cestas-da-ju", false, "minhaplataforma.com.br")).toBe(
      "https://cestas-da-ju.minhaplataforma.com.br/admin"
    );
  });

  it("SEM domínio configurado, loja nova não tem painel para abrir", () => {
    // É o risco declarado no relatório: mandar para `/admin` abriria o painel
    // da loja legada, que recusa a conta de quem acabou de cadastrar.
    expect(painelUrlDaLoja("cestas-da-ju", false, "")).toBeNull();
  });

  it("SEM domínio configurado, a loja legada continua abrindo em /admin", () => {
    expect(painelUrlDaLoja("juliana-present", true, "")).toBe("/admin");
  });
});
