import { NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments/manual-link-provider";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyCambioEstado } from "@/lib/email";
import type { EstadoPedido, Pedido } from "@/types/database";

/**
 * Webhook de pagos.
 *
 * DÓNDE CONECTAR EL PROVEEDOR:
 * 1. Implementa un PaymentProvider real (ej. StripeProvider) en
 *    `src/lib/payments/` con createPayment + handleWebhook.
 * 2. Cambia `getPaymentProvider()` para devolver tu provider.
 * 3. Verifica la firma del webhook aquí o dentro de handleWebhook
 *    (header según el proveedor: Stripe-Signature, x-signature, etc.).
 * 4. Actualiza el pedido a CONFIRMADO vía `confirmar_pedido` RPC
 *    cuando el pago sea exitoso.
 */
export async function POST(request: Request) {
  const provider = getPaymentProvider();
  const result = await provider.handleWebhook(request);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message || "Webhook rechazado" },
      { status: 400 }
    );
  }

  // Placeholder: cuando el proveedor real devuelva pedidoId/reference
  // y status=paid, descomenta y conecta:
  //
  // if (result.status === "paid" && (result.pedidoId || result.reference)) {
  //   const admin = createAdminClient();
  //   let pedidoId = result.pedidoId;
  //   if (!pedidoId && result.reference) {
  //     const { data } = await admin.from("pedidos")
  //       .select("id, estado").eq("payment_reference", result.reference).maybeSingle();
  //     pedidoId = data?.id;
  //   }
  //   if (pedidoId) {
  //     const { data: before } = await admin.from("pedidos").select("*").eq("id", pedidoId).single();
  //     const { data: confirmed, error } = await admin.rpc("confirmar_pedido", { p_pedido_id: pedidoId });
  //     if (!error && confirmed && before) {
  //       void notifyCambioEstado(confirmed as Pedido, before.estado as EstadoPedido);
  //     }
  //   }
  // }

  void createAdminClient;
  void notifyCambioEstado;
  void (null as unknown as Pedido);
  void (null as unknown as EstadoPedido);

  return NextResponse.json({
    received: true,
    provider: provider.name,
    message: result.message,
  });
}
