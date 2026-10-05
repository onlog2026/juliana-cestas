import { beforeEach, describe, expect, it, vi } from "vitest";

// ── mocks (devem vir antes dos imports que os usam) ────────────────────────────
const dominio = { data: null as { host: string } | null };
const loja = { data: null as { slug: string } | null };
const plataforma = { valor: "" };
const settings = { data: null as Record<string, string | number | null> | null, falhaColuna: 0 };

vi.mock("@/lib/env", () => ({ getEnv: () => ({ PLATFORM_DOMAIN: plataforma.valor }) }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (tabela: string) => {
      const q: Record<string, unknown> = {};
      const encadeia = () => q;
      Object.assign(q, {
        select: (colunas: string) => {
          (q as { _colunas: string })._colunas = colunas;
          return q;
        },
        eq: encadeia,
        order: encadeia,
        limit: encadeia,
        maybeSingle: async () => {
          if (tabela === "tenant_domains") return { data: dominio.data, error: null };
          if (tabela === "tenants") return { data: loja.data, error: null };
          if (tabela === "site_settings") {
            const colunas = (q as { _colunas: string })._colunas;
            if (settings.falhaColuna > 0 && colunas.includes("ga4_id")) return { data: null, error: { code: "42703" } };
            if (settings.falhaColuna > 1 && colunas.includes("logo_header_height")) return { data: null, error: { code: "42703" } };
            return { data: settings.data, error: null };
          }
          return { data: null, error: null };
        },
      });
      return q;
    },
  }),
}));

import { getSiteUrl, getSiteUrlOrFallback } from "@/lib/tenant/site-url";
import { getSiteSettings } from "@/modules/settings/site-settings";
import { LEGACY_TENANT_ID } from "@/lib/tenant/legacy";
import { remetenteDaLoja } from "@/modules/notifications/remetente";
import { coresDeEmail } from "@/modules/notifications/cores-email";
import { NEUTRAL_EMAIL_COLORS, emailShell } from "@/modules/notifications/templates/shell";
import { contraste } from "@/storefront/temas/contraste";
import { descricaoSiteReserva, fraseLlms, tituloSiteReserva } from "@/modules/seo/texto-legado";

const OUTRA_LOJA = "b0000000-0000-4000-8000-000000000002";

beforeEach(() => {
  dominio.data = null;
  loja.data = null;
  plataforma.valor = "";
  settings.data = null;
  settings.falhaColuna = 0;
  process.env.NEXT_PUBLIC_SITE_URL = "https://www.julianacestas.com.br";
});

describe("endereço do site por loja", () => {
  it("a loja original continua com a variável do site, exatamente como antes", async () => {
    expect(await getSiteUrl(LEGACY_TENANT_ID)).toBe("https://www.julianacestas.com.br");
    expect(await getSiteUrlOrFallback(LEGACY_TENANT_ID)).toBe("https://www.julianacestas.com.br");
  });

  it("outra loja NUNCA herda o endereço da Juliana: sem domínio nem plataforma, fica vazio", async () => {
    expect(await getSiteUrl(OUTRA_LOJA)).toBe("");
    expect(await getSiteUrlOrFallback(OUTRA_LOJA)).toBe("http://localhost:3000");
  });

  it("outra loja usa o domínio próprio verificado", async () => {
    dominio.data = { host: "cestasdaana.com.br" };
    expect(await getSiteUrl(OUTRA_LOJA)).toBe("https://cestasdaana.com.br");
  });

  it("outra loja sem domínio usa slug.PLATFORM_DOMAIN", async () => {
    plataforma.valor = "cestas.app";
    loja.data = { slug: "doce-manha" };
    expect(await getSiteUrl(OUTRA_LOJA)).toBe("https://doce-manha.cestas.app");
  });
});

describe("medição (GA4/GTM) por loja", () => {
  it("lê os IDs da loja quando as colunas existem", async () => {
    settings.data = { logo_header_url: null, logo_footer_url: null, favicon_url: null, logo_header_height: 80, ga4_id: "G-ABC1234567", gtm_id: "GTM-ABC1234" };
    const s = await getSiteSettings("t-ga4-ok");
    expect(s.ga4Id).toBe("G-ABC1234567");
    expect(s.gtmId).toBe("GTM-ABC1234");
    expect(s.logoHeaderHeight).toBe(80);
  });

  it("antes da migração 0053 (coluna inexistente) a logo e o favicon continuam aparecendo", async () => {
    settings.falhaColuna = 1;
    settings.data = { logo_header_url: "https://x/logo.webp", logo_footer_url: null, favicon_url: "https://x/f.png", logo_header_height: 90 };
    const s = await getSiteSettings("t-sem-0053");
    expect(s.logoHeaderUrl).toBe("https://x/logo.webp");
    expect(s.faviconUrl).toBe("https://x/f.png");
    expect(s.ga4Id).toBeNull();
  });

  it("antes das migrações 0039 e 0053 ainda lê o básico", async () => {
    settings.falhaColuna = 2;
    settings.data = { logo_header_url: "https://x/logo.webp", logo_footer_url: null, favicon_url: null };
    const s = await getSiteSettings("t-so-basico");
    expect(s.logoHeaderUrl).toBe("https://x/logo.webp");
    expect(s.logoHeaderHeight).toBeNull();
  });
});

