import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminPath } from "@/lib/admin";
import { formatPrice } from "@/lib/format";
import { etiquetaEstadoSimple } from "@/lib/estados-pedido";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Pedido } from "@/types/database";
import { PedidoAcciones } from "./pedido-acciones";

export default async function PedidoDetallePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const admin = createAdminClient();
  const adminPath = getAdminPath();

  const { data } = await supabase
    .from("pedidos")
    .select("*, pedido_items(*)")
    .eq("id", params.id)
    .maybeSingle();

  if (!data) notFound();

  let comprobanteUrl: string | null = null;
  if (data.comprobante_path) {
    const { data: signed } = await admin.storage
      .from("comprobantes")
      .createSignedUrl(data.comprobante_path, 60 * 10);
    comprobanteUrl = signed?.signedUrl || null;
  }

  const pedido = {
    ...data,
    total: Number(data.total),
    pedido_items: (data.pedido_items || []).map(
      (i: {
        precio_snapshot: number | string;
        cantidad: number;
        id: string;
        nombre_snapshot: string;
        talla_snapshot?: string;
      }) => ({
        ...i,
        precio_snapshot: Number(i.precio_snapshot),
      })
    ),
  } as Pedido;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
            <Link href={`${adminPath}/pedidos`}>← Pedidos</Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">
            {pedido.codigo}
          </h1>
          <p className="text-muted-foreground">
            {formatDate(pedido.created_at)}
          </p>
        </div>
        <Badge className="text-sm">{etiquetaEstadoSimple(pedido.estado)}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Acciones</CardTitle>
        </CardHeader>
        <CardContent>
          <PedidoAcciones
            pedido={pedido}
            initialComprobanteUrl={comprobanteUrl}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cliente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Nombre</p>
            <p className="font-medium">{pedido.nombre}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Teléfono</p>
            <p className="font-medium">{pedido.telefono}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Correo</p>
            <p className="font-medium break-all">{pedido.correo}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Banco</p>
            <p className="font-medium">{pedido.banco || "—"}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-muted-foreground">Dirección</p>
            <p className="font-medium">{pedido.direccion || "—"}</p>
          </div>
          {pedido.motivo_rechazo && (
            <div className="sm:col-span-2">
              <p className="text-muted-foreground">Motivo</p>
              <p className="font-medium text-destructive">
                {pedido.motivo_rechazo}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Artículos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(pedido.pedido_items || []).map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 border-b pb-3 last:border-0 last:pb-0"
            >
              <div>
                <p className="font-medium">{item.nombre_snapshot}</p>
                <p className="text-sm text-muted-foreground">
                  {item.talla_snapshot ? `Talla ${item.talla_snapshot} · ` : ""}
                  {item.cantidad} × {formatPrice(item.precio_snapshot)}
                </p>
              </div>
              <p className="font-medium">
                {formatPrice(item.cantidad * item.precio_snapshot)}
              </p>
            </div>
          ))}
          <div className="flex justify-between pt-2 text-base font-semibold">
            <span>Total</span>
            <span>{formatPrice(pedido.total)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
