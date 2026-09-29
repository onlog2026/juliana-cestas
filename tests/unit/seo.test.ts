import { describe, expect, it } from "vitest";
import { clampTitle, pickDescription, truncateAtWord } from "@/modules/seo/meta";
import {
  absoluteUrl,
  breadcrumbSchema,
  formatCnpj,
  itemListSchema,
  productSchema,
  prune,
  serializeJsonLd,
  websiteSchema,
} from "@/modules/seo/schema";

describe("títulos e descrições", () => {
  it("título de até 60 caracteres, sem partir palavra nem deixar pontuação solta", () => {
    const t = clampTitle("Mesa de Frios Majestosa: tábua de frios artesanais para festas | Juliana Cestas");
    expect(t.length).toBeLessThanOrEqual(60);
    expect(t.endsWith("|")).toBe(false);
    expect(t).toBe("Mesa de Frios Majestosa: tábua de frios artesanais para");
    expect(clampTitle("Cesta Premium")).toBe("Cesta Premium");
  });

  it("descrição do dono só vale entre 70 e 160; curta demais vira o texto-padrão", () => {
    const fallback = "Cesta Afeto: feita à mão em Brasília, com entrega no mesmo dia e cartão personalizado. Peça já a sua.";
    expect(pickDescription("curta", fallback)).toBe(fallback);
    expect(pickDescription(null, fallback)).toBe(fallback);
    const ok = "a".repeat(80);
    expect(pickDescription(ok, fallback)).toBe(ok);
  });

  it("descrição comprida é cortada em 160 na última palavra, com reticências", () => {
    const long = "Cestas de café da manhã artesanais em Brasília, com entrega no mesmo dia e cartão de mensagem personalizado. Presentes para namorados, aniversário, casamento e ocasiões especiais.";
    expect(long.length).toBeGreaterThan(160);
    const out = pickDescription(long, "x");
    expect(out.length).toBeLessThanOrEqual(160);
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toMatch(/\s…$/);
  });

  it("truncateAtWord respeita o limite", () => {
    expect(truncateAtWord("um dois três quatro", 10)).toBe("um dois");
    expect(truncateAtWord("curto", 10)).toBe("curto");
  });
});

describe("dados estruturados", () => {
  it("prune tira undefined, vazio e listas vazias", () => {
    expect(prune({ a: 1, b: undefined, c: "", d: [], e: { f: undefined }, g: [1, undefined] })).toEqual({ a: 1, g: [1], e: {} });
  });

  it("serializeJsonLd escapa '<' (nada de </script> dentro do JSON)", () => {
    const out = serializeJsonLd({ name: 'Cesta </script><script>alert(1)</script>' });
    expect(out).not.toContain("<");
    expect(JSON.parse(out).name).toContain("</script>");
  });

  it("imagem do Storage fica como está; caminho do site ganha o domínio", () => {
    expect(absoluteUrl("https://loja.com.br", "https://x.supabase.co/a.webp")).toBe("https://x.supabase.co/a.webp");
    expect(absoluteUrl("https://loja.com.br/", "/images/a.webp")).toBe("https://loja.com.br/images/a.webp");
    expect(absoluteUrl("https://loja.com.br", "")).toBeUndefined();
  });

  it("CNPJ só com 14 dígitos (CPF nunca é publicado)", () => {
    expect(formatCnpj("12345678000190")).toBe("12.345.678/0001-90");
    expect(formatCnpj("123.456.789-09")).toBeNull();
    expect(formatCnpj(null)).toBeNull();
  });

  it("Product: preço em reais, sem marca/sku inventados e avaliação só se houver", () => {
    const base = { siteUrl: "https://loja.com.br", slug: "cesta-x", name: "Cesta X", images: ["https://s/a.webp"], priceCents: 25900 };
    const sem = prune(productSchema(base)) as Record<string, any>;
    expect(sem.offers.price).toBe("259.00");
    expect(sem.brand).toBeUndefined();
    expect(sem.aggregateRating).toBeUndefined();
    expect(sem.offers.priceValidUntil).toBeUndefined();
    const com = prune(productSchema({ ...base, brandName: "Loja", rating: { average: 4.86, total: 7 }, priceValidUntil: "2026-12-31" })) as Record<string, any>;
    expect(com.aggregateRating).toMatchObject({ ratingValue: "4.9", reviewCount: 7 });
    expect(com.offers.priceValidUntil).toBe("2026-12-31");
    const zero = prune(productSchema({ ...base, rating: { average: 0, total: 0 } })) as Record<string, any>;
    expect(zero.aggregateRating).toBeUndefined();
    const fora = prune(productSchema({ ...base, inStock: false })) as Record<string, any>;
    expect(fora.offers.availability).toContain("OutOfStock");
  });

  it("Breadcrumb, WebSite e ItemList: posições e endereços certos", () => {
    const b = breadcrumbSchema("https://l.com", [{ name: "Início", path: "/" }, { name: "Cestas", path: "/categoria/x" }]) as any;
    expect(b.itemListElement[1]).toMatchObject({ position: 2, item: "https://l.com/categoria/x" });
    expect((websiteSchema({ siteUrl: "https://l.com", name: "L" }) as any).potentialAction).toBeUndefined();
    const l = itemListSchema("https://l.com", [{ name: "A", slug: "a" }]) as any;
    expect(l.itemListElement[0].url).toBe("https://l.com/produto/a");
  });
});

import { parseRecent, pushRecent, RECENT_MAX } from "@/modules/catalog/recent";

describe("vistos recentemente", () => {
  it("mais recente primeiro, sem repetir e com limite", () => {
    expect(pushRecent(["a", "b", "c"], "b")).toEqual(["b", "a", "c"]);
    const many = Array.from({ length: 20 }, (_, i) => `s${i}`);
    expect(pushRecent(many, "novo")).toHaveLength(RECENT_MAX);
    expect(pushRecent(many, "novo")[0]).toBe("novo");
  });
  it("lixo no storage vira lista vazia ou só textos válidos", () => {
    expect(parseRecent(null)).toEqual([]);
    expect(parseRecent("{nao json")).toEqual([]);
    expect(parseRecent('{"a":1}')).toEqual([]);
    expect(parseRecent('["ok",3,"","x"]')).toEqual(["ok", "x"]);
  });
});

import { coBought } from "@/modules/catalog/co-bought";

describe("quem comprou também levou", () => {
  const rows = [
    { order_id: "o1", product_id: "A" },
    { order_id: "o1", product_id: "B" },
    { order_id: "o2", product_id: "A" },
    { order_id: "o2", product_id: "B" },
    { order_id: "o2", product_id: "C" },
    { order_id: "o3", product_id: "D" },
  ];
  it("ordena por frequência, sem o próprio produto nem pedidos de outros", () => {
    expect(coBought(rows, "A")).toEqual(["B", "C"]);
    expect(coBought(rows, "A", 1)).toEqual(["B"]);
  });
  it("produto sem pedido devolve vazio", () => {
    expect(coBought(rows, "Z")).toEqual([]);
    expect(coBought([], "A")).toEqual([]);
  });
});
