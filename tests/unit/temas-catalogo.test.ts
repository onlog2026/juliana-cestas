import { describe, expect, it } from "vitest";


import { TEMAS } from "@/storefront/temas/catalogo";
import { contraste } from "@/storefront/temas/contraste";
import { FONT_KEYS_PARA_TESTE } from "@/storefront/temas/fonte-chaves";
import { TEMAS as LISTA_SCRIPTS } from "../../scripts/modelos-lista.mjs";

describe("catálogo de modelos", () => {
  it("tem 17 modelos × 3 variações = 51", () => {
    expect(TEMAS).toHaveLength(17);
    for (const t of TEMAS) expect(t.variacoes, t.key).toHaveLength(3);
  });

  it("chaves de modelo e de variação são únicas", () => {
    expect(new Set(TEMAS.map((t) => t.key)).size).toBe(TEMAS.length);
    for (const t of TEMAS) expect(new Set(t.variacoes.map((v) => v.key)).size, t.key).toBe(3);
  });

  it("a lista dos scripts de verificação bate com o catálogo", () => {
    const real = Object.fromEntries(TEMAS.map((t) => [t.key, t.variacoes.map((v) => v.key)]));
    expect(LISTA_SCRIPTS).toEqual(real);
  });

  it("toda variação tem cores legíveis (contraste mínimo 4,5) e fontes válidas", () => {
    const erros: string[] = [];
    for (const t of TEMAS) {
      for (const v of t.variacoes) {
        const p = v.paleta;
        const ctx = `${t.key}/${v.key}`;
        if (contraste(p.fg, p.bg) < 4.5) erros.push(`${ctx}: texto sobre fundo ${contraste(p.fg, p.bg).toFixed(1)}`);
        if (contraste(p.muted, p.bg) < 4.5) erros.push(`${ctx}: texto secundário sobre fundo ${contraste(p.muted, p.bg).toFixed(1)}`);
        if (contraste(p.muted, p.surface) < 4.5) erros.push(`${ctx}: texto secundário sobre superfície ${contraste(p.muted, p.surface).toFixed(1)}`);
        if (contraste(p.onPrimary, p.primary) < 4.5) erros.push(`${ctx}: texto do botão ${contraste(p.onPrimary, p.primary).toFixed(1)}`);
        for (const f of [v.fontes.titulo, v.fontes.texto, v.fontes.detalhe ?? v.fontes.titulo]) {
          if (!FONT_KEYS_PARA_TESTE.includes(f)) erros.push(`${ctx}: fonte inexistente ${f}`);
        }
        if (!v.demo.categorias.length || !v.demo.cestas.length) erros.push(`${ctx}: demo sem categorias/cestas`);
      }
    }
    expect(erros).toEqual([]);
  });
});

describe("regras de código dos modelos", () => {
  it("nenhum <style> usa texto filho (quebra a hidratação do React — usar dangerouslySetInnerHTML)", async () => {
    const { readdirSync, readFileSync, statSync } = await import("node:fs");
    const { join } = await import("node:path");
    const raiz = join(__dirname, "../../src/storefront/temas");
    const ruins: string[] = [];
    const varrer = (dir: string) => {
      for (const nome of readdirSync(dir)) {
        const caminho = join(dir, nome);
        if (statSync(caminho).isDirectory()) varrer(caminho);
        else if (/\.tsx$/.test(nome) && /<style>\s*\{/.test(readFileSync(caminho, "utf8"))) ruins.push(caminho.replace(raiz, ""));
      }
    };
    varrer(raiz);
    expect(ruins).toEqual([]);
  });
});
