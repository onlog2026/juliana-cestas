import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BLOCK_SPECS, getBlockSpec, normalizeSection, type Section } from "@/storefront/blocks/schemas";
import { TEMPLATES, getTemplate } from "@/storefront/templates/index";
import {
  TABELAS_QUE_A_TROCA_ESCREVE,
  planMaterialization,
  planSwitch,
  relinkSections,
  type PlannedPage,
} from "@/storefront/templates/plan";
import { THEME_TOKEN_KEYS, themeToCss } from "@/storefront/theme";

/**
 * OS TESTES DA FUNDAÇÃO DE MODELOS.
 *
 * Três promessas são testadas aqui, e são exatamente as três que, se
 * falharem, quebram alguma coisa que ninguém vai perceber a tempo:
 *
 *   1. o modelo "clássica" é uma CÓPIA FIEL da home da Juliana de hoje --
 *      provado contra os arquivos de verdade (`page.tsx` e `globals.css`),
 *      não contra o que a gente lembra deles;
 *   2. trocar de modelo NÃO perde o que a lojista já tinha ajustado;
 *   3. trocar de modelo não encosta em produto, pedido ou banner -- provado
 *      lendo o serviço e conferindo em que tabelas ele escreve.
 */

const RAIZ = path.resolve(__dirname, "..", "..");

function lerArquivo(...partes: string[]): string {
  return readFileSync(path.join(RAIZ, ...partes), "utf8");
}

/* ───────────────────────────── themeToCss ──────────────────────────────── */

describe("themeToCss", () => {
  it("escreve as variáveis com os nomes do globals.css", () => {
    const css = themeToCss({ primary: "#556b2f", background: "#f6f1e8" });
    expect(css).toBe(":root{--background:#f6f1e8;--primary:#556b2f}");
  });

  it("sempre na mesma ordem, não importa a ordem em que os campos chegaram", () => {
    const a = themeToCss({ primary: "#111111", background: "#ffffff" });
    const b = themeToCss({ background: "#ffffff", primary: "#111111" });
    expect(a).toBe(b);
  });

  it("ignora variável que não existe no globals.css", () => {
    const css = themeToCss({ primary: "#556b2f", "cor-inventada": "#000000" });
    expect(css).toBe(":root{--primary:#556b2f}");
  });

  it("recusa valor que fecharia o bloco de CSS e injetaria estilo na loja", () => {
    const css = themeToCss({ primary: "#000} body{display:none" });
    expect(css).toBe("");
  });

  it("recusa valor com tag, aspas ou url()", () => {
    expect(themeToCss({ primary: "<script>" })).toBe("");
    expect(themeToCss({ primary: 'red"' })).toBe("");
    expect(themeToCss({ primary: "url(http://exemplo.com/x.png)" })).toBe("");
  });

  it("aceita cor com rgba e sombra com vírgulas", () => {
    const css = themeToCss({
      border: "rgba(31, 42, 36, 0.1)",
      "jc-shadow": "0 12px 32px rgba(31, 42, 36, 0.08)",
    });
    expect(css).toBe(":root{--border:rgba(31, 42, 36, 0.1);--jc-shadow:0 12px 32px rgba(31, 42, 36, 0.08)}");
  });

  it("escreve as fontes como variável, nunca como link para o Google", () => {
    const css = themeToCss({ primary: "#556b2f" }, { sans: "poppins", display: "playfair" });
    expect(css).toContain("--font-sans:var(--font-poppins)");
    expect(css).toContain("--font-display:var(--font-playfair)");
    expect(css).not.toContain("http");
    expect(css).not.toContain("@import");
  });

  it("cai numa fonte conhecida quando a gravada não existe mais", () => {
    const css = themeToCss({}, { sans: "comic-sans", display: "wingdings" });
    expect(css).toContain("--font-sans:var(--font-figtree)");
    expect(css).toContain("--font-display:var(--font-young-serif)");
  });

  it("devolve vazio quando não há nada válido -- não injeta tag à toa", () => {
    expect(themeToCss({})).toBe("");
    expect(themeToCss(null)).toBe("");
    expect(themeToCss("não é objeto")).toBe("");
  });

  it("aceita outro seletor (para escopar a prévia do painel)", () => {
    expect(themeToCss({ primary: "#000000" }, undefined, { selector: ".previa" })).toBe(
      ".previa{--primary:#000000}"
    );
  });
});

/* ─────────────────── clássica = a home de hoje, sem desvio ─────────────── */

