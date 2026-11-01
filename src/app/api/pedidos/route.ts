import { NextResponse } from "next/server";
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

  // Validar productos y stock
  const ids = data.items.map((i) => i.producto_id);
  const { data: productos, error: prodErr } = await admin
    .from("productos")
    .select("id, nombre, precio, stock, disponible, activo")
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
  }[] = [];
  let total = 0;

  for (const item of data.items) {
    const p = byId.get(item.producto_id);
    if (!p || !p.activo || !p.disponible) {
      return NextResponse.json(
        { error: `Producto no disponible` },
        { status: 400 }
      );
    }
    if (p.stock < item.cantidad) {
      return NextResponse.json(
        {
          error: `Stock insuficiente para "${p.nombre}" (disponible: ${p.stock})`,
        },
        { status: 400 }
      );
    }
    const precio = Number(p.precio);
    lineas.push({
      producto_id: p.id,
      nombre_snapshot: p.nombre,
      precio_snapshot: precio,
      cantidad: item.cantidad,
    });
    total += precio * item.cantidad;
  }

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

  const estadoInicial =
    data.metodo_pago === "TRANSFERENCIA" ? "PENDIENTE_PAGO" : "PENDIENTE_PAGO";

  const { data: pedido, error: pedErr } = await admin
    .from("pedidos")
    .insert({
      codigo,
      nombre: data.nombre,
      telefono: data.telefono,
      correo: data.correo,
      direccion: data.direccion,
      notas: data.notas || "",
      total,
      metodo_pago: data.metodo_pago,
      estado: estadoInicial,
    })
    .select("*")
    .single();

  if (pedErr || !pedido) {
    console.error(pedErr);
    return NextResponse.json(
      { error: "No se pudo crear el pedido" },
      { status: 500 }
    );
  }

  const { error: itemsErr } = await admin.from("pedido_items").insert(
    lineas.map((l) => ({ ...l, pedido_id: pedido.id }))
  );

  if (itemsErr) {
    await admin.from("pedidos").delete().eq("id", pedido.id);
    return NextResponse.json(
      { error: "No se pudieron guardar los ítems" },
      { status: 500 }
    );
  }

  let payment_url: string | null = null;
  let payment_reference: string | null = null;

  if (data.metodo_pago === "LINK_PAGO") {
    const provider = getPaymentProvider();
    const result = await provider.createPayment(pedido as Pedido);
    payment_url = result.paymentUrl;
    payment_reference = result.paymentReference;
    await admin
      .from("pedidos")
      .update({ payment_url, payment_reference })
      .eq("id", pedido.id);
  }

  const fullPedido = {
    ...pedido,
    payment_url,
    payment_reference,
    total: Number(pedido.total),
  } as Pedido;

  void notifyPedidoCreado(fullPedido);

  const { data: config } = await admin
    .from("configuracion_sitio")
    .select("datos_bancarios, nombre_negocio")
    .eq("id", 1)
    .maybeSingle();

  return NextResponse.json({
    pedido: {
      id: fullPedido.id,
      codigo: fullPedido.codigo,
      total: fullPedido.total,
      estado: fullPedido.estado,
      metodo_pago: fullPedido.metodo_pago,
      payment_url,
      payment_reference,
    },
    datos_bancarios: config?.datos_bancarios || "",
    nombre_negocio: config?.nombre_negocio || "",
  });
}
