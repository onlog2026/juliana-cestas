import { describe, expect, it, vi } from "vitest";

const maybeSingle = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}));

import { getTemaInstalado, planoPermite } from "@/storefront/temas/instalado";
import { TEMAS } from "@/storefront/temas/catalogo";

describe("planoPermite", () => {
  it("modelo do plano Start vale para qualquer plano", () => {
    for (const p of ["start", "essencial", "pro", "premium", null]) expect(planoPermite(p, "start")).toBe(true);
  });
  it("modelo Pro é recusado só no plano Start/Essencial", () => {
    expect(planoPermite("start", "pro")).toBe(false);
    expect(planoPermite("essencial", "pro")).toBe(false);
    expect(planoPermite("pro", "pro")).toBe(true);
    expect(planoPermite("premium", "pro")).toBe(true);
    expect(planoPermite(null, "pro")).toBe(true);
  });
});

describe("getTemaInstalado", () => {
  it("loja sem linha em store_theme (a Juliana) = nenhum modelo", async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    expect(await getTemaInstalado("t-sem-linha")).toBeNull();
  });
  it("linha do sistema antigo de blocos (sem motor=temas) é ignorada", async () => {
    maybeSingle.mockResolvedValueOnce({ data: { template_key: "classica", layout: {} }, error: null });
    expect(await getTemaInstalado("t-antigo")).toBeNull();
  });
  it("erro do banco = nenhum modelo (nunca quebra a loja)", async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: { message: "x" } });
    expect(await getTemaInstalado("t-erro")).toBeNull();
    maybeSingle.mockRejectedValueOnce(new Error("rede"));
    expect(await getTemaInstalado("t-throw")).toBeNull();
  });
  it("modelo instalado devolve o tema e a variação gravados", async () => {
    const tema = TEMAS.find((t) => t.key === "noir")!;
    const v = tema.variacoes[1];
    maybeSingle.mockResolvedValueOnce({ data: { template_key: "noir", layout: { motor: "temas", variante: v.key } }, error: null });
    const r = await getTemaInstalado("t-noir");
    expect(r?.tema.key).toBe("noir");
    expect(r?.variacao.key).toBe(v.key);
  });
  it("modelo desconhecido gravado no banco = nenhum modelo", async () => {
    maybeSingle.mockResolvedValueOnce({ data: { template_key: "inexistente", layout: { motor: "temas" } }, error: null });
    expect(await getTemaInstalado("t-desconhecido")).toBeNull();
  });
});
