"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { addDays, sameDay, startOfDay } from "@/lib/ventas-chart";

const DIAS = ["L", "M", "X", "J", "V", "S", "D"];

function monthMatrix(view: Date) {
  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const startPad = (first.getDay() + 6) % 7;
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
  initialFrom,
  initialTo,
  onAccept,
  onCancel,
  maxDate,
}: {
  initialFrom: Date;
  initialTo: Date;
  onAccept: (from: Date, to: Date) => void;
  onCancel: () => void;
  maxDate?: Date;
}) {
  const [view, setView] = useState(() => startOfDay(initialFrom));
  const [draftFrom, setDraftFrom] = useState(() => startOfDay(initialFrom));
  const [draftTo, setDraftTo] = useState(() => startOfDay(initialTo));
  /** Si hay ancla, el próximo clic completa el rango (o deja 1 día si es el mismo). */
  const [anchor, setAnchor] = useState<Date | null>(null);

  const weeks = useMemo(() => monthMatrix(view), [view]);
  const max = maxDate ? startOfDay(maxDate) : startOfDay(new Date());
  const titulo = view.toLocaleDateString("es-HN", {
    month: "long",
    year: "numeric",
  });

  function inRange(day: Date) {
    const t = startOfDay(day).getTime();
    const a = draftFrom.getTime();
    const b = draftTo.getTime();
    return t >= Math.min(a, b) && t <= Math.max(a, b);
  }

  function onDayClick(day: Date) {
    if (day > max) return;
    const d = startOfDay(day);

    if (!anchor) {
      // Un solo día seleccionado; listo para Aceptar, o segundo clic para rango
      setDraftFrom(d);
      setDraftTo(d);
      setAnchor(d);
      return;
    }

    if (sameDay(d, anchor)) {
      // Confirma 1 día
      setDraftFrom(d);
      setDraftTo(d);
      setAnchor(null);
      return;
    }

    if (d < anchor) {
      setDraftFrom(d);
      setDraftTo(anchor);
    } else {
      setDraftFrom(anchor);
      setDraftTo(d);
    }
    setAnchor(null);
  }

  return (
    <div className="w-[min(100%,300px)] rounded-xl border bg-card p-3 shadow-sm">
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
          const isFrom = sameDay(day, draftFrom);
          const isTo = sameDay(day, draftTo);
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
        {sameDay(draftFrom, draftTo)
          ? "1 día seleccionado. Puedes tocar otro día para un rango, o Aceptar."
          : "Rango listo. Toca Aceptar o elige otra fecha para empezar de nuevo."}
      </p>

      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          className="flex-1"
          onClick={() => onAccept(draftFrom, draftTo)}
        >
          Aceptar
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