describe("modelo clássica — cópia fiel da loja que está no ar", () => {
  /** Componente da home de hoje -> bloco que passa a representá-lo. */
  const COMPONENTE_PARA_BLOCO: Record<string, string> = {
    BannerCarousel: "hero",
    CategoryTiles: "category-grid",
    FeaturedProducts: "product-grid",
    CartaozinhoSection: "signature",
    Collections: "collection-spotlight",
    Benefits: "benefits",
    Faq: "faq",
    WhatsappCta: "cta-whatsapp",
  };

  it("tem as mesmas seções, na mesma ordem do src/app/(store)/page.tsx", () => {
    const pageTsx = lerArquivo("src", "app", "(store)", "page.tsx");
    const jsx = pageTsx.slice(pageTsx.indexOf("return ("));
    expect(jsx.length).toBeGreaterThan(0);

    const ordemNoArquivo: string[] = [];
    for (const linha of jsx.split("\n")) {
      for (const [componente, bloco] of Object.entries(COMPONENTE_PARA_BLOCO)) {
        if (linha.includes(`<${componente}`)) ordemNoArquivo.push(bloco);
      }
    }

    const classica = getTemplate("classica");
    expect(classica).not.toBeNull();
    const ordemNoModelo = classica!.pages["/"].sections.map((s) => s.type);

    expect(ordemNoModelo).toEqual(ordemNoArquivo);
  });

  it("mantém os dois botões do topo, com o mesmo destino de hoje", () => {
    const classica = getTemplate("classica")!;
    const hero = classica.pages["/"].sections.find((s) => s.type === "hero");
    expect(hero?.variant).toBe("carousel");
    expect(hero?.props.quickLinks).toEqual([
      { label: "Ver cestas", href: "/categoria/cafe-da-manha", style: "solid" },
      { label: "Mais pedidas", href: "#mais-pedidas", style: "outline" },
    ]);
  });

  it("usa exatamente as cores do :root do globals.css — materializar não repinta nada", () => {
    const css = lerArquivo("src", "app", "globals.css");
    const inicio = css.indexOf(":root {");
    const fim = css.indexOf("}", inicio);
    const bloco = css.slice(inicio, fim);

    const doArquivo = new Map<string, string>();
    for (const linha of bloco.split("\n")) {
      const m = /^\s*--([a-z0-9-]+):\s*(.+);\s*$/i.exec(linha);
      if (m) doArquivo.set(m[1], m[2].trim());
    }
    expect(doArquivo.size).toBeGreaterThan(20);

    const classica = getTemplate("classica")!;
    for (const chave of THEME_TOKEN_KEYS) {
      const noArquivo = doArquivo.get(chave);
      if (noArquivo === undefined) continue;
      expect(`${chave}=${classica.theme[chave]}`).toBe(`${chave}=${noArquivo}`);
    }
  });

  it("descreve TODAS as variáveis de tema que o modelo pode repintar", () => {
    const classica = getTemplate("classica")!;
    const faltando = THEME_TOKEN_KEYS.filter((k) => classica.theme[k] === undefined);
    expect(faltando).toEqual([]);
  });
});

/* ──────────────── os modelos são estruturalmente diferentes ────────────── */

describe("os três modelos", () => {
  it("todo bloco usado por um modelo existe no catálogo, com variação válida", () => {
    for (const template of TEMPLATES) {
      for (const [caminho, page] of Object.entries(template.pages)) {
        for (const section of page.sections) {
          const spec = getBlockSpec(section.type);
          expect(spec, `${template.key}${caminho}: bloco "${section.type}" não existe`).not.toBeNull();
          expect(
            spec!.variants.some((v) => v.key === section.variant),
            `${template.key}${caminho}: variação "${section.variant}" não existe em "${section.type}"`
          ).toBe(true);
          // Props gravadas no modelo têm que passar no schema do próprio bloco.
          expect(
            spec!.schema.safeParse(section.props).success,
            `${template.key}${caminho}: props do bloco "${section.type}" fora do formato`
          ).toBe(true);
        }
      }
    }
  });

  it("nenhum par de modelos vira o outro só trocando a cor", () => {
    for (let i = 0; i < TEMPLATES.length; i++) {
      for (let j = i + 1; j < TEMPLATES.length; j++) {
        const a = TEMPLATES[i];
        const b = TEMPLATES[j];
        const tiposA = a.pages["/"].sections.map((s) => s.type);
        const tiposB = b.pages["/"].sections.map((s) => s.type);

        // A ordem é diferente...
        expect(tiposA.join(">"), `${a.key} x ${b.key}`).not.toBe(tiposB.join(">"));

        // ...e não é só a ordem: cada um tem blocos que o outro não tem.
        const soEmA = tiposA.filter((t) => !tiposB.includes(t));
        const soEmB = tiposB.filter((t) => !tiposA.includes(t));
        expect(soEmA.length + soEmB.length, `${a.key} x ${b.key}`).toBeGreaterThanOrEqual(4);

        // Cabeçalho, rodapé e página de produto também mudam.
        expect(a.layout.header.variant, `${a.key} x ${b.key}`).not.toBe(b.layout.header.variant);
        expect(a.layout.footer.variant, `${a.key} x ${b.key}`).not.toBe(b.layout.footer.variant);
        expect(a.layout.productPage.variant, `${a.key} x ${b.key}`).not.toBe(
          b.layout.productPage.variant
        );
      }
    }
  });

  it("a biblioteca de blocos é grande o suficiente para os três modelos", () => {
    const usados = new Set<string>();
    for (const template of TEMPLATES) {
      for (const page of Object.values(template.pages)) {
        for (const section of page.sections) usados.add(section.type);
      }
    }
    expect(BLOCK_SPECS.length).toBeGreaterThanOrEqual(14);
    expect(usados.size).toBeGreaterThanOrEqual(12);
  });
});

