import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAdminPath } from "@/lib/admin";
import { formatPrice } from "@/lib/format";
import { formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VentasChart } from "@/components/admin/ventas-chart";
import type { Pedido, Producto } from "@/types/database";

export default async function AdminDashboardPage() {
  const supabase = createClient();
  const adminPath = getAdminPath();

  const desde = new Date();
  desde.setMonth(desde.getMonth() - 12);
  desde.setDate(1);
  desde.setHours(0, 0, 0, 0);

  const [{ data: porConfirmar }, { data: sinStock }, { data: ventasRaw }] =
    await Promise.all([
      supabase
        .from("pedidos")
        .select("id, codigo, nombre, total, created_at, estado")
        .eq("estado", "COMPROBANTE_SUBIDO")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("productos")
        .select("id, nombre, stock, precio, activo")
        .eq("activo", true)
        .lte("stock", 0)
        .order("nombre")
        .limit(10),
      supabase
        .from("pedidos")
        .select("created_at, total, estado")
        .in("estado", [
          "COMPROBANTE_SUBIDO",
          "CONFIRMADO",
          "ENVIADO",
          "ENTREGADO",
        ])
        .gte("created_at", desde.toISOString())
        .order("created_at", { ascending: true }),
    ]);

  const pedidosPendientes = (porConfirmar || []) as Pedido[];
  const productosSinStock = (sinStock || []) as Producto[];
  const puntosVentas = (ventasRaw || []).map((p) => ({
    created_at: p.created_at as string,
    total: Number(p.total) || 0,
    estado: p.estado as string,
  }));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Inicio</h1>

      <VentasChart puntos={puntosVentas} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Por confirmar</CardDescription>
            <CardTitle className="text-3xl">
              {pedidosPendientes.length}
              {pedidosPendientes.length >= 10 ? "+" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Pedidos con comprobante subido
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sin stock</CardDescription>
            <CardTitle className="text-3xl">
              {productosSinStock.length}
              {productosSinStock.length >= 10 ? "+" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Productos activos con stock 0
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-lg">Pedidos por confirmar</CardTitle>
              <CardDescription>Pendiente de confirmación</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`${adminPath}/pedidos?estado=pendiente`}>
                Ver todos
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {pedidosPendientes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay pedidos pendientes de confirmación.
              </p>
            ) : (
              pedidosPendientes.map((p) => (
                <Link
                  key={p.id}
                  href={`${adminPath}/pedidos/${p.id}`}
                  className="flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 transition-colors hover:bg-muted/60"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.codigo}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {p.nombre} · {formatDate(p.created_at)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-medium">{formatPrice(p.total)}</p>
                    <Badge variant="warning" className="mt-1">
                      Comprobante
                    </Badge>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-lg">Productos sin stock</CardTitle>
              <CardDescription>Activos con inventario en cero</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`${adminPath}/productos?stock=0`}>Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {productosSinStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Todos los productos activos tienen stock.
              </p>
            ) : (
              productosSinStock.map((p) => (
                <Link
                  key={p.id}
                  href={`${adminPath}/productos/${p.id}`}
                  className="flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 transition-colors hover:bg-muted/60"
                >
                  <p className="truncate font-medium">{p.nombre}</p>
                  <Badge variant="destructive">Stock 0</Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
