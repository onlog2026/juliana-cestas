import { beforeEach, describe, expect, it, vi } from "vitest";

// Host da requisição simulado: cada teste troca esta variável.
let hostAtual = "";
vi.mock("next/headers", () => ({
  headers: async () => new Headers(hostAtual ? { host: hostAtual } : {}),
}));

// --- lado da PLATAFORMA (sem banco) ---
vi.mock("@/modules/platform/landing-service", () => ({
  getAllPlatformContent: async () => ({ branding: { wordmark: "Cestas Store", logoUrl: "", faviconUrl: "" } }),
  listPublicPlans: async () => [],
}));
vi.mock("@/modules/platform/plans-public", () => ({
  getPublicPlansPage: async () => ({
    plans: [
      {
        slug: "start",
        name: "Start",
        badge: null,
        description: "Para começar.",
        monthlyCents: 4990,
        isAnchor: false,
        included: [{ slug: "produtos", name: "Produtos", limitDisplay: "até 50" }],
        addons: [],
      },
    ],
    trialDays: 7,
  }),
}));
vi.mock("@/modules/platform/recursos", () => ({
  RECURSOS: [
    { slug: "pagamentos", titulo: "Pagamentos", resumo: "PIX, cartão e boleto.", status: "disponivel" },
    { slug: "bling", titulo: "Bling", resumo: "ERP.", status: "em-breve" },
  ],
}));
vi.mock("@/modules/platform/solucoes", () => ({
  SOLUCOES: [{ slug: "floricultura", titulo: "Floricultura", resumo: "Flores." }],
}));

// --- lado da LOJA (sem banco) ---
vi.mock("@/lib/tenant/context", () => ({ getTenantId: async () => "tenant-1" }));
vi.mock("@/lib/tenant/site-url", () => ({ getSiteUrlOrFallback: async () => "https://loja.exemplo.com.br" }));
vi.mock("@/modules/catalog/service", () => ({ getAllProducts: async () => [{ slug: "cesta-afeto" }] }));
vi.mock("@/modules/catalog/categories", () => ({ getActiveCategories: async () => [] }));
vi.mock("@/modules/seo/llms", () => ({
  buildLlmsText: async (full: boolean) => `LLMS-LOJA-${full}`,
  LLMS_HEADERS: { "Content-Type": "text/plain; charset=utf-8" },
}));

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { GET as llmsGet } from "@/app/llms.txt/route";
import { GET as llmsFullGet } from "@/app/llms-full.txt/route";
import { MODELOS } from "@/modules/platform/modelos-catalog";
import {
  inicialDaMarca,
  manifestoDaPlataforma,
  svgDoIcone,
  urlBaseDaPlataforma,
  urlBaseDaPlataformaPorEnv,
} from "@/modules/platform/seo-plataforma";

const HOST_PLATAFORMA = "www.cestasstore.com.br";

beforeEach(() => {
  hostAtual = "";
  process.env.PLATFORM_HOSTS = "cestasstore.com.br,www.cestasstore.com.br";
  delete process.env.PLATFORM_PUBLIC_URL;
});

describe("robots.txt", () => {
  it("plataforma: libera tudo menos painéis, API e login, e aponta para o sitemap dela", async () => {
    hostAtual = HOST_PLATAFORMA;
    const r = await robots();
    expect(r.sitemap).toBe(`https://${HOST_PLATAFORMA}/sitemap.xml`);
    expect(r.rules).toEqual([{ userAgent: "*", allow: "/", disallow: ["/super", "/admin", "/api", "/entrar"] }]);
  });

  it.each([["julianacestas.com.br"], ["abc.vercel.app"], ["localhost:3000"]])("loja/preview (%s): igual ao de sempre", async (h) => {
    hostAtual = h;
    expect(await robots()).toEqual({
      rules: [
        {
          userAgent: "*",
          allow: "/",
          disallow: ["/admin", "/api", "/conta", "/carrinho", "/checkout", "/pedido", "/avaliar", "/redefinir-senha"],
        },
      ],
      sitemap: "https://loja.exemplo.com.br/sitemap.xml",
    });
  });
});

