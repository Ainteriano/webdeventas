import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  COMPROBANTE_MIME,
  MAX_COMPROBANTE_BYTES,
} from "@/lib/validations";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { notifyCambioEstado } from "@/lib/email";
import type { EstadoPedido, Pedido } from "@/types/database";

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
    .select("*")
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
    .select("*")
    .single();

  if (updErr || !updated) {
    return NextResponse.json(
      { error: "No se pudo actualizar el pedido" },
      { status: 500 }
    );
  }

  void notifyCambioEstado(
    { ...updated, total: Number(updated.total) } as Pedido,
    estadoAnterior
  );

  return NextResponse.json({
    ok: true,
    mensaje: "En espera de confirmación",
    pedido: {
      id: updated.id,
      codigo: updated.codigo,
      estado: updated.estado,
    },
  });
}
