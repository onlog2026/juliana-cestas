"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DaySlots } from "@/modules/delivery/slots";

const WEEKDAY_HEADERS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

type Props = {
  days: DaySlots[];
  selectedDate: string;
  onSelect: (date: string) => void;
};

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function firstWeekdayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 1)).getUTCDay();
}

export function CalendarPicker({ days, selectedDate, onSelect }: Props) {
  const byDate = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);

  const monthKeys = useMemo(() => {
    const seen = new Set<string>();
    days.forEach((d) => seen.add(d.date.slice(0, 7)));
    return Array.from(seen).sort();
  }, [days]);

  const initialIdx = useMemo(() => {
    if (!selectedDate) return 0;
    const idx = monthKeys.indexOf(selectedDate.slice(0, 7));
    return idx >= 0 ? idx : 0;
  }, [monthKeys, selectedDate]);

  const [monthIdx, setMonthIdx] = useState(initialIdx);
  const activeMonthKey = monthKeys[Math.min(monthIdx, monthKeys.length - 1)] ?? monthKeys[0];

  if (!activeMonthKey) return null;

  const [year, month] = activeMonthKey.split("-").map(Number);
  const monthZeroIndexed = month - 1;
  const totalDays = daysInMonth(year, monthZeroIndexed);
  const leadingBlanks = firstWeekdayOfMonth(year, monthZeroIndexed);

  const cells: (string | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => {
      const dayNum = String(i + 1).padStart(2, "0");
      return `${activeMonthKey}-${dayNum}`;
    }),
  ];

  return (
    <div
      className="jc-glow-card rounded-2xl border border-[color-mix(in_oklch,var(--primary),transparent_78%)] bg-card p-4 sm:p-5"
      style={{ boxShadow: "var(--jc-shadow)" }}
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={monthIdx === 0}
          onClick={() => setMonthIdx((i) => Math.max(0, i - 1))}
          className="flex size-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="font-display text-lg text-foreground">
          {MONTH_NAMES[monthZeroIndexed]} de {year}
        </p>
        <button
          type="button"
          disabled={monthIdx >= monthKeys.length - 1}
          onClick={() => setMonthIdx((i) => Math.min(monthKeys.length - 1, i + 1))}
          className="flex size-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Próximo mês"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-muted-foreground">
        {WEEKDAY_HEADERS.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>

      <div className="mt-1.5 grid grid-cols-7 gap-1.5">
        {cells.map((date, i) => {
          if (!date) return <span key={`blank-${i}`} />;

          const day = byDate.get(date);
          const hasSlot = Boolean(day && !day.closed && day.slots.some((s) => s.available));
          const isSelected = date === selectedDate;
          const dayNum = date.slice(8, 10);

          return (
            <button
              key={date}
              type="button"
              disabled={!hasSlot}
              onClick={() => onSelect(date)}
              className={`flex aspect-square items-center justify-center rounded-full text-sm font-medium transition-colors ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-[0_0_0_3px_color-mix(in_oklch,var(--primary),transparent_75%)]"
                  : hasSlot
                    ? "text-foreground hover:bg-accent"
                    : "cursor-not-allowed text-muted-foreground/35"
              }`}
            >
              {dayNum}
            </button>
          );
        })}
      </div>
    </div>
  );
}
