import { describe, it, expect } from "vitest";
import { normalizeCep, cepToInt, pickZoneForCep, type ZoneCepCandidate } from "@/modules/delivery/cep";

describe("normalizeCep", () => {
  it("aceita CEP com e sem máscara", () => {
    expect(normalizeCep("72015-000")).toBe("72015000");
    expect(normalizeCep("72015000")).toBe("72015000");
    expect(normalizeCep(" 7201 5000 ")).toBe("72015000");
  });
  it("rejeita CEP incompleto ou vazio", () => {
    expect(normalizeCep("7201500")).toBeNull();
    expect(normalizeCep("")).toBeNull();
    expect(normalizeCep(null)).toBeNull();
    expect(normalizeCep(undefined)).toBeNull();
  });
});

describe("cepToInt", () => {
  it("converte para inteiro sem perder o zero à esquerda semântico", () => {
    expect(cepToInt("72015000")).toBe(72015000);
    expect(cepToInt("01000000")).toBe(1000000);
  });
});

const z = (
  zoneId: string,
  feeCents: number,
  cepStart: number,
  cepEnd: number,
  prazo: [number | null, number | null] = [null, null]
): ZoneCepCandidate => ({
  zoneId,
  name: zoneId,
  feeCents,
  prazoMinDays: prazo[0],
  prazoMaxDays: prazo[1],
  cepStart,
  cepEnd,
});

describe("pickZoneForCep", () => {
  it("acha a zona quando o CEP está dentro da faixa", () => {
    const cands = [z("taguatinga", 1000, 72000000, 72199999)];
    expect(pickZoneForCep(cands, 72015000)?.zoneId).toBe("taguatinga");
  });

  it("retorna null quando nenhum CEP casa (não atendido)", () => {
    const cands = [z("taguatinga", 1000, 72000000, 72199999)];
    expect(pickZoneForCep(cands, 70000000)).toBeNull();
  });

  it("na sobreposição, escolhe a de MENOR preço (não cobra a mais)", () => {
    const cands = [
      z("cara", 3000, 72000000, 72999999),
      z("barata", 1000, 72010000, 72020000),
    ];
    expect(pickZoneForCep(cands, 72015000)?.zoneId).toBe("barata");
  });

  it("empate no preço → faixa mais estreita (mais específica)", () => {
    const cands = [
      z("larga", 1000, 72000000, 72999999),
      z("estreita", 1000, 72010000, 72020000),
    ];
    expect(pickZoneForCep(cands, 72015000)?.zoneId).toBe("estreita");
  });

  it("respeita os limites inclusivos da faixa", () => {
    const cands = [z("borda", 2000, 72010000, 72020000)];
    expect(pickZoneForCep(cands, 72010000)?.zoneId).toBe("borda");
    expect(pickZoneForCep(cands, 72020000)?.zoneId).toBe("borda");
    expect(pickZoneForCep(cands, 72009999)).toBeNull();
    expect(pickZoneForCep(cands, 72020001)).toBeNull();
  });

  it("lista vazia = não atendido", () => {
    expect(pickZoneForCep([], 72015000)).toBeNull();
  });
});
