"use client";

import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { formatPrice } from "@/lib/format";
import {
  agruparVentasRango,
  formatRangoLabel,
  presetHoy,
  type VentaPunto,
} from "@/lib/ventas-chart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DateRangeCalendar } from "@/components/admin/date-range-calendar";

export function VentasChart({ puntos }: { puntos: VentaPunto[] }) {
  const inicial = presetHoy();
  const [from, setFrom] = useState(inicial.from);
  const [to, setTo] = useState(inicial.to);
  const [showCal, setShowCal] = useState(false);

  const barras = useMemo(
    () => agruparVentasRango(puntos, from, to),
    [puntos, from, to]
  );

  const max = Math.max(1, ...barras.map((b) => b.total));
  const totalPeriodo = barras.reduce((s, b) => s + b.total, 0);
  const cantidadPeriodo = barras.reduce((s, b) => s + b.cantidad, 0);

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
          <Button
            type="button"
            variant={showCal ? "default" : "outline"}
            size="sm"
            onClick={() => setShowCal((v) => !v)}
          >
            <CalendarDays className="h-4 w-4" />
            {showCal ? "Cerrar" : "Elegir fechas"}
          </Button>
        </div>

        {showCal && (
          <DateRangeCalendar
            initialFrom={from}
            initialTo={to}
            maxDate={new Date()}
            onAccept={(f, t) => {
              setFrom(f);
              setTo(t);
              setShowCal(false);
            }}
            onCancel={() => setShowCal(false)}
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
