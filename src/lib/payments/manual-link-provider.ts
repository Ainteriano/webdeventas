import type { Pedido } from "@/types/database";
import type { PaymentProvider, PaymentResult } from "./types";

/**
 * Placeholder: estructura lista para conectar un proveedor real
 * (Stripe, Mercado Pago, PayPal, etc.).
 */
export class ManualLinkProvider implements PaymentProvider {
  name = "ManualLinkProvider";

  async createPayment(pedido: Pedido): Promise<PaymentResult> {
    // Cuando conectes un proveedor real, genera aquí la URL de pago.
    return {
      paymentUrl: null,
      paymentReference: `MANUAL-${pedido.codigo}`,
      raw: { placeholder: true, pedidoId: pedido.id },
    };
  }

  async handleWebhook(request: Request) {
    // Documentación: parsear el body del proveedor, verificar firma,
    // localizar el pedido por payment_reference y actualizar estado.
    void request;
    return {
      ok: true,
      message:
        "Webhook placeholder — conecta tu proveedor en ManualLinkProvider.handleWebhook",
    };
  }
}

export function getPaymentProvider(): PaymentProvider {
  // Más adelante: switch según env PAYMENT_PROVIDER
  return new ManualLinkProvider();
}
