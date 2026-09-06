import { describe, expect, it } from "vitest";
import {
  avaliarLimiteEquipe,
  contarAtivos,
  contarDonosAtivos,
  emailValido,
  limparModulos,
  modulosParaPermissao,
  pessoaPodeVerModulo,
  podeDesativarMembro,
  podeTrocarPapel,
  type TeamMember,
} from "@/modules/team/service";
import { MODULE_SLUGS } from "@/lib/modules/registry";

/**
 * As regras da equipe são puras: recebem a lista de pessoas por parâmetro e não
 * tocam no banco. Por isso dá para provar aqui, sem servidor.
 *
 * Nenhum caso abaixo é "cobertura". Cada um é uma forma conhecida de a loja
 * quebrar em silêncio:
 *
 *  - a loja ficar sem NENHUMA dona ativa (por desativar OU por rebaixar);
 *  - `allowed_modules` vazio ser lido como "pode tudo";
 *  - um limite de plano que só existe escondendo o botão da tela.
 */

function pessoa(over: Partial<TeamMember> & { id: string }): TeamMember {
  return {
    email: `${over.id}@loja.com.br`,
    name: over.id,
    role: "staff",
    active: true,
    allowedModules: [],
    createdAt: null,
    ...over,
  };
}

describe("a loja nunca pode ficar sem dona ativa", () => {
  it("recusa desativar a última dona ativa, com mensagem em português", () => {
    const equipe = [
      pessoa({ id: "juliana", role: "admin" }),
      pessoa({ id: "ana", role: "staff" }),
      pessoa({ id: "beto", role: "admin", active: false }), // dona, mas já desativada
    ];

    const resultado = podeDesativarMembro("juliana", equipe);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.mensagem).toContain("última pessoa com acesso de dona");
      // A mensagem tem que dizer o que fazer, não só "não permitido".
      expect(resultado.mensagem).toContain("Promova outra pessoa a dona");
    }
  });

  it("deixa desativar uma dona quando existe outra dona ATIVA", () => {
    const equipe = [
      pessoa({ id: "juliana", role: "admin" }),
      pessoa({ id: "maria", role: "admin" }),
    ];
    expect(podeDesativarMembro("juliana", equipe).ok).toBe(true);
  });

  it("dona já desativada não conta como dona ativa", () => {
    const equipe = [
      pessoa({ id: "juliana", role: "admin" }),
      pessoa({ id: "maria", role: "admin", active: false }),
    ];
    expect(podeDesativarMembro("juliana", equipe).ok).toBe(false);
    expect(contarDonosAtivos(equipe)).toBe(1);
    expect(contarAtivos(equipe)).toBe(1);
  });

  it("deixa desativar quem não é dona, mesmo com uma dona só", () => {
    const equipe = [pessoa({ id: "juliana", role: "admin" }), pessoa({ id: "ana" })];
    expect(podeDesativarMembro("ana", equipe).ok).toBe(true);
  });

  it("fecha a outra porta: rebaixar a última dona para equipe também é recusado", () => {
    const equipe = [pessoa({ id: "juliana", role: "admin" }), pessoa({ id: "ana" })];

    expect(podeTrocarPapel("juliana", "staff", equipe).ok).toBe(false);
    // Promover é sempre permitido -- nunca deixa a loja órfã.
    expect(podeTrocarPapel("ana", "admin", equipe).ok).toBe(true);
    // Com duas donas, rebaixar uma volta a ser permitido.
    const comDuas = [...equipe, pessoa({ id: "maria", role: "admin" })];
    expect(podeTrocarPapel("juliana", "staff", comDuas).ok).toBe(true);
  });

  it("recusa mexer em quem não é desta loja", () => {
    const equipe = [pessoa({ id: "juliana", role: "admin" })];
    const r = podeDesativarMembro("alguem-de-outra-loja", equipe);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.mensagem).toContain("não faz parte da equipe");
  });
});

