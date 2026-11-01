import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAdminPath } from "@/lib/admin";
import { ESTADO_LABELS, formatPrice } from "@/lib/format";
import { formatDate, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { EstadoPedido, Pedido } from "@/types/database";

const ESTADOS: (EstadoPedido | "TODOS")[] = [
  "TODOS",
  "COMPROBANTE_SUBIDO",
  "PENDIENTE_PAGO",
  "CONFIRMADO",
  "ENVIADO",
  "ENTREGADO",
  "RECHAZADO",
  "CANCELADO",
];

function badgeVariant(
  estado: EstadoPedido
): "default" | "secondary" | "destructive" | "success" | "warning" | "outline" {
  switch (estado) {
    case "COMPROBANTE_SUBIDO":
      return "warning";
    case "CONFIRMADO":
    case "ENVIADO":
    case "ENTREGADO":
      return "success";
    case "RECHAZADO":
    case "CANCELADO":
      return "destructive";
    default:
      return "secondary";
  }
}

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: { estado?: string };
}) {
  const supabase = createClient();
  const adminPath = getAdminPath();
  const estado = (searchParams.estado || "TODOS") as EstadoPedido | "TODOS";

  let query = supabase
    .from("pedidos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (estado !== "TODOS") {
    query = query.eq("estado", estado);
  }

  const { data } = await query;
  const pedidos = ((data || []) as Pedido[]).map((p) => ({
    ...p,
    total: Number(p.total),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Pedidos
        </h1>
        <p className="text-muted-foreground">
          Lista filtrable por estado. Abre un pedido para confirmar o rechazar.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {ESTADOS.map((e) => {
          const href =
            e === "TODOS"
              ? `${adminPath}/pedidos`
              : `${adminPath}/pedidos?estado=${e}`;
          const active = estado === e;
          return (
            <Link
              key={e}
              href={href}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card hover:bg-muted"
              )}
            >
              {e === "TODOS" ? "Todos" : ESTADO_LABELS[e]}
            </Link>
          );
        })}
      </div>

      <div className="space-y-3 md:hidden">
        {pedidos.map((p) => (
          <Link
            key={p.id}
            href={`${adminPath}/pedidos/${p.id}`}
            className="block rounded-lg border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{p.codigo}</p>
                <p className="text-sm text-muted-foreground">{p.nombre}</p>
              </div>
              <Badge variant={badgeVariant(p.estado)}>
                {ESTADO_LABELS[p.estado]}
              </Badge>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span>{formatDate(p.created_at)}</span>
              <span className="font-medium">{formatPrice(p.total)}</span>
            </div>
          </Link>
        ))}
        {pedidos.length === 0 && (
          <p className="text-sm text-muted-foreground">No hay pedidos.</p>
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Código</th>
              <th className="p-3">Cliente</th>
              <th className="p-3">Fecha</th>
              <th className="p-3">Método</th>
              <th className="p-3">Estado</th>
              <th className="p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((p) => (
              <tr key={p.id} className="border-t hover:bg-muted/30">
                <td className="p-3">
                  <Link
                    href={`${adminPath}/pedidos/${p.id}`}
                    className="font-medium hover:underline"
                  >
                    {p.codigo}
                  </Link>
                </td>
                <td className="p-3">
                  <div>{p.nombre}</div>
                  <div className="text-xs text-muted-foreground">{p.correo}</div>
                </td>
                <td className="p-3 text-muted-foreground">
                  {formatDate(p.created_at)}
                </td>
                <td className="p-3">{p.metodo_pago}</td>
                <td className="p-3">
                  <Badge variant={badgeVariant(p.estado)}>
                    {ESTADO_LABELS[p.estado]}
                  </Badge>
                </td>
                <td className="p-3 text-right font-medium">
                  {formatPrice(p.total)}
                </td>
              </tr>
            ))}
            {pedidos.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="p-6 text-center text-muted-foreground"
                >
                  No hay pedidos con ese filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
