"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Pedido } from "@/types/database";
import {
  actualizarEstadoPedidoAction,
  confirmarPedidoAction,
  getComprobanteSignedUrl,
} from "../actions";

export function PedidoAcciones({
  pedido,
  initialComprobanteUrl = null,
}: {
  pedido: Pedido;
  initialComprobanteUrl?: string | null;
}) {
  const router = useRouter();
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [comprobanteUrl, setComprobanteUrl] = useState<string | null>(
    initialComprobanteUrl
  );
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setComprobanteUrl(initialComprobanteUrl);
  }, [initialComprobanteUrl, pedido.id]);

  function run(fn: () => Promise<{ error?: string }>, successMsg: string) {
    setError(null);
    setOkMsg(null);
    startTransition(async () => {
      const res = await fn();
      if (res.error) setError(res.error);
      else {
        setOkMsg(successMsg);
        router.refresh();
      }
    });
  }

  const estado = String(pedido.estado || "");
  const puedeConfirmar = [
    "COMPROBANTE_SUBIDO",
    "PENDIENTE_PAGO",
    "RECHAZADO",
  ].includes(estado);
  const puedeCancelar = ![
    "CANCELADO",
    "RECHAZADO",
    "ENTREGADO",
  ].includes(estado);
  const tieneComprobante = Boolean(pedido.comprobante_path);

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {okMsg && (
        <p className="rounded-md bg-emerald-100 px-3 py-2 text-sm text-emerald-800">
          {okMsg}
        </p>
      )}

      {tieneComprobante && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Comprobante</p>
          {comprobanteUrl ? (
            <a
              href={comprobanteUrl}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-lg border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={comprobanteUrl}
                alt="Comprobante de pago"
                className="max-h-80 w-full object-contain bg-muted"
              />
            </a>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  const res = await getComprobanteSignedUrl(pedido.id);
                  if (res.error) setError(res.error);
                  else if (res.url) setComprobanteUrl(res.url);
                })
              }
            >
              Cargar comprobante
            </Button>
          )}
          {comprobanteUrl && (
            <Button asChild variant="outline" size="sm">
              <a href={comprobanteUrl} target="_blank" rel="noreferrer">
                Abrir en nueva pestaña
              </a>
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t pt-4">
        {puedeConfirmar && (
          <Button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!window.confirm("¿Confirmar este pedido?")) return;
              run(() => confirmarPedidoAction(pedido.id), "Pedido confirmado");
            }}
          >
            Confirmar
          </Button>
        )}

        {puedeCancelar && (
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={() => {
              if (!window.confirm("¿Cancelar este pedido?")) return;
              run(
                () =>
                  actualizarEstadoPedidoAction({
                    pedido_id: pedido.id,
                    estado: "CANCELADO",
                    motivo: motivo.trim() || "Cancelado por administrador",
                  }),
                "Pedido cancelado"
              );
            }}
          >
            Cancelar
          </Button>
        )}
      </div>

      {puedeCancelar && (
        <div className="space-y-2">
          <Label htmlFor="motivo">Motivo de cancelación (opcional)</Label>
          <Textarea
            id="motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={2}
          />
        </div>
      )}
    </div>
  );
}
