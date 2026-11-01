"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type PedidoRow = {
  id: string;
  codigo?: string;
  estado?: string;
  updated_at?: string;
  created_at?: string;
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
  const router = useRouter();
  const [pedidoIds, setPedidoIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  /** Pedidos ya conocidos (baseline + alertados). No vuelven a alertar. */
  const known = useRef<Set<string>>(new Set());
  const ready = useRef(false);

  const addPedidos = useCallback(
    (ids: string[]) => {
      const fresh = ids.filter((id) => id && !known.current.has(id));
      if (fresh.length === 0) return;

      for (const id of fresh) known.current.add(id);

      setPedidoIds((prev) => {
        const merged = [...prev];
        for (const id of fresh) {
          if (!merged.includes(id)) merged.push(id);
        }
        return merged;
      });
      setOpen(true);
      beep();
      router.refresh();
    },
    [router]
  );

  const removePedido = useCallback((id: string) => {
    if (!id) return;
    setPedidoIds((prev) => prev.filter((x) => x !== id));
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | undefined;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function fetchPendienteIds(): Promise<string[]> {
      // API con cookie de sesión (más fiable que el cliente browser + RLS)
      try {
        const res = await fetch("/api/admin/pedidos-pendientes", {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!res.ok) return [];
        const data = (await res.json()) as { ids?: string[] };
        return data.ids || [];
      } catch {
        return [];
      }
    }

    async function start() {
      await supabase.auth.getSession();

      const baseline = await fetchPendienteIds();
      if (cancelled) return;

      for (const id of baseline) known.current.add(id);
      ready.current = true;

      channel = supabase
        .channel("admin-order-alerts")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "pedidos" },
          (payload) => {
            const row = (payload.new || {}) as PedidoRow;
            if (!row.id) return;

            if (row.estado === "COMPROBANTE_SUBIDO") {
              addPedidos([row.id]);
              return;
            }

            if (
              row.estado &&
              row.estado !== "COMPROBANTE_SUBIDO" &&
              row.estado !== "PENDIENTE_PAGO"
            ) {
              removePedido(row.id);
            }
          }
        )
        .on("broadcast", { event: "nuevo-pedido" }, ({ payload }) => {
          const id = (payload as { id?: string } | null)?.id;
          if (id) addPedidos([id]);
        })
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn("[OrderAlerts] realtime:", status);
          }
        });

      // Fallback cada 4s por si Realtime no llega
      pollTimer = setInterval(() => {
        if (!ready.current || cancelled) return;
        void fetchPendienteIds().then((ids) => {
          if (!cancelled) addPedidos(ids);
        });
      }, 4000);
    }

    void start();

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [addPedidos, removePedido]);

  useEffect(() => {
    if (pedidoIds.length === 0) setOpen(false);
  }, [pedidoIds.length]);

  function dismiss() {
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
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={dismiss}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
