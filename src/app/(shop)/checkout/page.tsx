import type { Metadata } from "next";
import { getConfiguracion } from "@/lib/data";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Completa tus datos y confirma el pedido",
};

export default async function CheckoutPage() {
  const config = await getConfiguracion();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl">Checkout</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Completa tus datos para crear el pedido
        </p>
      </div>
      <CheckoutForm
        linkPagoActivo={!!config?.link_pago_activo}
        datosBancarios={config?.datos_bancarios || ""}
      />
    </div>
  );
}
