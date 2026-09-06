import { describe, expect, it } from "vitest";
import {
  buildDnsInstructions,
  classifyDomainKind,
  interpretarA,
  interpretarCname,
  isPlatformOrInternalHost,
  isValidHostnameFormat,
  normalizeDomainHost,
  VERCEL_APEX_A_RECORD,
} from "@/modules/domains/service";

/**
 * Este módulo NUNCA fala com a Vercel de verdade (ver o comentário no topo de
 * `service.ts`). Os testes aqui provam só o que É de verdade: normalização,
 * validação do formato do host, a instrução de DNS que a tela mostra, e a
 * comparação do resultado de uma consulta DNS (função pura, sem rede) com o
 * que foi instruído.
 */

describe("normalizeDomainHost", () => {
  it("tira protocolo, caminho, porta, ponto final e maiúscula", () => {
    expect(normalizeDomainHost("HTTPS://Www.LojaDaMaria.COM.BR/algo?x=1")).toBe("www.lojadamaria.com.br");
    expect(normalizeDomainHost("loja.com.br:8443")).toBe("loja.com.br");
    expect(normalizeDomainHost("loja.com.br.")).toBe("loja.com.br");
    expect(normalizeDomainHost("  loja.com.br  ")).toBe("loja.com.br");
  });

  it("vazio ou nulo vira string vazia", () => {
    expect(normalizeDomainHost(null)).toBe("");
    expect(normalizeDomainHost(undefined)).toBe("");
    expect(normalizeDomainHost("")).toBe("");
  });
});

describe("isValidHostnameFormat", () => {
  it("aceita domínios reais", () => {
    expect(isValidHostnameFormat("www.lojadamaria.com.br")).toBe(true);
    expect(isValidHostnameFormat("lojadamaria.com.br")).toBe(true);
    expect(isValidHostnameFormat("minha-loja.com")).toBe(true);
  });

  it("recusa endereço de IP", () => {
    expect(isValidHostnameFormat("192.168.0.1")).toBe(false);
  });

  it("recusa uma palavra só (sem TLD, ex. localhost)", () => {
    expect(isValidHostnameFormat("localhost")).toBe(false);
    expect(isValidHostnameFormat("minhaloja")).toBe(false);
  });

  it("recusa rótulo com underscore, espaço ou hífen nas pontas", () => {
    expect(isValidHostnameFormat("minha_loja.com")).toBe(false);
    expect(isValidHostnameFormat("-loja.com")).toBe(false);
    expect(isValidHostnameFormat("loja-.com")).toBe(false);
  });

  it("recusa string vazia", () => {
    expect(isValidHostnameFormat("")).toBe(false);
  });
});

describe("isPlatformOrInternalHost", () => {
  const contexto = { platformDomain: "plataforma.com.br", siteUrl: "https://julianacesta.com.br" };

  it("recusa o domínio da própria plataforma e subdomínios dela", () => {
    expect(isPlatformOrInternalHost("plataforma.com.br", contexto)).toBe(true);
    expect(isPlatformOrInternalHost("lojadamaria.plataforma.com.br", contexto)).toBe(true);
  });

  it("recusa qualquer *.vercel.app", () => {
    expect(isPlatformOrInternalHost("meu-projeto.vercel.app", contexto)).toBe(true);
  });

  it("recusa a URL pública configurada hoje (loja legada)", () => {
    expect(isPlatformOrInternalHost("julianacesta.com.br", contexto)).toBe(true);
  });

  it("aceita um domínio de loja de verdade, que não é nada disso", () => {
    expect(isPlatformOrInternalHost("www.lojadamaria.com.br", contexto)).toBe(false);
  });

  it("sem PLATFORM_DOMAIN configurado (situação de hoje), só recusa vercel.app e a URL pública", () => {
    const semPlataforma = { platformDomain: "", siteUrl: "https://julianacesta.com.br" };
    expect(isPlatformOrInternalHost("www.lojadamaria.com.br", semPlataforma)).toBe(false);
    expect(isPlatformOrInternalHost("x.vercel.app", semPlataforma)).toBe(true);
  });
});

describe("classifyDomainKind", () => {
  it("domínio de 2 níveis é apex", () => {
    expect(classifyDomainKind("minhaloja.com")).toBe("apex");
  });

  it("domínio com TLD composto conhecido (com.br) é apex quando tem só 3 níveis", () => {
    expect(classifyDomainKind("lojadamaria.com.br")).toBe("apex");
  });

  it("www. de um domínio com TLD composto é subdomínio", () => {
    expect(classifyDomainKind("www.lojadamaria.com.br")).toBe("subdomain");
  });

  it("subdomínio comum (sem TLD composto) é subdomínio", () => {
    expect(classifyDomainKind("blog.minhaloja.com")).toBe("subdomain");
    expect(classifyDomainKind("www.minhaloja.com")).toBe("subdomain");
  });
});

describe("buildDnsInstructions", () => {
  it("apex pede registro A para o endereço documentado da Vercel", () => {
    const instrucao = buildDnsInstructions("minhaloja.com", "");
    expect(instrucao.tipo).toBe("A");
    expect(instrucao.valorEsperado).toBe(VERCEL_APEX_A_RECORD);
  });

  it("subdomínio pede CNAME apontando para o domínio da plataforma quando ele existe", () => {
    const instrucao = buildDnsInstructions("www.lojadamaria.com.br", "plataforma.com.br");
    expect(instrucao.tipo).toBe("CNAME");
    expect(instrucao.nome).toBe("www");
    expect(instrucao.valorEsperado).toBe("plataforma.com.br");
  });

  it("subdomínio sem PLATFORM_DOMAIN configurado (situação de hoje) devolve valorEsperado nulo e texto honesto", () => {
    const instrucao = buildDnsInstructions("www.lojadamaria.com.br", "");
    expect(instrucao.tipo).toBe("CNAME");
    expect(instrucao.valorEsperado).toBeNull();
    expect(instrucao.texto).toContain("ainda não tem um domínio próprio configurado");
  });
});

describe("interpretarCname", () => {
  it("bate com o alvo esperado (ignorando maiúscula/www)", () => {
    expect(interpretarCname(["Plataforma.com.br"], "plataforma.com.br").status).toBe("verificado");
  });

  it("nenhum CNAME publicado ainda -- erro explicando que pode ser propagação", () => {
    const r = interpretarCname([], "plataforma.com.br");
    expect(r.status).toBe("erro");
    if (r.status === "erro") expect(r.motivo).toContain("Não encontrei");
  });

  it("CNAME aponta para outro lugar -- erro cita o valor errado e o esperado", () => {
    const r = interpretarCname(["outro-lugar.com"], "plataforma.com.br");
    expect(r.status).toBe("erro");
    if (r.status === "erro") {
      expect(r.motivo).toContain("outro-lugar.com");
      expect(r.motivo).toContain("plataforma.com.br");
    }
  });
});

describe("interpretarA", () => {
  it("bate com o IP esperado", () => {
    expect(interpretarA([VERCEL_APEX_A_RECORD], VERCEL_APEX_A_RECORD).status).toBe("verificado");
  });

  it("nenhum registro A publicado -- erro", () => {
    expect(interpretarA([], VERCEL_APEX_A_RECORD).status).toBe("erro");
  });

  it("IP errado -- erro cita os dois valores", () => {
    const r = interpretarA(["1.2.3.4"], VERCEL_APEX_A_RECORD);
    expect(r.status).toBe("erro");
    if (r.status === "erro") {
      expect(r.motivo).toContain("1.2.3.4");
      expect(r.motivo).toContain(VERCEL_APEX_A_RECORD);
    }
  });
});
