// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { cleanup, render } from "@testing-library/react";
import type { Banner } from "@/modules/banners/service";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: unknown; className?: string }) =>
    createElement("a", { href, ...rest }, children as never),
}));
vi.mock("@/modules/banners/actions", () => ({ upsertBanner: vi.fn() }));
vi.mock("@/components/loja/use-is-staff", () => ({ useIsStaff: () => false }));

import { BannerCarousel } from "@/components/loja/banner-carousel";

const HOST = "https://oygizajevizwhiymgsly.supabase.co/storage/v1/object/public/site-media/x";

function banner(over: Partial<Banner> & { id: string }): Banner {
  return {
    slug: over.id,
    image: `${HOST}/${over.id}-desktop.webp`,
    mobileImage: null,
    mobileObjectPosition: null,
    href: "/",
    text: `Banner ${over.id}`,
    textPosition: { top: 40, left: 5, maxWidth: 60 },
    objectPosition: "30% 40%",
    textAlign: "left",
    fontSize: 48,
    fontFamily: "display",
    fontColor: "#ffffff",
    active: true,
    sortOrder: 1,
    ...over,
  } as Banner;
}

// jsdom não tem matchMedia. `matches: true` também liga o "movimento reduzido",
// o que desliga o autoplay (nada de temporizador solto nos testes).
beforeEach(() => {
  window.matchMedia = ((query: string) => ({
    matches: true,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
});
afterEach(() => cleanup());

describe("BannerCarousel — foto do banner em <picture>", () => {
  it("banner com foto de celular: UMA <img> por banner e o <source> do celular (não baixa as duas)", () => {
    const { container } = render(
      createElement(BannerCarousel, { banners: [banner({ id: "a", mobileImage: `${HOST}/a-mobile.webp` })] })
    );
    const pictures = container.querySelectorAll("picture");
    expect(pictures).toHaveLength(1);
    expect(container.querySelectorAll("img")).toHaveLength(1);

    const source = pictures[0].querySelector("source")!;
    expect(source.getAttribute("media")).toBe("(max-width: 639px)");
    expect(decodeURIComponent(source.getAttribute("srcset") ?? "")).toContain("a-mobile.webp");
    expect(decodeURIComponent(container.querySelector("img")!.getAttribute("srcset") ?? "")).toContain(
      "a-desktop.webp"
    );
  });

  it("banner sem foto de celular: sem <source>, a mesma foto serve nas duas larguras", () => {
    const { container } = render(createElement(BannerCarousel, { banners: [banner({ id: "b" })] }));
    expect(container.querySelector("picture source")).toBeNull();
    expect(container.querySelectorAll("img")).toHaveLength(1);
  });

  it("só o PRIMEIRO banner tem prioridade alta; os demais carregam sob demanda", () => {
    const { container } = render(
      createElement(BannerCarousel, {
        banners: [banner({ id: "1" }), banner({ id: "2" }), banner({ id: "3" })],
      })
    );
    const imgs = [...container.querySelectorAll("img")];
    expect(imgs).toHaveLength(3);
    expect(imgs[0].getAttribute("fetchpriority")).toBe("high");
    expect(imgs[0].getAttribute("loading")).not.toBe("lazy");
    for (const img of imgs.slice(1)) {
      expect(img.getAttribute("loading")).toBe("lazy");
      expect(img.getAttribute("fetchpriority")).not.toBe("high");
    }
  });

  it("o foco da foto vai em variáveis CSS: celular usa o do celular, computador o do computador", () => {
    const { container } = render(
      createElement(BannerCarousel, {
        banners: [banner({ id: "c", mobileImage: `${HOST}/c-mobile.webp`, mobileObjectPosition: "80% 10%" })],
      })
    );
    const img = container.querySelector("img")!;
    expect(img.style.getPropertyValue("--jc-op-m")).toBe("80% 10%");
    expect(img.style.getPropertyValue("--jc-op-d")).toBe("30% 40%");
    expect(img.className).toContain("[object-position:var(--jc-op-m)]");
    expect(img.className).toContain("sm:[object-position:var(--jc-op-d)]");
  });

  it("sem foto de celular, o foco do celular é o mesmo do computador", () => {
    const { container } = render(createElement(BannerCarousel, { banners: [banner({ id: "d" })] }));
    const img = container.querySelector("img")!;
    expect(img.style.getPropertyValue("--jc-op-m")).toBe("30% 40%");
    expect(img.style.getPropertyValue("--jc-op-d")).toBe("30% 40%");
  });

  it("mantém o texto alternativo (o texto do banner) e o texto visível", () => {
    const { container } = render(createElement(BannerCarousel, { banners: [banner({ id: "e", text: "Cestas feitas à mão" })] }));
    expect(container.querySelector("img")!.getAttribute("alt")).toBe("Cestas feitas à mão");
    expect(container.textContent).toContain("Cestas feitas à mão");
  });

  it("sem banners não renderiza nada", () => {
    const { container } = render(createElement(BannerCarousel, { banners: [] }));
    expect(container.innerHTML).toBe("");
  });
});
