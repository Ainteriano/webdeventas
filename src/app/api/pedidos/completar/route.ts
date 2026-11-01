import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  checkoutSchema,
  COMPROBANTE_MIME,
  MAX_COMPROBANTE_BYTES,
} from "@/lib/validations";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getAdminPath } from "@/lib/admin";
import { notifyPedidoCreado } from "@/lib/email";
import { notifyAdminNuevoPedido } from "@/lib/admin-notify";
import type { Pedido } from "@/types/database";

/**
 * Completa la compra en un solo paso:
 * crea el pedido + sube comprobante + reserva stock.
 * Si el cliente abandona antes, no queda ningún registro en admin.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit(`completar:${ip}`, 8, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta más tarde." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Formulario inválido" }, { status: 400 });
  }

  const file = form.get("comprobante") || form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Debes subir la foto del comprobante" },
      { status: 400 }
    );
  }
  if (file.size > MAX_COMPROBANTE_BYTES) {
    return NextResponse.json(
      { error: "La foto no debe superar 5 MB" },
      { status: 400 }
    );
  }
  if (!(COMPROBANTE_MIME as readonly string[]).includes(file.type)) {
    return NextResponse.json(
      { error: "Solo se permiten fotos JPG, PNG o WEBP" },
      { status: 400 }
    );
  }

  let checkoutRaw: unknown;
  try {
    const raw = form.get("checkout");
    checkoutRaw = typeof raw === "string" ? JSON.parse(raw) : null;
  } catch {
    return NextResponse.json({ error: "Datos de compra inválidos" }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(checkoutRaw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  if (data.metodo_pago !== "TRANSFERENCIA") {
    return NextResponse.json(
      { error: "Este flujo solo aplica a transferencia / depósito" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  try {
    await admin.rpc("liberar_pedidos_expirados", { p_minutos: 45 });
  } catch {
    /* opcional */
  }

  // Cancelar borradores viejos incompletos (si quedaran de versiones anteriores)
  await admin
    .from("pedidos")
    .update({
      estado: "CANCELADO",
      motivo_rechazo: "Intento incompleto reemplazado",
    })
    .eq("correo", data.correo.trim().toLowerCase())
    .eq("estado", "PENDIENTE_PAGO")
    .eq("stock_reservado", false);

  await admin
    .from("pedidos")
    .update({
      estado: "CANCELADO",
      motivo_rechazo: "Intento incompleto reemplazado",
    })
    .eq("telefono", data.telefono.trim())
    .eq("estado", "PENDIENTE_PAGO")
    .eq("stock_reservado", false);

  const ids = data.items.map((i) => i.producto_id);
  const { data: productos, error: prodErr } = await admin
    .from("productos")
    .select("id, nombre, precio, stock, talla, disponible, activo")
    .in("id", ids);

  if (prodErr || !productos) {
    return NextResponse.json(
      { error: "No se pudieron validar los productos" },
      { status: 500 }
    );
  }

  const byId = new Map(productos.map((p) => [p.id, p]));
  const lineas: {
    producto_id: string;
    nombre_snapshot: string;
    precio_snapshot: number;
    cantidad: number;
    talla_snapshot: string;
  }[] = [];
  let total = 0;

  for (const item of data.items) {
    const p = byId.get(item.producto_id);
    if (!p || !p.activo || !p.disponible) {
      return NextResponse.json(
        { error: "Producto no disponible" },
        { status: 400 }
      );
    }
    if (p.stock < item.cantidad) {
      return NextResponse.json(
        {
          error: `Stock insuficiente para "${p.nombre}" (disponible: ${p.stock})`,
        },
        { status: 409 }
      );
    }
    const precio = Number(p.precio);
    lineas.push({
      producto_id: p.id,
      nombre_snapshot: p.nombre,
      precio_snapshot: precio,
      cantidad: item.cantidad,
      talla_snapshot: (p as { talla?: string }).talla || "",
    });
    total += precio * item.cantidad;
  }

  const { data: codigoRow } = await admin.rpc("generar_codigo_pedido");
  const codigo =
    typeof codigoRow === "string"
      ? codigoRow
      : `PED-${Date.now().toString(36).toUpperCase()}`;

  const ext = file.type.includes("png")
    ? "png"
    : file.type.includes("webp")
      ? "webp"
      : "jpg";
  const path = `${codigo}/${Date.now()}.${ext}`;
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

  const { data: pedido, error: pedErr } = await admin
    .from("pedidos")
    .insert({
      codigo,
      nombre: data.nombre,
      telefono: data.telefono,
      correo: data.correo.trim().toLowerCase(),
      direccion: data.direccion?.trim() || "",
      notas: "",
      banco: data.banco,
      total,
      metodo_pago: data.metodo_pago,
      estado: "COMPROBANTE_SUBIDO",
      comprobante_path: path,
      stock_reservado: false,
    })
    .select("*")
    .single();

  if (pedErr || !pedido) {
    await admin.storage.from("comprobantes").remove([path]);
    console.error(pedErr);
    return NextResponse.json(
      { error: "No se pudo registrar el pedido" },
      { status: 500 }
    );
  }

  const { error: itemsErr } = await admin.from("pedido_items").insert(
    lineas.map((l) => ({ ...l, pedido_id: pedido.id }))
  );

  if (itemsErr) {
    await admin.from("pedidos").delete().eq("id", pedido.id);
    await admin.storage.from("comprobantes").remove([path]);
    return NextResponse.json(
      { error: "No se pudieron guardar los ítems" },
      { status: 500 }
    );
  }

  const { error: reserveErr } = await admin.rpc("reservar_stock_pedido", {
    p_pedido_id: pedido.id,
  });

  if (reserveErr) {
    console.error(reserveErr);
    await admin.from("pedidos").delete().eq("id", pedido.id);
    await admin.storage.from("comprobantes").remove([path]);
    return NextResponse.json(
      {
        error:
          "No hay stock suficiente. Otro cliente completó la compra de este producto primero.",
      },
      { status: 409 }
    );
  }

  const { data: updated } = await admin
    .from("pedidos")
    .select("*, pedido_items(*)")
    .eq("id", pedido.id)
    .single();

  const full = (updated || pedido) as Pedido & {
    pedido_items?: Array<{
      nombre_snapshot: string;
      precio_snapshot: number;
      cantidad: number;
      talla_snapshot?: string;
    }>;
  };

  const adminPath = getAdminPath();
  revalidatePath("/");
  revalidatePath("/catalogo");
  revalidatePath(adminPath);
  revalidatePath(`${adminPath}/pedidos`);

  void notifyPedidoCreado({
    ...full,
    total: Number(full.total),
    estado: "COMPROBANTE_SUBIDO",
  } as Pedido);

  void notifyAdminNuevoPedido({ id: full.id, codigo: full.codigo });

  const { data: config } = await admin
    .from("configuracion_sitio")
    .select("nombre_negocio, direccion, whatsapp, horarios")
    .eq("id", 1)
    .maybeSingle();

  const items = (full.pedido_items || lineas).map(
    (i: {
      nombre_snapshot?: string;
      nombre?: string;
      precio_snapshot?: number;
      precio?: number;
      cantidad: number;
      talla_snapshot?: string;
      talla?: string;
    }) => ({
      nombre: i.nombre_snapshot || i.nombre || "",
      precio: Number(i.precio_snapshot ?? i.precio ?? 0),
      cantidad: i.cantidad,
      talla: i.talla_snapshot || i.talla || "",
    })
  );

  return NextResponse.json({
    ok: true,
    mensaje: "Compra realizada",
    pedido: {
      id: full.id,
      codigo: full.codigo,
      nombre: full.nombre,
      telefono: full.telefono,
      correo: full.correo,
      direccion: full.direccion,
      notas: full.notas,
      banco: full.banco,
      total: Number(full.total),
      estado: full.estado,
      metodo_pago: full.metodo_pago,
      created_at: full.created_at,
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
