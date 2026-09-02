// Helpers de fuso horário sem depender de date-fns/tz: o Brasil não tem mais
// horário de verão (abolido em 2019), então America/Sao_Paulo é UTC-3 fixo —
// mas usamos Intl.DateTimeFormat (não um offset chumbado) pra ficar correto
// mesmo que isso mude, e pra não depender do fuso do servidor (Vercel roda
// em UTC; o navegador de quem compra pode estar em qualquer fuso).

const TIME_ZONE = "America/Sao_Paulo";

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  weekday: "short",
});

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** "YYYY-MM-DD" da data `at` (default: agora), no relógio de Brasília. */
export function saoPauloDateStr(at: Date = new Date()): string {
  return dateFormatter.format(at);
}

/** "HH:mm" da hora `at` (default: agora), no relógio de Brasília. */
export function saoPauloTimeStr(at: Date = new Date()): string {
  return timeFormatter.format(at);
}

/** 0 (domingo) a 6 (sábado) da data `at`, no calendário de Brasília. */
export function saoPauloWeekday(at: Date = new Date()): number {
  const parts = weekdayFormatter.formatToParts(at);
  const short = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  return WEEKDAY_INDEX[short] ?? 0;
}

/** Soma `days` a uma string "YYYY-MM-DD" (aritmética de calendário, sem fuso). */
export function addDaysToDateStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

/** 0 (domingo) a 6 (sábado) de uma string "YYYY-MM-DD" (aritmética de calendário). */
export function weekdayOfDateStr(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Compara duas datas "YYYY-MM-DD" (-1, 0, 1). */
export function compareDateStr(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Minutos desde 00:00 de uma string "HH:mm". */
export function timeStrToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTimeStr(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}
