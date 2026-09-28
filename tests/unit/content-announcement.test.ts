import { describe, expect, it } from "vitest";
import {
  STORE_SECTIONS,
  announcementSchema,
  promoBannersSchema,
  safeHrefSchema,
} from "@/modules/content/types";
import { STORE_DEFAULTS } from "@/modules/content/defaults";

const STORAGE = "https://oygizajevizwhiymgsly.supabase.co/storage/v1/object/public/site-media/abc/banner.webp";

describe("safeHrefSchema", () => {
  it("aceita vazio, caminho interno e https", () => {
    for (const v of ["", "/", "/categoria/cafe-da-manha", "https://exemplo.com/promo"]) {
      expect(safeHrefSchema.safeParse(v).success, v).toBe(true);
    }
  });

  it("recusa esquemas perigosos e protocolo relativo", () => {
    for (const v of [
      "javascript:alert(1)",
      "JavaScript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "//evil.com",
      "http://exemplo.com",
      "exemplo.com",
      "  javascript:alert(1)",
    ]) {
      expect(safeHrefSchema.safeParse(v).success, v).toBe(false);
    }
  });
});

describe("announcementSchema", () => {
  it("o padrão da loja (desligado, sem texto) é válido", () => {
    expect(announcementSchema.safeParse(STORE_DEFAULTS.announcement).success).toBe(true);
  });

  it("aceita aviso completo com link e cores", () => {
    const r = announcementSchema.safeParse({
      enabled: true,
      text: "Frete grátis acima de R$ 300",
      href: "/categoria/cafe-da-manha",
      bgColor: "#556b2f",
      textColor: "#FBF6EA",
    });
    expect(r.success).toBe(true);
  });

  it("recusa texto acima de 160, cor inválida e link perigoso", () => {
    expect(announcementSchema.safeParse({ enabled: true, text: "x".repeat(161) }).success).toBe(false);
    expect(announcementSchema.safeParse({ enabled: true, text: "ok", bgColor: "verde" }).success).toBe(false);
    expect(announcementSchema.safeParse({ enabled: true, text: "ok", bgColor: "#fff" }).success).toBe(false);
    expect(announcementSchema.safeParse({ enabled: true, text: "ok", href: "javascript:alert(1)" }).success).toBe(
      false
    );
  });

  it("apara espaços do texto", () => {
    const r = announcementSchema.parse({ enabled: true, text: "  Olá  " });
    expect(r.text).toBe("Olá");
  });
});

describe("promoBannersSchema", () => {
  it("o padrão (desligado, slots vazios) é válido", () => {
    expect(promoBannersSchema.safeParse(STORE_DEFAULTS.promo_banners).success).toBe(true);
  });

  it("aceita imagens do Storage do Supabase e do próprio site", () => {
    const slot = { imageUrl: STORAGE, mobileImageUrl: "/images/banners/x.webp", href: "/", alt: "Promoção" };
    expect(promoBannersSchema.safeParse({ enabled: true, wide: slot, narrow: slot }).success).toBe(true);
  });

  it("recusa imagem de outro host (next/image quebraria a página) e link perigoso", () => {
    const base = { href: "/", alt: "x" };
    const ruim = [
      "https://outro-site.com/img.webp",
      "http://oygizajevizwhiymgsly.supabase.co/storage/v1/object/public/x.webp",
      "//cdn.exemplo.com/x.webp",
      "https://oygizajevizwhiymgsly.supabase.co.evil.com/storage/v1/object/public/x.webp",
    ];
    for (const imageUrl of ruim) {
      const r = promoBannersSchema.safeParse({
        enabled: true,
        wide: { ...base, imageUrl },
        narrow: { ...base, imageUrl: "" },
      });
      expect(r.success, imageUrl).toBe(false);
    }
    const perigoso = promoBannersSchema.safeParse({
      enabled: true,
      wide: { imageUrl: "", href: "javascript:alert(1)", alt: "" },
      narrow: { imageUrl: "", href: "", alt: "" },
    });
    expect(perigoso.success).toBe(false);
  });
});

describe("STORE_DEFAULTS", () => {
  it("todo padrão passa no schema da própria seção (loja nova nunca cai em erro)", () => {
    for (const key of Object.keys(STORE_SECTIONS) as (keyof typeof STORE_SECTIONS)[]) {
      const parsed = STORE_SECTIONS[key].safeParse(STORE_DEFAULTS[key]);
      expect(parsed.success, `seção ${key}`).toBe(true);
    }
  });
});