describe("permissão por pessoa: lista vazia NÃO concede tudo", () => {
  it("pessoa da equipe sem nada marcado só vê o núcleo", () => {
    const ana = { role: "staff" as const, active: true, allowedModules: [] };
    // Núcleo: sempre.
    expect(pessoaPodeVerModulo(ana, "pedidos")).toBe(true);
    expect(pessoaPodeVerModulo(ana, "produtos")).toBe(true);
    expect(pessoaPodeVerModulo(ana, "configuracoes")).toBe(true);
    // Tudo o mais: fechado.
    expect(pessoaPodeVerModulo(ana, "cupons")).toBe(false);
    expect(pessoaPodeVerModulo(ana, "financeiro")).toBe(false);
    expect(pessoaPodeVerModulo(ana, "equipe")).toBe(false);
  });

  it("abre só o que está marcado", () => {
    const ana = { role: "staff" as const, active: true, allowedModules: ["cupons"] };
    expect(pessoaPodeVerModulo(ana, "cupons")).toBe(true);
    expect(pessoaPodeVerModulo(ana, "seo")).toBe(false);
  });

  it("a dona da loja é exceção implícita: vê tudo, sem marcar nada", () => {
    const juliana = { role: "admin" as const, active: true, allowedModules: [] };
    for (const slug of MODULE_SLUGS) {
      expect(pessoaPodeVerModulo(juliana, slug)).toBe(true);
    }
    expect(pessoaPodeVerModulo(juliana, "assinatura")).toBe(true);
  });

  it("pessoa desativada não abre nada -- nem sendo dona, nem o núcleo", () => {
    const exDona = { role: "admin" as const, active: false, allowedModules: ["cupons"] };
    expect(pessoaPodeVerModulo(exDona, "pedidos")).toBe(false);
    expect(pessoaPodeVerModulo(exDona, "cupons")).toBe(false);
    expect(pessoaPodeVerModulo(exDona, "configuracoes")).toBe(false);
  });
});

describe("limite de pessoas do plano", () => {
  it("plano sem limite definido NÃO limita, e a tela diz isso", () => {
    const limite = avaliarLimiteEquipe(null, 12, 3);
    expect(limite.podeConvidar).toBe(true);
    expect(limite.maximo).toBeNull();
    expect(limite.mensagem).toContain("não define um limite");
  });

  it("recusa convidar quando as vagas acabaram", () => {
    const limite = avaliarLimiteEquipe(3, 3, 0);
    expect(limite.podeConvidar).toBe(false);
    expect(limite.mensagem).toContain("já estão ocupadas");
  });

  it("convite pendente ocupa vaga -- senão dá para estourar o plano convidando em lote", () => {
    const limite = avaliarLimiteEquipe(3, 2, 1);
    expect(limite.ocupadas).toBe(3);
    expect(limite.podeConvidar).toBe(false);
  });

  it("com vaga sobrando, diz quantas faltam", () => {
    expect(avaliarLimiteEquipe(5, 2, 1).podeConvidar).toBe(true);
    expect(avaliarLimiteEquipe(5, 2, 1).mensagem).toContain("Faltam 2 vagas");
    expect(avaliarLimiteEquipe(5, 3, 1).mensagem).toContain("Falta 1 vaga");
  });

  it("limite zero ou negativo é tratado como 'sem limite', não como 'ninguém entra'", () => {
    // Um 0 gravado por engano no plano não pode trancar a lojista fora da
    // própria equipe.
    expect(avaliarLimiteEquipe(0, 1, 0).podeConvidar).toBe(true);
    expect(avaliarLimiteEquipe(-3, 1, 0).maximo).toBeNull();
  });
});

describe("limpeza do que vem do navegador", () => {
  const disponiveis = ["cupons", "seo", "cms"];

  it("descarta módulo que não existe, repetido, e o que não está no plano da loja", () => {
    const saida = limparModulos(["cupons", "cupons", "modulo-inventado", "financeiro"], disponiveis);
    expect(saida).toEqual(["cupons"]);
  });

  it("descarta o núcleo (todo mundo já tem) e a tela de assinatura", () => {
    expect(limparModulos(["pedidos", "configuracoes", "assinatura", "seo"], disponiveis)).toEqual(["seo"]);
  });

  it("entrada que não é lista vira lista vazia, e lista vazia continua vazia", () => {
    expect(limparModulos(null, disponiveis)).toEqual([]);
    expect(limparModulos("cupons", disponiveis)).toEqual([]);
    expect(limparModulos([], disponiveis)).toEqual([]);
  });
});

describe("módulos oferecidos nas caixinhas", () => {
  it("só oferece o que a LOJA tem, e nunca oferece o núcleo", () => {
    const oferecidos = modulosParaPermissao(["pedidos", "produtos", "cupons", "seo"]);
    const slugs = oferecidos.map((m) => m.slug);
    expect(slugs).toContain("cupons");
    expect(slugs).toContain("seo");
    expect(slugs).not.toContain("pedidos");
    expect(slugs).not.toContain("produtos");
  });

  it("cada opção vem com nome e explicação para quem não é dev", () => {
    for (const modulo of modulosParaPermissao(["cupons"])) {
      expect(modulo.name.length).toBeGreaterThan(0);
      expect(modulo.description.length).toBeGreaterThan(0);
    }
  });
});

describe("e-mail do convite", () => {
  it("aceita e-mail comum", () => {
    expect(emailValido("juliana@lojadela.com.br")).toBe(true);
    expect(emailValido("  Ana.Souza@Gmail.com ")).toBe(true);
  });

  it("recusa o que não dá para enviar", () => {
    expect(emailValido("")).toBe(false);
    expect(emailValido("ana")).toBe(false);
    expect(emailValido("ana@loja")).toBe(false);
    expect(emailValido("ana @loja.com.br")).toBe(false);
  });
});
