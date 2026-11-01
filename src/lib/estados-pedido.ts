import type { EstadoPedido } from "@/types/database";

export type EstadoSimple = "pendiente" | "confirmado" | "cancelado";

export function tipoEstadoSimple(estado: EstadoPedido): EstadoSimple {
  if (estado === "CONFIRMADO" || estado === "ENVIADO" || estado === "ENTREGADO") {
    return "confirmado";
  }
  if (estado === "CANCELADO" || estado === "RECHAZADO") {
    return "cancelado";
  }
  return "pendiente";
}

export function etiquetaEstadoSimple(estado: EstadoPedido): string {
  switch (tipoEstadoSimple(estado)) {
    case "confirmado":
      return "Confirmado";
    case "cancelado":
      return "Cancelado";
    default:
      return "Pendiente de confirmación";
  }
}
