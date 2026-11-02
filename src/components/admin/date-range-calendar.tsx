"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { addDays, sameDay, startOfDay } from "@/lib/ventas-chart";

const DIAS = ["L", "M", "X", "J", "V", "S", "D"];

function monthMatrix(view: Date) {
  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const startPad = (first.getDay() + 6) % 7; // lunes = 0
  const start = addDays(startOfDay(first), -startPad);
  const weeks: Date[][] = [];
  let cursor = start;
  for (let w = 0; w < 6; w++) {
    const row: Date[] = [];
    for (let d = 0; d < 7; d++) {
      row.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(row);
  }
  return weeks;
}

export function DateRangeCalendar({
  from,
  to,
  onChange,
  maxDate,
}: {
  from: Date | null;
  to: Date | null;
  onChange: (from: Date, to: Date) => void;
  maxDate?: Date;
}) {
  const [view, setView] = useState(() => startOfDay(from || new Date()));
  const [picking, setPicking] = useState<"from" | "to">(
    from && !to ? "to" : "from"
  );

  const weeks = useMemo(() => monthMatrix(view), [view]);
  const max = maxDate ? startOfDay(maxDate) : startOfDay(new Date());
  const titulo = view.toLocaleDateString("es-HN", {
    month: "long",
    year: "numeric",
  });

  function inRange(day: Date) {
    if (!from || !to) return false;
    const t = day.getTime();
    return t >= startOfDay(from).getTime() && t <= startOfDay(to).getTime();
  }

  function onDayClick(day: Date) {
    if (day > max) return;

    if (picking === "from" || !from) {
      onChange(day, day);
      setPicking("to");
      return;
    }

    if (picking === "to") {
      if (day < startOfDay(from)) {
        onChange(day, from);
      } else {
        onChange(from, day);
      }
      setPicking("from");
    }
  }

  return (
    <div className="w-[min(100%,280px)] rounded-xl border bg-card p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() =>
            setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))
          }
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="text-sm font-medium capitalize">{titulo}</p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() =>
            setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))
          }
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
        {DIAS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((day) => {
          const outside = day.getMonth() !== view.getMonth();
          const disabled = day > max;
          const isFrom = from ? sameDay(day, from) : false;
          const isTo = to ? sameDay(day, to) : false;
          const selected = isFrom || isTo;
          const mid = inRange(day) && !selected;

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onDayClick(day)}
              className={cn(
                "h-8 rounded-md text-xs transition-colors",
                outside && "text-muted-foreground/50",
                disabled && "cursor-not-allowed opacity-40",
                !disabled && !selected && "hover:bg-muted",
                mid && "bg-primary/15 text-foreground",
                selected && "bg-primary text-primary-foreground hover:bg-primary"
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-[11px] text-muted-foreground">
        {picking === "to"
          ? "Elige la fecha final"
          : "Elige la fecha inicial (luego la final)"}
      </p>
    </div>
  );
}
