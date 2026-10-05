import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/tenant/storefront-status", () => ({ vitrineSuspensa: async () => false }));
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { getUser: async () => ({ data: { user: { id: "u" } } }) } }),
}));

import { proxy } from "@/proxy";
import { comecaCom, PREFIXOS_DA_LOJA, PREFIXOS_DA_PLATAFORMA, tipoDeHost } from "@/lib/tenant/host-kind";

const PLATAFORMA = "cestasstore.com.br,www.cestasstore.com.br";

function pedir(host: string, path: string) {
  return proxy(new NextRequest(`https://${host}${path}`, { headers: { host } }));
}
const reescritaPara = (r: Response) => r.headers.get("x-middleware-rewrite") ?? "";

beforeEach(() => {
  process.env.PLATFORM_HOSTS = PLATAFORMA;
});

describe("tipo de endereço", () => {
  it("classifica plataforma, preview e loja", () => {
    expect(tipoDeHost("www.cestasstore.com.br", PLATAFORMA)).toBe("plataforma");
    expect(tipoDeHost("CESTASSTORE.com.br:443", PLATAFORMA)).toBe("plataforma");
    expect(tipoDeHost("juliana-cestas-loja.vercel.app", PLATAFORMA)).toBe("preview");
    expect(tipoDeHost("localhost:3066", PLATAFORMA)).toBe("preview");
    expect(tipoDeHost("www.julianacestas.com.br", PLATAFORMA)).toBe("loja");
    expect(tipoDeHost("julianacesta.com.br", PLATAFORMA)).toBe("loja");
    expect(tipoDeHost("qualquer.com.br", "")).toBe("loja");
    expect(tipoDeHost(null, PLATAFORMA)).toBe("loja");
  });

  it("os caminhos da plataforma e os da loja nunca se sobrepõem", () => {
    for (const p of PREFIXOS_DA_PLATAFORMA) expect(comecaCom(p, PREFIXOS_DA_LOJA), p).toBe(false);
    for (const p of PREFIXOS_DA_LOJA) expect(comecaCom(p, PREFIXOS_DA_PLATAFORMA), p).toBe(false);
  });
});

describe("endereço de LOJA (julianacestas.com.br) não serve a plataforma", () => {
  for (const caminho of ["/plataforma", "/planos", "/cadastro", "/entrar", "/modelos", "/modelos/stories", "/demo/noir/vinhos", "/recursos", "/recursos/x", "/solucoes/y", "/super", "/super/lojas", "/inicio"]) {
    it(`${caminho} responde 404`, async () => {
      const r = await pedir("www.julianacestas.com.br", caminho);
      expect(reescritaPara(r)).toContain("/nao-encontrado-404");
    });
  }

  for (const caminho of ["/", "/produto/x", "/categoria/y", "/carrinho", "/checkout/z", "/pedido/1", "/avaliacoes", "/sobre", "/admin/login"]) {
    it(`${caminho} continua da loja (sem reescrita)`, async () => {
      const r = await pedir("www.julianacestas.com.br", caminho);
      expect(reescritaPara(r)).not.toContain("/nao-encontrado-404");
      expect(reescritaPara(r)).not.toContain("/inicio");
      expect(r.status).toBeLessThan(400);
    });
  }
});

describe("endereço da PLATAFORMA não serve a loja", () => {
  it("a raiz abre a home da plataforma", async () => {
    const r = await pedir("www.cestasstore.com.br", "/");
    expect(reescritaPara(r)).toContain("/inicio");
  });

  it("/plataforma e /inicio levam para a raiz", async () => {
    for (const p of ["/plataforma", "/inicio"]) {
      const r = await pedir("cestasstore.com.br", p);
      expect(r.status).toBe(308);
      expect(new URL(r.headers.get("location") ?? "").pathname).toBe("/");
    }
  });

  for (const caminho of ["/produto/x", "/categoria/y", "/carrinho", "/checkout/z", "/pedido/1", "/conta/entrar", "/avaliacoes", "/sobre", "/faq"]) {
    it(`${caminho} responde 404`, async () => {
      const r = await pedir("www.cestasstore.com.br", caminho);
      expect(reescritaPara(r)).toContain("/nao-encontrado-404");
    });
  }

  for (const caminho of ["/recursos", "/recursos/loja-online", "/solucoes/floricultura", "/planos", "/modelos", "/cadastro", "/entrar", "/super", "/admin/login", "/auth/callback"]) {
    it(`${caminho} abre`, async () => {
      const r = await pedir("www.cestasstore.com.br", caminho);
      expect(reescritaPara(r)).not.toContain("/nao-encontrado-404");
      expect(r.status).toBeLessThan(400);
    });
  }
});

describe("previews (vercel.app e localhost) liberam tudo", () => {
  for (const host of ["juliana-cestas-loja.vercel.app", "localhost:3066"]) {
    for (const caminho of ["/", "/plataforma", "/modelos", "/demo/noir/vinhos", "/produto/x", "/super"]) {
      it(`${host}${caminho}`, async () => {
        const r = await pedir(host, caminho);
        expect(reescritaPara(r)).not.toContain("/nao-encontrado-404");
      });
    }
  }
});

describe("sem PLATFORM_HOSTS (hoje) nenhum endereço é da plataforma", () => {
  it("a raiz de qualquer endereço segue sendo a loja", async () => {
    delete process.env.PLATFORM_HOSTS;
    const r = await pedir("www.cestasstore.com.br", "/");
    expect(reescritaPara(r)).not.toContain("/inicio");
  });
});
