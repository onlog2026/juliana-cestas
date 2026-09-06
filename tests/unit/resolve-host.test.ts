import { beforeEach, describe, expect, it, vi } from "vitest";

// getEnv() faz cache do primeiro parse -- cada teste precisa de um módulo novo.
async function load(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  return import("@/lib/tenant/resolve-host");
}

const LEGACY_JSON = JSON.stringify({
  "julianacesta.com.br": { id: "a0000000-0000-4000-8000-000000000001", slug: "juliana-cestas" },
  "juliana-cestas-loja.vercel.app": { id: "a0000000-0000-4000-8000-000000000001", slug: "juliana-cestas" },
});

beforeEach(() => {
  delete process.env.PLATFORM_DOMAIN;
  delete process.env.LEGACY_HOST_TENANT_JSON;
  delete process.env.DEFAULT_TENANT_SLUG;
});

describe("normalizeHost", () => {
  it("tira porta, www e maiúsculas", async () => {
    const { normalizeHost } = await load({});
    expect(normalizeHost("WWW.Loja.com.br:3000")).toBe("loja.com.br");
    expect(normalizeHost(null)).toBe("");
  });
});

describe("classifyHost", () => {
  it("sem plataforma configurada, todo host é loja (nunca plataforma)", async () => {
    const { classifyHost } = await load({});
    expect(classifyHost("julianacesta.com.br", "")).toEqual({ kind: "custom", host: "julianacesta.com.br" });
  });

  it("identifica plataforma, subdomínio de loja e domínio próprio", async () => {
    const { classifyHost } = await load({});
    expect(classifyHost("minhaplataforma.com.br", "minhaplataforma.com.br")).toEqual({ kind: "platform" });
    expect(classifyHost("www.minhaplataforma.com.br", "minhaplataforma.com.br")).toEqual({ kind: "platform" });
    expect(classifyHost("loja-x.minhaplataforma.com.br", "minhaplataforma.com.br")).toEqual({ kind: "subdomain", slug: "loja-x" });
    expect(classifyHost("julianacesta.com.br", "minhaplataforma.com.br")).toEqual({ kind: "custom", host: "julianacesta.com.br" });
  });

  it("subdomínio de dois níveis não vira loja", async () => {
    const { classifyHost } = await load({});
    expect(classifyHost("a.b.minhaplataforma.com.br", "minhaplataforma.com.br")).toEqual({ kind: "platform" });
  });
});

describe("resolveTenantFromHost", () => {
  it("hoje (sem plataforma): qualquer host devolve a loja legada", async () => {
    const { resolveTenantFromHost } = await load({});
    const t = resolveTenantFromHost("julianacesta.com.br");
    expect(t?.id).toBe("a0000000-0000-4000-8000-000000000001");
    expect(t?.slug).toBe("juliana-cestas");
  });

  it("o mapa de hosts legados responde sem banco, inclusive com www", async () => {
    const { resolveTenantFromHost } = await load({
      PLATFORM_DOMAIN: "minhaplataforma.com.br",
      LEGACY_HOST_TENANT_JSON: LEGACY_JSON,
    });
    expect(resolveTenantFromHost("www.julianacesta.com.br")?.slug).toBe("juliana-cestas");
    expect(resolveTenantFromHost("juliana-cestas-loja.vercel.app")?.slug).toBe("juliana-cestas");
  });

  it("host da plataforma não é loja", async () => {
    const { resolveTenantFromHost } = await load({ PLATFORM_DOMAIN: "minhaplataforma.com.br" });
    expect(resolveTenantFromHost("minhaplataforma.com.br")).toBeNull();
  });

  it("com plataforma configurada, host desconhecido não vira a loja legada por engano", async () => {
    const { resolveTenantFromHost } = await load({ PLATFORM_DOMAIN: "minhaplataforma.com.br" });
    expect(resolveTenantFromHost("loja-de-outro.com.br")).toBeNull();
  });

  it("JSON inválido não derruba nada -- só perde o atalho", async () => {
    const { resolveTenantFromHost } = await load({ LEGACY_HOST_TENANT_JSON: "isso nao e json" });
    expect(resolveTenantFromHost("julianacesta.com.br")?.slug).toBe("juliana-cestas");
  });
});
