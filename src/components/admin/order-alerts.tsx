"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";

type AlertPedido = {
  id: string;
  codigo: string;
  nombre: string;
  total: number;
  estado: string;
  created_at: string;
};

export function OrderAlerts({ adminPath }: { adminPath: string }) {
  const [alerts, setAlerts] = useState<AlertPedido[]>([]);
  const [open, setOpen] = useState(false);
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("admin-pedidos-alerts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pedidos" },
        (payload) => {
          const row = payload.new as AlertPedido;
          pushAlert(row);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "pedidos" },
        (payload) => {
          const row = payload.new as AlertPedido;
          if (row.estado === "COMPROBANTE_SUBIDO") {
            pushAlert(row);
          }
        }
      )
      .subscribe();

    function pushAlert(row: AlertPedido) {
      const key = `${row.id}-${row.estado}-${row.created_at}`;
      if (seen.current.has(key)) return;
      seen.current.add(key);
      setAlerts((prev) => [
        {
          id: row.id,
          codigo: row.codigo,
          nombre: row.nombre,
          total: Number(row.total),
          estado: row.estado,
          created_at: row.created_at,
        },
        ...prev,
      ].slice(0, 8));
      setOpen(true);
      try {
        // Beep suave
        const ctx = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.value = 0.05;
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } catch {
        // ignore
      }
    }

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  function dismiss(id: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  if (!open || alerts.length === 0) {
    return null;
  }

  const latest = alerts[0];

  return (
    <div className="fixed bottom-4 right-4 z-[60] w-[min(100%-2rem,380px)] space-y-2">
      <div className="animate-slide-up rounded-xl border bg-card p-4 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-accent/15 p-2 text-accent">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">Nueva actividad de compra</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Pedido <span className="font-mono font-medium text-foreground">{latest.codigo}</span>
                {" · "}
                {latest.nombre}
              </p>
              <p className="text-sm">
                {formatPrice(latest.total)} · {latest.estado.replaceAll("_", " ")}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-md p-1 hover:bg-muted"
            onClick={() => setOpen(false)}
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 flex gap-2">
          <Button asChild size="sm" className="flex-1">
            <Link href={`${adminPath}/pedidos/${latest.id}`}>Ver pedido</Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => dismiss(latest.id)}
          >
            Descartar
          </Button>
        </div>
        {alerts.length > 1 && (
          <p className="mt-2 text-xs text-muted-foreground">
            +{alerts.length - 1} alerta{alerts.length - 1 === 1 ? "" : "s"} más
          </p>
        )}
      </div>
    </div>
  );
}
