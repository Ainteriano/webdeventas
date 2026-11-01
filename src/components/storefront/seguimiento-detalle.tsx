"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { ComprobanteUpload } from "@/components/storefront/comprobante-upload";

type PedidoSeguimiento = {
  id: string;
  codigo: string;
  nombre: string;
  estado: string;
  estado_label: string;
  total: number;
  metodo_pago: string;
  motivo_rechazo: string | null;
  created_at: string;
  payment_url: string | null;
  items: { nombre: string; precio: number; cantidad: number; talla?: string }[];
};

export function SeguimientoDetalle({ codigo }: { codigo: string }) {
  const [pedido, setPedido] = useState<PedidoSeguimiento | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/seguimiento/${encodeURIComponent(codigo)}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "No se encontró el pedido");
        setPedido(null);
      } else {
        setPedido(json.pedido);
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigo]);

  if (loading) {
    return <p className="text-muted-foreground">Cargando…</p>;
  }

  if (error || !pedido) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
        {error || "Pedido no encontrado"}
      </div>
    );
  }

  const puedeResubir = pedido.estado === "RECHAZADO";

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Código</p>
            <p className="font-mono text-lg font-semibold">{pedido.codigo}</p>
          </div>
          <Badge
            variant={
              pedido.estado === "RECHAZADO"
                ? "destructive"
                : pedido.estado === "CONFIRMADO" ||
                    pedido.estado === "ENTREGADO"
                  ? "success"
                  : "warning"
            }
          >
            {pedido.estado_label}
          </Badge>
        </div>
        <p className="mt-4 text-sm">
          Hola <strong>{pedido.nombre}</strong>, total{" "}
          <strong>{formatPrice(pedido.total)}</strong>
        </p>
        {pedido.estado === "COMPROBANTE_SUBIDO" && (
          <p className="mt-2 text-sm text-amber-800">
            En espera de confirmación
          </p>
        )}
        {pedido.motivo_rechazo && (
          <p className="mt-2 rounded-md bg-destructive/10 p-3 text-sm">
            Motivo del rechazo: {pedido.motivo_rechazo}
          </p>
        )}
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-medium">Artículos</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {pedido.items.map((item, i) => (
            <li key={i} className="flex justify-between gap-4">
              <span>
                {item.nombre}
                {item.talla ? ` · Talla ${item.talla}` : ""} × {item.cantidad}
              </span>
              <span>{formatPrice(item.precio * item.cantidad)}</span>
            </li>
          ))}
        </ul>
      </div>

      {puedeResubir && (
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-medium">Volver a subir comprobante</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            JPG, PNG o PDF · máximo 5 MB
          </p>
          <div className="mt-4">
            <ComprobanteUpload
              pedidoId={pedido.id}
              onSuccess={() => void load()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
