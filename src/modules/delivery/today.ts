import { generateSlots, type DeliverySettingsInput } from "@/modules/delivery/slots";
import { minutesToTimeStr, timeStrToMinutes } from "@/lib/time/sao-paulo";

/** Só o que o cálculo de "entrega hoje" precisa (a lotação por horário não entra). */
export type PublicDeliverySettings = Pick<
  DeliverySettingsInput,
  "slotMinutes" | "leadTimeHours" | "horizonDays" | "hours" | "blockedDates"
>;

const WEEKDAYS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

export type DeliveryHint = { state: "today" | "later" | "none"; text: string };

/**
 * Texto curto para "quando chega": "Peça até 14:30 e receba hoje" enquanto há
 * horário livre hoje; senão, a próxima entrega. Função pura (recebe `now`).
 * Ignora a lotação de cada horário: por isso a frase diz "Peça até…" e o
 * checkout continua sendo a palavra final.
 */
export function deliveryHint(settings: PublicDeliverySettings, now: Date = new Date()): DeliveryHint {
  const days = generateSlots({ ...settings, capacityPerSlot: 1 }, now);
  const today = days[0];
  const todayOpen = today?.slots.filter((s) => s.available) ?? [];
  if (todayOpen.length > 0) {
    const last = todayOpen[todayOpen.length - 1].start;
    const cutoff = Math.max(0, timeStrToMinutes(last) - Math.round(settings.leadTimeHours * 60));
    return { state: "today", text: `Peça até ${minutesToTimeStr(cutoff)} e receba hoje` };
  }
  for (let i = 1; i < days.length; i++) {
    const d = days[i];
    if (!d.slots.some((s) => s.available)) continue;
    const when = i === 1 ? "amanhã" : WEEKDAYS[d.weekday];
    // Sem horário: a grade da loja pode abrir 00:00–23:30 e "às 00:00" confunde o cliente.
    return { state: "later", text: `Próxima entrega: ${when}` };
  }
  return { state: "none", text: "" };
}