/* ───────────────────────── seção fora do formato ───────────────────────── */

describe("normalizeSection — página não quebra por conteúdo salvo errado", () => {
  it("descarta bloco desconhecido em vez de derrubar a página", () => {
    expect(normalizeSection({ id: "x", type: "bloco-que-nao-existe", variant: "a", props: {} })).toBeNull();
  });

  it("cai na primeira variação quando a gravada não existe mais", () => {
    const s = normalizeSection({ id: "x", type: "faq", variant: "variacao-removida", props: {} });
    expect(s?.variant).toBe("accordion");
  });

  it("cai nos valores padrão quando as props estão fora do formato", () => {
    const s = normalizeSection({
      id: "x",
      type: "rich-text",
      variant: "prose",
      props: { align: "diagonal", title: 42 },
    });
    expect(s?.props.align).toBe("left");
    expect(s?.props.title).toBe("Sobre a nossa loja");
  });
});

/* ──────────────── a promessa: trocar de modelo não perde nada ──────────── */

describe("troca de modelo", () => {
  function paginasDe(key: "classica" | "editorial" | "catalogo"): PlannedPage[] {
    return planMaterialization(key).pages;
  }

  it("materializar não publica nada", () => {
    for (const key of ["classica", "editorial", "catalogo"] as const) {
      for (const page of paginasDe(key)) {
        expect(page.published, `${key}${page.path}`).toBe(false);
      }
    }
  });

  it("materializar entrega uma CÓPIA — editar a loja não muda o modelo", () => {
    const plano = planMaterialization("editorial");
    const secao = plano.pages[0].sections.find((s) => s.type === "rich-text")!;
    secao.props.title = "Texto que a lojista escreveu";

    const modelo = getTemplate("editorial")!;
    const original = modelo.pages["/"].sections.find((s) => s.type === "rich-text")!;
    expect(original.props.title).not.toBe("Texto que a lojista escreveu");
  });

  it("leva o que a lojista escreveu para o modelo novo, mesmo mudando de variação", () => {
    const antigas: Section[] = [
      {
        id: "mais-pedidas",
        type: "product-grid",
        variant: "featured",
        props: { title: "As favoritas da Juliana", subtitle: "Escolhidas a dedo", limit: 0, showFilters: false },
      },
    ];
    const novas: Section[] = [
      {
        id: "catalogo",
        type: "product-grid",
        variant: "dense",
        props: { title: "Todos os produtos", subtitle: "", limit: 0, showFilters: true },
      },
    ];

    const religadas = relinkSections(novas, antigas);
    expect(religadas[0].props.title).toBe("As favoritas da Juliana");
    expect(religadas[0].props.subtitle).toBe("Escolhidas a dedo");
    // O que é do modelo novo continua sendo do modelo novo.
    expect(religadas[0].variant).toBe("dense");
    expect(religadas[0].props.showFilters).toBe(true);
  });

  it("não leva valor que não serve no bloco novo — e o resto continua indo", () => {
    const antigas: Section[] = [
      {
        id: "a",
        type: "rich-text",
        variant: "prose",
        props: { eyebrow: "Nossa história", title: "Como tudo começou", body: "Texto longo.", align: "diagonal" },
      },
    ];
    const novas: Section[] = [
      { id: "b", type: "rich-text", variant: "manifesto", props: { eyebrow: "", title: "", body: "", align: "center" } },
    ];

    const religadas = relinkSections(novas, antigas);
    expect(religadas[0].props.title).toBe("Como tudo começou");
    expect(religadas[0].props.eyebrow).toBe("Nossa história");
    expect(religadas[0].props.align).toBe("center"); // "diagonal" não existe: fica o do modelo novo
  });

  it("não inventa conteúdo em bloco que o modelo antigo não tinha", () => {
    const religadas = relinkSections(
      [{ id: "n", type: "testimonials", variant: "cards", props: { title: "Quem já pediu", items: [] } }],
      []
    );
    expect(religadas[0].props.title).toBe("Quem já pediu");
    expect(religadas[0].props.items).toEqual([]);
  });

  it("clássica -> catálogo: o texto ajustado sobrevive à troca", () => {
    const atuais = paginasDe("classica");
    const grade = atuais[0].sections.find((s) => s.type === "product-grid")!;
    grade.props.title = "Cestas da Juliana";
    atuais[0].published = true;

    const plano = planSwitch("catalogo", atuais);
    const home = plano.pages.find((p) => p.path === "/")!;
    const gradeNova = home.sections.find((s) => s.type === "product-grid")!;

    expect(gradeNova.props.title).toBe("Cestas da Juliana");
    expect(gradeNova.variant).toBe("dense"); // a montagem é a do modelo novo
    expect(home.published).toBe(true); // publicar/despublicar não muda na troca
    expect(plano.theme.templateKey).toBe("catalogo");
  });

  it("clássica -> editorial: os links do topo sobrevivem à troca", () => {
    const atuais = paginasDe("classica");
    const plano = planSwitch("editorial", atuais);
    const hero = plano.pages[0].sections.find((s) => s.type === "hero")!;

    expect(hero.props.quickLinks).toEqual([
      { label: "Ver cestas", href: "/categoria/cafe-da-manha", style: "solid" },
      { label: "Mais pedidas", href: "#mais-pedidas", style: "outline" },
    ]);
    expect(hero.variant).toBe("split");
  });

  it("ida e volta (clássica -> editorial -> clássica) devolve a composição original", () => {
    const original = paginasDe("classica");
    const ida = planSwitch("editorial", original);
    const volta = planSwitch("classica", ida.pages);

    expect(volta.pages[0].sections.map((s) => `${s.type}/${s.variant}`)).toEqual(
      original[0].sections.map((s) => `${s.type}/${s.variant}`)
    );
    expect(volta.theme.templateKey).toBe("classica");
  });

  it("troca para modelo que não existe é recusada antes de qualquer gravação", () => {
    expect(() => planMaterialization("inexistente" as never)).toThrow();
  });
});

