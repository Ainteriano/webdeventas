import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { seguimientoSchema } from "@/lib/validations";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { ESTADO_LABELS } from "@/lib/format";

/**
 * Seguimiento por código: solo service role, devuelve ÚNICAMENTE ese pedido.
 * No lista otros pedidos.
 */
export async function GET(
  request: Request,
  { params }: { params: { codigo: string } }
) {
  const ip = getClientIp(request);
  const rl = rateLimit(`seguimiento:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
  }

  const parsed = seguimientoSchema.safeParse({
    codigo: params.codigo.toUpperCase(),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: pedido, error } = await admin
    .from("pedidos")
    .select(
      "id, codigo, nombre, estado, total, metodo_pago, motivo_rechazo, created_at, payment_url"
    )
    .eq("codigo", parsed.data.codigo)
    .maybeSingle();

  if (error || !pedido) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  const { data: items } = await admin
    .from("pedido_items")
    .select("nombre_snapshot, precio_snapshot, cantidad, talla_snapshot")
    .eq("pedido_id", pedido.id);

  return NextResponse.json({
    pedido: {
      id: pedido.id,
      codigo: pedido.codigo,
      nombre: pedido.nombre,
      estado: pedido.estado,
      estado_label: ESTADO_LABELS[pedido.estado as keyof typeof ESTADO_LABELS],
      total: Number(pedido.total),
      metodo_pago: pedido.metodo_pago,
      motivo_rechazo: pedido.motivo_rechazo,
      created_at: pedido.created_at,
      payment_url: pedido.payment_url,
      items: (items || []).map((i) => ({
        nombre: i.nombre_snapshot,
        precio: Number(i.precio_snapshot),
        cantidad: i.cantidad,
        talla: i.talla_snapshot || "",
      })),
    },
  });
}
