import type { EstadoPedido } from "@/types/database";

export function formatPrice(value: number | string): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("es-HN", {
    style: "currency",
    currency: "HNL",
  }).format(Number.isFinite(n) ? n : 0);
}

export const ESTADO_LABELS: Record<EstadoPedido, string> = {
  PENDIENTE_PAGO: "Pendiente de pago",
  COMPROBANTE_SUBIDO: "Comprobante subido",
  CONFIRMADO: "Confirmado",
  RECHAZADO: "Rechazado",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};
