"use client";

import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { formatPrice } from "@/lib/format";
import {
  agruparVentasRango,
  formatRangoLabel,
  preset7Dias,
  presetHoy,
  presetMes,
  type VentaPunto,
} from "@/lib/ventas-chart";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DateRangeCalendar } from "@/components/admin/date-range-calendar";

const ATAJOS = [
  { key: "hoy", label: "Hoy", get: presetHoy },
  { key: "7d", label: "7 días", get: preset7Dias },
  { key: "mes", label: "Este mes", get: presetMes },
] as const;

export function VentasChart({ puntos }: { puntos: VentaPunto[] }) {
  const inicial = preset7Dias();
  const [from, setFrom] = useState(inicial.from);
  const [to, setTo] = useState(inicial.to);
  const [showCal, setShowCal] = useState(false);
  const [atajo, setAtajo] = useState<"hoy" | "7d" | "mes" | "custom">("7d");

  const barras = useMemo(
    () => agruparVentasRango(puntos, from, to),
    [puntos, from, to]
  );

  const max = Math.max(1, ...barras.map((b) => b.total));
  const totalPeriodo = barras.reduce((s, b) => s + b.total, 0);
  const cantidadPeriodo = barras.reduce((s, b) => s + b.cantidad, 0);

  function applyRange(nextFrom: Date, nextTo: Date, nextAtajo: typeof atajo) {
    setFrom(nextFrom);
    setTo(nextTo);
    setAtajo(nextAtajo);
  }

  return (
    <Card>
      <CardHeader className="gap-3 space-y-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-lg">Ventas</CardTitle>
            <CardDescription>
              {formatRangoLabel(from, to)} · {cantidadPeriodo} pedido
              {cantidadPeriodo === 1 ? "" : "s"} · {formatPrice(totalPeriodo)}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border bg-muted/40 p-1">
              {ATAJOS.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => {
                    const r = a.get();
                    applyRange(r.from, r.to, a.key);
                    setShowCal(false);
                  }}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                    atajo === a.key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {a.label}
                </button>
              ))}
            </div>
            <Button
              type="button"
              variant={showCal || atajo === "custom" ? "default" : "outline"}
              size="sm"
              onClick={() => setShowCal((v) => !v)}
            >
              <CalendarDays className="h-4 w-4" />
              Calendario
            </Button>
          </div>
        </div>

        {showCal && (
          <DateRangeCalendar
            from={from}
            to={to}
            maxDate={new Date()}
            onChange={(f, t) => {
              applyRange(f, t, "custom");
            }}
          />
        )}
      </CardHeader>
      <CardContent>
        {cantidadPeriodo === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No hay ventas en las fechas seleccionadas.
          </p>
        ) : (
          <div className="space-y-3">
            <div
              className="flex h-48 items-end gap-1.5 sm:gap-2"
              role="img"
              aria-label="Gráfico de ventas"
            >
              {barras.map((b) => {
                const h =
                  b.total <= 0
                    ? 0
                    : Math.max(6, Math.round((b.total / max) * 100));
                return (
                  <div
                    key={b.key}
                    className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                  >
                    <div className="pointer-events-none absolute bottom-[calc(100%+6px)] z-10 hidden w-max max-w-[140px] rounded-md border bg-popover px-2 py-1 text-xs shadow-md group-hover:block">
                      <p className="font-medium">{formatPrice(b.total)}</p>
                      <p className="text-muted-foreground">
                        {b.cantidad} pedido{b.cantidad === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div
                      className="w-full max-w-[48px] rounded-t-md bg-primary/85 transition-all group-hover:bg-primary"
                      style={{ height: `${h}%` }}
                      title={`${b.label}: ${formatPrice(b.total)}`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1.5 sm:gap-2">
              {barras.map((b) => (
                <div
                  key={b.key}
                  className="min-w-0 flex-1 text-center text-[10px] leading-tight text-muted-foreground sm:text-xs"
                >
                  <span className="block truncate">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
