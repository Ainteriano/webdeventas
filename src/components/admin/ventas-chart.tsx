"use client";

import { useMemo, useState } from "react";
import { formatPrice } from "@/lib/format";
import {
  agruparVentas,
  type PeriodoVentas,
  type VentaPunto,
} from "@/lib/ventas-chart";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const PERIODOS: { key: PeriodoVentas; label: string }[] = [
  { key: "dias", label: "Días" },
  { key: "semanas", label: "Semanas" },
  { key: "meses", label: "Meses" },
];

export function VentasChart({ puntos }: { puntos: VentaPunto[] }) {
  const [periodo, setPeriodo] = useState<PeriodoVentas>("dias");

  const barras = useMemo(
    () => agruparVentas(puntos, periodo),
    [puntos, periodo]
  );

  const max = Math.max(1, ...barras.map((b) => b.total));
  const totalPeriodo = barras.reduce((s, b) => s + b.total, 0);
  const cantidadPeriodo = barras.reduce((s, b) => s + b.cantidad, 0);
  const titulo =
    periodo === "dias"
      ? "Últimos 14 días"
      : periodo === "semanas"
        ? "Últimas 8 semanas"
        : "Últimos 12 meses";

  return (
    <Card>
      <CardHeader className="gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-lg">Ventas</CardTitle>
          <CardDescription>
            {titulo} · {cantidadPeriodo} pedido
            {cantidadPeriodo === 1 ? "" : "s"} · {formatPrice(totalPeriodo)}
          </CardDescription>
        </div>
        <div className="flex shrink-0 rounded-lg border bg-muted/40 p-1">
          {PERIODOS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriodo(p.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                periodo === p.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {cantidadPeriodo === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Aún no hay ventas en este período.
          </p>
        ) : (
          <div className="space-y-3">
            <div
              className="flex h-48 items-end gap-1.5 sm:gap-2"
              role="img"
              aria-label={`Gráfico de ventas por ${periodo}`}
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