/* ──────── a outra promessa: a troca não encosta em produto nem pedido ──── */

describe("o que a troca de modelo pode tocar", () => {
  it("o serviço só escreve nas tabelas da composição", () => {
    const service = lerArquivo("src", "modules", "storefront", "service.ts");
    const tabelas = [...service.matchAll(/\.from\("([^"]+)"\)/g)].map((m) => m[1]);

    expect(tabelas.length).toBeGreaterThan(0);
    const permitidas = new Set<string>(TABELAS_QUE_A_TROCA_ESCREVE);
    const proibidas = tabelas.filter((t) => !permitidas.has(t));
    expect(proibidas, `tabela fora da composição em service.ts: ${proibidas.join(", ")}`).toEqual([]);
  });

  it("o serviço não apaga nada", () => {
    const service = lerArquivo("src", "modules", "storefront", "service.ts");
    expect(service).not.toContain(".delete(");
  });

  it("as ações da tela de modelos exigem o módulo contratado", () => {
    const actions = lerArquivo("src", "modules", "storefront", "actions.ts");
    const quantidadeDeAcoes = [...actions.matchAll(/export async function /g)].length;
    const quantidadeDeGates = [...actions.matchAll(/ensureModuleForAction\("templates"\)/g)].length;
    expect(quantidadeDeAcoes).toBeGreaterThan(0);
    expect(quantidadeDeGates).toBe(quantidadeDeAcoes);
  });

  it('o arquivo "use server" só exporta função async', () => {
    const actions = lerArquivo("src", "modules", "storefront", "actions.ts");
    const exportacoes = [...actions.matchAll(/^export\s+(.+)$/gm)].map((m) => m[1]);
    for (const linha of exportacoes) {
      expect(linha.startsWith("async function "), `export proibido em "use server": ${linha}`).toBe(true);
    }
  });
});

/* ─────────────── todo bloco descrito tem componente registrado ─────────── */

describe("registro de blocos", () => {
  it("todo bloco do catálogo está registrado com um componente", () => {
    // Lido do arquivo, e não importado: importar o registro traria junto os
    // componentes React, o `next/image` e as consultas ao banco -- peso que um
    // teste unitário não precisa carregar.
    const registry = lerArquivo("src", "storefront", "registry.ts");
    const registrados = [...registry.matchAll(/defineBlock\(\s*([A-Za-z]+)Block/g)].map((m) => m[1]);
    expect(registrados.length).toBe(BLOCK_SPECS.length);
  });

  it("o renderizador continua desligado — a home é o page.tsx de hoje", () => {
    const pageTsx = lerArquivo("src", "app", "(store)", "page.tsx");
    expect(pageTsx).not.toContain("SectionsRenderer");
    expect(pageTsx).not.toContain("storefront");
  });
});
