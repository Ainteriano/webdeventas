import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkoutSchema } from "@/lib/validations";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { notifyPedidoCreado } from "@/lib/email";
import { getPaymentProvider } from "@/lib/payments/manual-link-provider";
import type { Pedido } from "@/types/database";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit(`pedido:${ip}`, 8, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta más tarde." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const admin = createAdminClient();

  if (data.metodo_pago === "LINK_PAGO") {
    const { data: cfg } = await admin
      .from("configuracion_sitio")
      .select("link_pago_activo")
      .eq("id", 1)
      .maybeSingle();
    if (!cfg?.link_pago_activo) {
      return NextResponse.json(
        { error: "El pago por link aún no está disponible" },
        { status: 400 }
      );
    }
  }

  const { data: codigoRow } = await admin.rpc("generar_codigo_pedido");
  const codigo =
    typeof codigoRow === "string"
      ? codigoRow
      : `PED-${Date.now().toString(36).toUpperCase()}`;

  const itemsPayload = data.items.map((i) => ({
    producto_id: i.producto_id,
    cantidad: i.cantidad,
  }));

  // Transacción atómica: bloquea productos, valida stock, crea pedido y reserva
  const { data: pedido, error: pedErr } = await admin.rpc(
    "crear_pedido_con_reserva",
    {
      p_codigo: codigo,
      p_nombre: data.nombre,
      p_telefono: data.telefono,
      p_correo: data.correo,
      p_direccion: data.direccion?.trim() || "",
      p_notas: "",
      p_banco: data.banco,
      p_metodo_pago: data.metodo_pago,
      p_items: itemsPayload,
    }
  );

  if (pedErr || !pedido) {
    console.error(pedErr);
    const msg = pedErr?.message || "No se pudo crear el pedido";
    const conflict =
      /stock insuficiente|no disponible|no encontrado/i.test(msg);
    return NextResponse.json(
      {
        error: conflict
          ? "Ese producto ya no tiene stock. Otro cliente pudo reservarlo."
          : msg,
      },
      { status: conflict ? 409 : 500 }
    );
  }

  const pedidoRow = pedido as Pedido;

  const { data: itemsDb } = await admin
    .from("pedido_items")
    .select("nombre_snapshot, precio_snapshot, cantidad, talla_snapshot")
    .eq("pedido_id", pedidoRow.id);

  const lineas = (itemsDb || []).map((l) => ({
    nombre: l.nombre_snapshot,
    precio: Number(l.precio_snapshot),
    cantidad: l.cantidad,
    talla: l.talla_snapshot || "",
  }));

  let payment_url: string | null = null;
  let payment_reference: string | null = null;

  if (data.metodo_pago === "LINK_PAGO") {
    const provider = getPaymentProvider();
    const result = await provider.createPayment({
      ...pedidoRow,
      total: Number(pedidoRow.total),
    } as Pedido);
    payment_url = result.paymentUrl;
    payment_reference = result.paymentReference;
    await admin
      .from("pedidos")
      .update({ payment_url, payment_reference })
      .eq("id", pedidoRow.id);
  }

  const fullPedido = {
    ...pedidoRow,
    payment_url,
    payment_reference,
    total: Number(pedidoRow.total),
  } as Pedido;

  void notifyPedidoCreado(fullPedido);

  // Catálogo debe reflejar stock 0 / no disponible de inmediato
  revalidatePath("/");
  revalidatePath("/catalogo");
  revalidatePath("/carrito");
  revalidatePath("/checkout");

  const { data: config } = await admin
    .from("configuracion_sitio")
    .select("nombre_negocio, direccion, whatsapp, horarios")
    .eq("id", 1)
    .maybeSingle();

  return NextResponse.json({
    pedido: {
      id: fullPedido.id,
      codigo: fullPedido.codigo,
      nombre: fullPedido.nombre,
      telefono: fullPedido.telefono,
      correo: fullPedido.correo,
      direccion: fullPedido.direccion,
      notas: fullPedido.notas,
      banco: data.banco,
      total: fullPedido.total,
      estado: fullPedido.estado,
      metodo_pago: fullPedido.metodo_pago,
      created_at: fullPedido.created_at,
      payment_url,
      payment_reference,
      items: lineas,
    },
    comercio: {
      nombre_negocio: config?.nombre_negocio || "American Shoes",
      direccion: config?.direccion || "",
      whatsapp: config?.whatsapp || "",
      horarios: config?.horarios || "",
    },
  });
}
