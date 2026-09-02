import {
  saoPauloDateStr,
  saoPauloTimeStr,
  addDaysToDateStr,
  weekdayOfDateStr,
  timeStrToMinutes,
  minutesToTimeStr,
} from "@/lib/time/sao-paulo";

export type DayHours = { open: string; close: string } | null;

export type DeliverySettingsInput = {
  slotMinutes: number;
  leadTimeHours: number;
  capacityPerSlot: number;
  horizonDays: number;
  hours: Record<string, DayHours>;
  blockedDates: string[];
};

export type Slot = {
  start: string;
  end: string;
  available: boolean;
  reason?: "antecedencia" | "esgotado";
};

export type DaySlots = {
  date: string;
  weekday: number;
  closed: boolean;
  reason?: "fechado" | "bloqueado";
  slots: Slot[];
};

export type SlotOccupancy = Map<string, number>;

export function occupancyKey(date: string, start: string): string {
  return `${date}|${start}`;
}

/**
 * Gera a grade de dias/horários de entrega a partir das configurações da
 * loja. Função pura (recebe `now` e a ocupação já calculados) pra ser fácil
 * de testar e de reusar tanto no formulário quanto na revalidação do
 * servidor no momento de criar o pedido.
 */
export function generateSlots(
  settings: DeliverySettingsInput,
  now: Date = new Date(),
  occupancy: SlotOccupancy = new Map()
): DaySlots[] {
  const today = saoPauloDateStr(now);
  const nowMinutes = timeStrToMinutes(saoPauloTimeStr(now));
  const earliestMinutesToday = nowMinutes + settings.leadTimeHours * 60;

  const days: DaySlots[] = [];

  for (let offset = 0; offset < settings.horizonDays; offset++) {
    const date = addDaysToDateStr(today, offset);
    const weekday = weekdayOfDateStr(date);
    const dayHours = settings.hours[String(weekday)] ?? null;

    if (settings.blockedDates.includes(date)) {
      days.push({ date, weekday, closed: true, reason: "bloqueado", slots: [] });
      continue;
    }
    if (!dayHours) {
      days.push({ date, weekday, closed: true, reason: "fechado", slots: [] });
      continue;
    }

    const openMinutes = timeStrToMinutes(dayHours.open);
    const closeMinutes = timeStrToMinutes(dayHours.close);
    // A "antecedência" só existe em relação a AGORA; em dias futuros
    // (offset > 0) qualquer horário dentro do expediente já é elegível.
    const earliest = offset === 0 ? earliestMinutesToday : -Infinity;

    const slots: Slot[] = [];
    for (
      let start = openMinutes;
      start + settings.slotMinutes <= closeMinutes;
      start += settings.slotMinutes
    ) {
      const startStr = minutesToTimeStr(start);
      const endStr = minutesToTimeStr(start + settings.slotMinutes);

      if (start < earliest) {
        slots.push({ start: startStr, end: endStr, available: false, reason: "antecedencia" });
        continue;
      }

      const taken = occupancy.get(occupancyKey(date, startStr)) ?? 0;
      const available = taken < settings.capacityPerSlot;
      slots.push({
        start: startStr,
        end: endStr,
        available,
        reason: available ? undefined : "esgotado",
      });
    }

    days.push({ date, weekday, closed: false, slots });
  }

  return days;
}

/** Confere um slot específico ainda está de pé — usado ao revalidar no servidor. */
export function isSlotStillAvailable(
  days: DaySlots[],
  date: string,
  start: string
): boolean {
  const day = days.find((d) => d.date === date);
  if (!day || day.closed) return false;
  const slot = day.slots.find((s) => s.start === start);
  return Boolean(slot?.available);
}