describe("sitemap.xml", () => {
  it("plataforma: lista só páginas da plataforma, no endereço dela", async () => {
    hostAtual = HOST_PLATAFORMA;
    const urls = (await sitemap()).map((e) => e.url);
    const base = `https://${HOST_PLATAFORMA}`;
    expect(urls).toContain(base);
    for (const p of ["/recursos", "/recursos/pagamentos", "/recursos/bling", "/solucoes", "/solucoes/floricultura", "/planos", "/modelos", "/cadastro"]) {
      expect(urls).toContain(`${base}${p}`);
    }
    for (const m of MODELOS) expect(urls).toContain(`${base}/modelos/${m.key}`);
    expect(urls.every((u) => u.startsWith(base))).toBe(true);
    expect(urls.some((u) => u.includes("/produto/") || u.includes("/entrar") || u.includes("/super"))).toBe(false);
  });

  it.each([["julianacestas.com.br"], ["abc.vercel.app"]])("loja/preview (%s): igual ao de sempre", async (h) => {
    hostAtual = h;
    const urls = (await sitemap()).map((e) => e.url);
    const base = "https://loja.exemplo.com.br";
    expect(urls).toEqual([
      base,
      `${base}/sobre`,
      `${base}/atendimento`,
      `${base}/faq`,
      `${base}/trocas-e-devolucoes`,
      `${base}/avaliacoes`,
      `${base}/privacidade`,
      `${base}/termos`,
      `${base}/produto/cesta-afeto`,
    ]);
  });
});

describe("llms.txt e llms-full.txt", () => {
  it("plataforma: descreve recursos, soluções e (no completo) planos reais e modelos", async () => {
    hostAtual = HOST_PLATAFORMA;
    const curto = await (await llmsGet()).text();
    expect(curto).toContain("# Cestas Store");
    expect(curto).toContain(`https://${HOST_PLATAFORMA}/recursos/pagamentos`);
    expect(curto).toContain("(em breve, ainda não disponível)");
    expect(curto).not.toContain("Preço:");

    const cheio = await (await llmsFullGet()).text();
    expect(cheio).toContain("R$");
    expect(cheio).toContain("Start");
    expect(cheio).toContain("Teste grátis: 7 dias");
    expect(cheio).toContain("Em breve (ainda não disponível)");
    expect(cheio).toContain(`/modelos/${MODELOS[0].key}`);
    expect(cheio).not.toContain("LLMS-LOJA");
  });

  it.each([["julianacestas.com.br"], ["abc.vercel.app"]])("loja/preview (%s): igual ao de sempre", async (h) => {
    hostAtual = h;
    expect(await (await llmsGet()).text()).toBe("LLMS-LOJA-false");
    expect(await (await llmsFullGet()).text()).toBe("LLMS-LOJA-true");
  });
});

describe("URL base, manifesto e ícone", () => {
  it("usa o host da plataforma como veio; senão env; senão localhost", () => {
    expect(urlBaseDaPlataforma("Cestasstore.com.br")).toBe("https://cestasstore.com.br");
    expect(urlBaseDaPlataforma("www.cestasstore.com.br")).toBe("https://www.cestasstore.com.br");
    process.env.PLATFORM_PUBLIC_URL = "https://oficial.com.br/";
    expect(urlBaseDaPlataforma("julianacestas.com.br")).toBe("https://oficial.com.br");
    expect(urlBaseDaPlataformaPorEnv()).toBe("https://oficial.com.br");
    delete process.env.PLATFORM_PUBLIC_URL;
    delete process.env.PLATFORM_HOSTS;
    expect(urlBaseDaPlataforma("julianacestas.com.br")).toBe("http://localhost:3000");
  });

  it("manifesto da plataforma: marca, standalone, ícones próprios", async () => {
    const m = await manifestoDaPlataforma();
    expect(m.name).toBe("Cestas Store");
    expect(m.start_url).toBe("/");
    expect(m.display).toBe("standalone");
    expect(m.theme_color).toBe("#14110f");
    expect(m.icons?.map((i) => i.src)).toEqual([
      "/plataforma-arquivos/icone/192",
      "/plataforma-arquivos/icone/512",
      "/plataforma-arquivos/icone/maskable-512",
    ]);
  });

  it("ícone: SVG com a inicial, escapando caracteres", () => {
    expect(inicialDaMarca("  cestas")).toBe("C");
    expect(inicialDaMarca("")).toBe("P");
    const svg = svgDoIcone("<", 192, true);
    expect(svg).toContain("&lt;");
    expect(svg).not.toContain("><</text>");
    expect(svg).toContain('width="192"');
  });
});
