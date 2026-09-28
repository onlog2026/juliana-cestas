// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { StoreContent } from "@/modules/content/types";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: unknown; className?: string }) =>
    createElement("a", { href, ...rest }, children as never),
}));
// next/image só serve imagens de hosts liberados; aqui basta um <img> com os atributos que importam.
vi.mock("next/image", () => ({
  default: ({ src, alt, className }: { src: string; alt: string; className?: string }) =>
    createElement("img", { src, alt, className }),
}));

import { PromoBanners } from "@/components/loja/promo-banners";

const IMG = "https://oygizajevizwhiymgsly.supabase.co/storage/v1/object/public/site-media/x/a.webp";
const IMG2 = "https://oygizajevizwhiymgsly.supabase.co/storage/v1/object/public/site-media/x/b.webp";
const empty = { imageUrl: "", href: "", alt: "" };

const html = (promo: StoreContent["promo_banners"]) => renderToStaticMarkup(createElement(PromoBanners, { promo }));

describe("PromoBanners", () => {
  it("desligado, ou sem nenhuma imagem: não renderiza nada", () => {
    expect(html({ enabled: false, wide: { ...empty, imageUrl: IMG }, narrow: empty })).toBe("");
    expect(html({ enabled: true, wide: empty, narrow: empty })).toBe("");
  });

  it("os dois: largo ocupa 2/3 e estreito 1/3 lado a lado a partir do tablet", () => {
    const out = html({
      enabled: true,
      wide: { imageUrl: IMG, href: "/categoria/frios", alt: "Frios" },
      narrow: { imageUrl: IMG2, href: "https://exemplo.com", alt: "Natal" },
    });
    expect(out).toContain("sm:grid-cols-3");
    expect(out).toContain("sm:col-span-2");
    expect(out).toContain("sm:aspect-[2/1]");
    expect(out).toContain("sm:h-full");
    expect(out).toContain(IMG);
    expect(out).toContain(IMG2);
  });

  it("só um banner com imagem: ocupa a largura toda", () => {
    const out = html({ enabled: true, wide: empty, narrow: { imageUrl: IMG2, href: "", alt: "Natal" } });
    expect(out).toContain(IMG2);
    expect(out).not.toContain("sm:grid-cols-3");
    expect(out).toContain("sm:aspect-[3/1]");
  });

  it("link interno vira <a> no mesmo site; https abre em nova aba; sem link é só imagem", () => {
    const interno = html({ enabled: true, wide: { imageUrl: IMG, href: "/categoria/frios", alt: "x" }, narrow: empty });
    expect(interno).toContain('href="/categoria/frios"');
    expect(interno).not.toContain("_blank");

    const externo = html({ enabled: true, wide: { imageUrl: IMG, href: "https://exemplo.com/p", alt: "x" }, narrow: empty });
    expect(externo).toContain('target="_blank"');
    expect(externo).toContain("noopener");

    const semLink = html({ enabled: true, wide: { imageUrl: IMG, href: "", alt: "x" }, narrow: empty });
    expect(semLink).not.toContain("<a ");
  });

  it("foto própria do celular: a do computador some no celular e vice-versa", () => {
    const out = html({
      enabled: true,
      wide: { imageUrl: IMG, mobileImageUrl: IMG2, href: "", alt: "x" },
      narrow: empty,
    });
    expect(out).toMatch(new RegExp(`src="${IMG2}"[^>]*sm:hidden|sm:hidden[^>]*src="${IMG2}"`));
    expect(out).toMatch(/hidden[^"]*sm:block/);
  });

  it("sem descrição, usa um texto padrão (imagem nunca fica sem alt)", () => {
    const out = html({ enabled: true, wide: { imageUrl: IMG, href: "", alt: "   " }, narrow: empty });
    expect(out).toContain('alt="Promoção"');
  });
});
