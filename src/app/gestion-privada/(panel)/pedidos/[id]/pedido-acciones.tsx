"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Pedido } from "@/types/database";
import {
  actualizarEstadoPedidoAction,
  confirmarPedidoAction,
  getComprobanteSignedUrl,
  rechazarPedidoAction,
} from "../actions";

export function PedidoAcciones({ pedido }: { pedido: Pedido }) {
  const router = useRouter();
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [comprobanteUrl, setComprobanteUrl] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<{ error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  const puedeConfirmar = [
    "COMPROBANTE_SUBIDO",
    "PENDIENTE_PAGO",
    "RECHAZADO",
  ].includes(pedido.estado);

  const puedeRechazar = ["COMPROBANTE_SUBIDO", "PENDIENTE_PAGO"].includes(
    pedido.estado
  );

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {pedido.comprobante_path && (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                const res = await getComprobanteSignedUrl(pedido.id);
                if (res.error) setError(res.error);
                else if (res.url) {
                  setComprobanteUrl(res.url);
                  window.open(res.url, "_blank", "noopener,noreferrer");
                }
              })
            }
          >
            Ver comprobante
          </Button>
        )}

        {puedeConfirmar && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" disabled={pending}>
                Confirmar pedido
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Confirmar pedido?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se descontará el stock con la función transaccional
                  confirmar_pedido.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => run(() => confirmarPedidoAction(pedido.id))}
                >
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {pedido.estado === "CONFIRMADO" && (
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() =>
              run(() =>
                actualizarEstadoPedidoAction({
                  pedido_id: pedido.id,
                  estado: "ENVIADO",
                })
              )
            }
          >
            Marcar enviado
          </Button>
        )}

        {pedido.estado === "ENVIADO" && (
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() =>
              run(() =>
                actualizarEstadoPedidoAction({
                  pedido_id: pedido.id,
                  estado: "ENTREGADO",
                })
              )
            }
          >
            Marcar entregado
          </Button>
        )}
      </div>

      {puedeRechazar && (
        <div className="space-y-2 border-t pt-4">
          <Label htmlFor="motivo">Rechazar con motivo</Label>
          <Textarea
            id="motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej. Comprobante ilegible o monto incorrecto"
            rows={3}
          />
          <Button
            type="button"
            variant="destructive"
            disabled={pending || motivo.trim().length < 3}
            onClick={() =>
              run(() =>
                rechazarPedidoAction({
                  pedido_id: pedido.id,
                  motivo: motivo.trim(),
                })
              )
            }
          >
            Rechazar
          </Button>
        </div>
      )}

      {comprobanteUrl && (
        <p className="text-xs text-muted-foreground">
          URL firmada (~10 min). Si no se abrió,{" "}
          <a
            href={comprobanteUrl}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            ábrela aquí
          </a>
          .
        </p>
      )}
    </div>
  );
}
