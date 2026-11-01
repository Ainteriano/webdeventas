import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  COMPROBANTE_MIME,
  MAX_COMPROBANTE_BYTES,
} from "@/lib/validations";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getAdminPath } from "@/lib/admin";
import { notifyCambioEstado } from "@/lib/email";
import { notifyAdminNuevoPedido } from "@/lib/admin-notify";
import type { EstadoPedido, Pedido } from "@/types/database";

/**
 * Completar compra = subir comprobante.
 * Aquí se reserva el stock (FOR UPDATE). Iniciar el pedido NO reserva.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const ip = getClientIp(request);
  const rl = rateLimit(`comprobante:${ip}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes" },
      { status: 429 }
    );
  }

  const pedidoId = params.id;
  const admin = createAdminClient();

  const { data: pedido, error } = await admin
    .from("pedidos")
    .select("*, pedido_items(*)")
    .eq("id", pedidoId)
    .maybeSingle();

  if (error || !pedido) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  if (!["PENDIENTE_PAGO", "RECHAZADO"].includes(pedido.estado)) {
    return NextResponse.json(
      { error: "Este pedido no admite comprobante en su estado actual" },
      { status: 400 }
    );
  }

  const form = await request.formData();
  const file = form.get("file") || form.get("comprobante");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  }

  if (file.size > MAX_COMPROBANTE_BYTES) {
    return NextResponse.json(
      { error: "El archivo supera 5 MB" },
      { status: 400 }
    );
  }

  if (!(COMPROBANTE_MIME as readonly string[]).includes(file.type)) {
    return NextResponse.json(
      { error: "Solo se permiten JPG, PNG o PDF" },
      { status: 400 }
    );
  }

  // Reservar stock SOLO al completar (subir comprobante). Atómico con FOR UPDATE.
  const { error: reserveErr } = await admin.rpc("reservar_stock_pedido", {
    p_pedido_id: pedidoId,
  });

  if (reserveErr) {
    console.error(reserveErr);
    return NextResponse.json(
      {
        error:
          "No hay stock suficiente. Otro cliente completó la compra de este producto primero.",
      },
      { status: 409 }
    );
  }

  const ext =
    file.type === "application/pdf"
      ? "pdf"
      : file.type.includes("png")
        ? "png"
        : "jpg";
  const path = `${pedido.codigo}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await admin.storage
    .from("comprobantes")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (upErr) {
    await admin.rpc("liberar_stock_pedido", { p_pedido_id: pedidoId });
    console.error(upErr);
    return NextResponse.json(
      { error: "No se pudo subir el comprobante" },
      { status: 500 }
    );
  }

  const estadoAnterior = pedido.estado as EstadoPedido;

  const { data: updated, error: updErr } = await admin
    .from("pedidos")
    .update({
      comprobante_path: path,
      estado: "COMPROBANTE_SUBIDO",
      motivo_rechazo: null,
    })
    .eq("id", pedidoId)
    .select("*, pedido_items(*)")
    .single();

  if (updErr || !updated) {
    await admin.rpc("liberar_stock_pedido", { p_pedido_id: pedidoId });
    return NextResponse.json(
      { error: "No se pudo actualizar el pedido" },
      { status: 500 }
    );
  }

  // Catálogo: producto pasa a No disponible si stock llegó a 0
  const adminPath = getAdminPath();
  revalidatePath("/");
  revalidatePath("/catalogo");
  revalidatePath(adminPath);
  revalidatePath(`${adminPath}/pedidos`);

  void notifyCambioEstado(
    { ...updated, total: Number(updated.total) } as Pedido,
    estadoAnterior
  );

  // Alerta inmediata al panel admin (no depende de RLS en postgres_changes)
  void notifyAdminNuevoPedido({
    id: updated.id,
    codigo: updated.codigo,
  });

  const { data: config } = await admin
    .from("configuracion_sitio")
    .select("nombre_negocio, direccion, whatsapp, horarios")
    .eq("id", 1)
    .maybeSingle();

  const items = (updated.pedido_items || []).map(
    (i: {
      nombre_snapshot: string;
      precio_snapshot: number;
      cantidad: number;
      talla_snapshot?: string;
    }) => ({
      nombre: i.nombre_snapshot,
      precio: Number(i.precio_snapshot),
      cantidad: i.cantidad,
      talla: i.talla_snapshot || "",
    })
  );

  return NextResponse.json({
    ok: true,
    mensaje: "En espera de confirmación",
    pedido: {
      id: updated.id,
      codigo: updated.codigo,
      nombre: updated.nombre,
      telefono: updated.telefono,
      correo: updated.correo,
      direccion: updated.direccion,
      notas: updated.notas,
      banco: updated.banco,
      total: Number(updated.total),
      estado: updated.estado,
      metodo_pago: updated.metodo_pago,
      created_at: updated.created_at,
      items,
    },
    comercio: {
      nombre_negocio: config?.nombre_negocio || "American Shoes",
      direccion: config?.direccion || "",
      whatsapp: config?.whatsapp || "",
      horarios: config?.horarios || "",
    },
  });
}
