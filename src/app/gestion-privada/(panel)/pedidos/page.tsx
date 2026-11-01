import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAdminPath } from "@/lib/admin";
import { formatPrice } from "@/lib/format";
import { formatDate, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { EstadoPedido, Pedido } from "@/types/database";
import { etiquetaEstadoSimple, tipoEstadoSimple } from "@/lib/estados-pedido";

type Filtro = "TODOS" | "pendiente" | "confirmado" | "cancelado";

const FILTROS: { key: Filtro; label: string }[] = [
  { key: "TODOS", label: "Todos" },
  { key: "pendiente", label: "Pendiente de confirmación" },
  { key: "confirmado", label: "Confirmado" },
  { key: "cancelado", label: "Cancelado" },
];

const ESTADOS_POR_FILTRO: Record<Exclude<Filtro, "TODOS">, EstadoPedido[]> = {
  pendiente: ["COMPROBANTE_SUBIDO", "PENDIENTE_PAGO"],
  confirmado: ["CONFIRMADO", "ENVIADO", "ENTREGADO"],
  cancelado: ["CANCELADO", "RECHAZADO"],
};

function badgeVariant(
  estado: EstadoPedido
): "default" | "secondary" | "destructive" | "success" | "warning" | "outline" {
  switch (tipoEstadoSimple(estado)) {
    case "pendiente":
      return "warning";
    case "confirmado":
      return "success";
    case "cancelado":
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
  const raw = searchParams.estado || "TODOS";
  const filtro: Filtro = FILTROS.some((f) => f.key === raw)
    ? (raw as Filtro)
    : "TODOS";

  let query = supabase
    .from("pedidos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (filtro !== "TODOS") {
    query = query.in("estado", ESTADOS_POR_FILTRO[filtro]);
  }

  const { data } = await query;
  const pedidos = ((data || []) as Pedido[]).map((p) => ({
    ...p,
    total: Number(p.total),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Pedidos</h1>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTROS.map((f) => {
          const href =
            f.key === "TODOS"
              ? `${adminPath}/pedidos`
              : `${adminPath}/pedidos?estado=${f.key}`;
          const active = filtro === f.key;
          return (
            <Link
              key={f.key}
              href={href}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card hover:bg-muted"
              )}
            >
              {f.label}
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
                {etiquetaEstadoSimple(p.estado)}
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
                    {etiquetaEstadoSimple(p.estado)}
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
