import { describe, expect, it } from "vitest";
import { isEligibleForCarrierShipping, type ShipsNationallyProduct } from "@/modules/delivery/resolve-delivery";

function product(overrides: Partial<ShipsNationallyProduct> = {}): ShipsNationallyProduct {
  return {
    deliveryFeeCents: 0,
    shipsNationally: true,
    weightGrams: 500,
    lengthCm: 30,
    widthCm: 20,
    heightCm: 15,
    ...overrides,
  };
}

describe("isEligibleForCarrierShipping", () => {
  it("elegível quando shipsNationally=true e peso+3 medidas são positivos", () => {
    expect(isEligibleForCarrierShipping(product())).toBe(true);
  });

  it("não elegível quando shipsNationally=false, mesmo com medidas completas", () => {
    expect(isEligibleForCarrierShipping(product({ shipsNationally: false }))).toBe(false);
  });

  it("não elegível faltando qualquer uma das medidas", () => {
    expect(isEligibleForCarrierShipping(product({ weightGrams: null }))).toBe(false);
    expect(isEligibleForCarrierShipping(product({ lengthCm: null }))).toBe(false);
    expect(isEligibleForCarrierShipping(product({ widthCm: null }))).toBe(false);
    expect(isEligibleForCarrierShipping(product({ heightCm: null }))).toBe(false);
  });

  it("não elegível com valor zero ou negativo", () => {
    expect(isEligibleForCarrierShipping(product({ weightGrams: 0 }))).toBe(false);
    expect(isEligibleForCarrierShipping(product({ lengthCm: -5 }))).toBe(false);
  });
});
