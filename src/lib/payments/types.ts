import type { Pedido } from "@/types/database";

export interface PaymentResult {
  paymentUrl: string | null;
  paymentReference: string | null;
  raw?: unknown;
}

export interface PaymentProvider {
  name: string;
  createPayment(pedido: Pedido): Promise<PaymentResult>;
  handleWebhook(request: Request): Promise<{
    ok: boolean;
    pedidoId?: string;
    reference?: string;
    status?: string;
    message?: string;
  }>;
}
