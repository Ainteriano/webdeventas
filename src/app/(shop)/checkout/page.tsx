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
    <div className="mx-auto max-w-6xl px-3 py-5 sm:px-4 sm:py-10">
      <div className="mb-5 sm:mb-8">
        <h1 className="font-display text-2xl sm:text-4xl">Checkout</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Datos, banco de origen y comprobante
        </p>
      </div>
      <CheckoutForm
        linkPagoActivo={!!config?.link_pago_activo}
        comercio={{
          nombre_negocio: config?.nombre_negocio || "American Shoes",
          direccion: config?.direccion || "",
          whatsapp: config?.whatsapp || "",
          horarios: config?.horarios || "",
        }}
      />
    </div>
  );
}