describe("remetente do e-mail por loja", () => {
  const from = "Juliana Present <pedidos@julianacesta.com.br>";
  it("a loja original mantém o EMAIL_FROM exatamente como está", () => {
    expect(remetenteDaLoja(from, "Juliana Present", true)).toBe(from);
  });
  it("outra loja usa o nome dela com o mesmo endereço de envio da plataforma", () => {
    expect(remetenteDaLoja(from, "Doce Manhã", false)).toBe('"Doce Manhã" <pedidos@julianacesta.com.br>');
  });
  it("aceita EMAIL_FROM só com o endereço", () => {
    expect(remetenteDaLoja("pedidos@plataforma.com", "Loja X", false)).toBe('"Loja X" <pedidos@plataforma.com>');
  });
  it("nome com caracteres perigosos é limpo; sem nome volta ao padrão", () => {
    expect(remetenteDaLoja(from, 'Loja "A" <b>\nX', false)).toBe('"Loja A b X" <pedidos@julianacesta.com.br>');
    expect(remetenteDaLoja(from, "   ", false)).toBe(from);
  });
});

describe("cores do e-mail por loja", () => {
  const casca = (colors?: Parameters<typeof emailShell>[1]["colors"]) =>
    emailShell('<p style="color:#556b2f">oi</p>', { storeName: "Loja X", logoUrl: null, siteUrl: "https://x.com", colors });

  it("sem cores, o e-mail sai com as cores de sempre (loja original)", () => {
    const html = casca();
    expect(html).toContain("#556b2f");
    expect(html).toContain("#d9a441");
    expect(html).toContain("#f6f1e8");
  });

  it("com cores da loja, nenhuma das cores da Juliana sobra no e-mail", () => {
    const html = casca(NEUTRAL_EMAIL_COLORS);
    for (const cor of ["#556b2f", "#d9a441", "#17251f", "#f6f1e8", "#e6e0d2"]) expect(html.toLowerCase()).not.toContain(cor);
    expect(html).toContain("#1f2937");
  });

  it("paleta clara e escura geram botão legível e faixa escura", () => {
    const clara = coresDeEmail({ bg: "#f6f1e8", fg: "#1f2a24", primary: "#c9a24a", accent: "#c9a24a", line: "#e6dccb" });
    const escura = coresDeEmail({ bg: "#0f0b0b", fg: "#f4ece4", primary: "#c8a45c", accent: "#9a2a38", line: "#3a2e28" });
    for (const c of [clara, escura]) {
      expect(contraste(c.primary, "#ffffff")).toBeGreaterThanOrEqual(4.5);
      expect(contraste(c.band, "#ffffff")).toBeGreaterThanOrEqual(7);
    }
    expect(escura.page).toBe("#f4f4f5");
  });
});

describe("textos que eram fixos da Juliana", () => {
  it("a loja original mantém as frases de sempre", () => {
    expect(fraseLlms(LEGACY_TENANT_ID, { city: "Brasília", state: "DF" })).toContain("em Brasília, DF, com entrega no mesmo dia");
    expect(descricaoSiteReserva(LEGACY_TENANT_ID, {}, "Juliana")).toContain("entrega em Brasília");
    expect(tituloSiteReserva(LEGACY_TENANT_ID)).toBe("Cestas de café da manhã e presentes");
  });

  it("outra loja não herda 'Brasília', 'café da manhã' nem 'mesmo dia'", () => {
    const perfil = { city: "Recife", state: "PE" };
    const todos = [fraseLlms(OUTRA_LOJA, perfil), descricaoSiteReserva(OUTRA_LOJA, perfil, "Cestas da Ana"), tituloSiteReserva(OUTRA_LOJA)].join(" | ");
    expect(todos).not.toMatch(/Brasília|café da manhã|mesmo dia/i);
    expect(todos).toContain("Recife, PE");
  });

  it("outra loja sem cidade cadastrada não inventa cidade", () => {
    expect(fraseLlms(OUTRA_LOJA, {})).not.toMatch(/à mão em /);
  });
});
