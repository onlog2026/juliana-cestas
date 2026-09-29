import { describe, expect, it } from "vitest";
import { deliveryHint } from "@/modules/delivery/today";

const hours = Object.fromEntries(["0", "1", "2", "3", "4", "5", "6"].map((d) => [d, d === "0" ? null : { open: "09:00", close: "18:00" }]));
const settings = { slotMinutes: 60, leadTimeHours: 2, horizonDays: 10, hours, blockedDates: [] as string[] };
// 2026-09-29 é terça-feira. 12:00 em São Paulo = 15:00Z.
const at = (iso: string) => new Date(iso);

describe("entrega hoje", () => {
  it("tem horário livre: mostra até quando pedir (último horário 17:00 − 2h = 15:00)", () => {
    expect(deliveryHint(settings, at("2026-09-29T15:00:00Z"))).toEqual({ state: "today", text: "Peça até 15:00 e receba hoje" });
  });
  it("passou do limite: próxima entrega amanhã", () => {
    const h = deliveryHint(settings, at("2026-09-29T21:00:00Z")); // 18:00
    expect(h.state).toBe("later");
    expect(h.text).toBe("Próxima entrega: amanhã");
  });
  it("domingo fechado: aponta para segunda", () => {
    const h = deliveryHint(settings, at("2026-10-04T15:00:00Z")); // domingo
    expect(h.text).toBe("Próxima entrega: amanhã");
  });
  it("sábado à noite: amanhã é domingo fechado → segunda", () => {
    const h = deliveryHint(settings, at("2026-10-03T22:00:00Z")); // sábado 19:00
    expect(h.text).toBe("Próxima entrega: segunda");
  });
  it("data bloqueada hoje não promete entrega", () => {
    const h = deliveryHint({ ...settings, blockedDates: ["2026-09-29"] }, at("2026-09-29T15:00:00Z"));
    expect(h.state).toBe("later");
  });
  it("sem nenhum dia aberto no horizonte: sem texto", () => {
    const h = deliveryHint({ ...settings, hours: {} }, at("2026-09-29T15:00:00Z"));
    expect(h).toEqual({ state: "none", text: "" });
  });
});
