import type { Metadata } from "next";
import { SeguimientoForm } from "@/components/storefront/seguimiento-form";

export const metadata: Metadata = {
  title: "Seguimiento",
  description: "Consulta el estado de tu pedido con el código",
};

export default function SeguimientoPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:py-14">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl sm:text-4xl">Seguimiento</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ingresa el código de tu pedido para ver el estado
        </p>
      </div>
      <SeguimientoForm />
    </div>
  );
}
