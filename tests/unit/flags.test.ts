import { describe, expect, it } from "vitest";
import {
  DEFAULT_FLAGS,
  contrastRatio,
  discountPercent,
  hasLowContrast,
  readableTextOn,
  resolveRibbon,
  slugifyFlagId,
} from "@/modules/flags/logic";
import { flagsSchema } from "@/modules/content/types";

describe("discountPercent", () => {
  it("300 por 259 = 14%", () => {
    expect(discountPercent(25900, 30000)).toBe(14);
  });
  it("sem preço 'de', igual ou menor que o atual: nada", () => {
    expect(discountPercent(25900, null)).toBeNull();
    expect(discountPercent(25900, undefined)).toBeNull();
    expect(discountPercent(25900, 25900)).toBeNull();
    expect(discountPercent(25900, 20000)).toBeNull();
    expect(discountPercent(0, 100)).toBeNull();
  });
  it("desconto abaixo de 0,5% não vira tarja", () => {
    expect(discountPercent(99900, 100000)).toBeNull();
  });
});

describe("contraste", () => {
  it("preto no branco é 21; texto ilegível é detectado", () => {
    expect(Math.round(contrastRatio("#000000", "#ffffff"))).toBe(21);
    expect(hasLowContrast("#ffffff", "#f5f5f5")).toBe(true);
    expect(hasLowContrast("#b3261e", "#ffffff")).toBe(false);
  });
  it("sugere texto legível sobre o fundo", () => {
    expect(readableTextOn("#111111")).toBe("#ffffff");
    expect(readableTextOn("#f5c518")).toBe("#1f2a24");
  });
});

describe("resolveRibbon (uma tarja por produto)", () => {
  const p = { priceCents: 25900, compareAtCents: 30000 };
  it("flag escolhida vence a automática", () => {
    expect(resolveRibbon({ ...p, flagId: "black-friday" }, DEFAULT_FLAGS)).toEqual({
      label: "Black Friday",
      bg: "#111111",
      text: "#f5c518",
    });
  });
  it("sem flag: desconto automático com as cores da flag de desconto", () => {
    expect(resolveRibbon({ ...p, flagId: null }, DEFAULT_FLAGS)).toEqual({ label: "-14%", bg: "#b3261e", text: "#ffffff" });
  });
  it("flag desligada ou removida cai no automático; automática desligada = nenhuma", () => {
    const off = { ...DEFAULT_FLAGS, items: DEFAULT_FLAGS.items.map((f) => ({ ...f, enabled: false })) };
    expect(resolveRibbon({ ...p, flagId: "promocao" }, off)?.label).toBe("-14%");
    expect(resolveRibbon({ ...p, flagId: "some-id" }, DEFAULT_FLAGS)?.label).toBe("-14%");
    expect(resolveRibbon({ ...p, flagId: null }, { ...off, discount: { ...off.discount, enabled: false } })).toBeNull();
  });
  it("produto comum não tem tarja", () => {
    expect(resolveRibbon({ priceCents: 1000 }, DEFAULT_FLAGS)).toBeNull();
  });
});

describe("slug e schema", () => {
  it("id sem acento e sem repetir", () => {
    expect(slugifyFlagId("Dia das Mães!", [])).toBe("dia-das-maes");
    expect(slugifyFlagId("Promoção", ["promocao"])).toBe("promocao-2");
    expect(slugifyFlagId("!!!", [])).toBe("flag");
  });
  it("os modelos prontos são válidos; cor fora do formato é recusada", () => {
    expect(flagsSchema.safeParse(DEFAULT_FLAGS).success).toBe(true);
    const ruim = { ...DEFAULT_FLAGS, items: [{ ...DEFAULT_FLAGS.items[0], bg: "red" }] };
    expect(flagsSchema.safeParse(ruim).success).toBe(false);
  });
});
