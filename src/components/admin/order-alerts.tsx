"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type PedidoRow = {
  id: string;
  codigo?: string;
  estado?: string;
};

function beep() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.06;
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch {
    /* ignore */
  }
}

export function OrderAlerts({ adminPath }: { adminPath: string }) {
  const [pedidoIds, setPedidoIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();

    function addPedido(id: string) {
      if (!id || seen.current.has(id)) return;
      seen.current.add(id);
      setPedidoIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      setOpen(true);
      beep();
    }

    function removePedido(id: string) {
      if (!id) return;
      seen.current.delete(id);
      setPedidoIds((prev) => prev.filter((x) => x !== id));
    }

    const channel = supabase
      .channel("admin-pedidos-alerts")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "pedidos" },
        (payload) => {
          const row = payload.new as PedidoRow;
          const prev = payload.old as PedidoRow | undefined;

          // Compra completada = comprobante subido
          if (
            row.estado === "COMPROBANTE_SUBIDO" &&
            prev?.estado !== "COMPROBANTE_SUBIDO"
          ) {
            addPedido(row.id);
            return;
          }

          // Ya no está pendiente → quitar de la alerta acumulada
          if (
            row.estado &&
            row.estado !== "COMPROBANTE_SUBIDO" &&
            row.estado !== "PENDIENTE_PAGO"
          ) {
            removePedido(row.id);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  // Si se vacía la lista, cerrar popup
  useEffect(() => {
    if (pedidoIds.length === 0) setOpen(false);
  }, [pedidoIds.length]);

  function dismiss() {
    // Cierra y limpia el contador; los mismos pedidos no vuelven a alertar.
    // Un pedido nuevo sí abrirá de nuevo el popup.
    setOpen(false);
    setPedidoIds([]);
  }

  if (!open || pedidoIds.length === 0) return null;

  const count = pedidoIds.length;
  const titulo =
    count === 1
      ? "Tienes 1 nuevo pedido"
      : `Tienes ${count} nuevos pedidos`;
  const href =
    count === 1
      ? `${adminPath}/pedidos/${pedidoIds[0]}`
      : `${adminPath}/pedidos?estado=pendiente`;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nuevo-pedido-titulo"
    >
      <div className="w-full max-w-sm animate-fade-in rounded-2xl border bg-card p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-accent/15 p-2.5 text-accent">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <p
                id="nuevo-pedido-titulo"
                className="font-display text-xl font-semibold leading-tight"
              >
                {titulo}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {count === 1
                  ? "Un cliente completó la compra y subió el comprobante."
                  : "Hay pedidos pendientes de confirmación."}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-md p-1 hover:bg-muted"
            onClick={dismiss}
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button asChild className="flex-1">
            <Link href={href} onClick={dismiss}>
              {count === 1 ? "Ver pedido" : "Ver pedidos"}
            </Link>
          </Button>
          <Button type="button" variant="outline" className="flex-1" onClick={dismiss}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
