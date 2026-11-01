import type { Metadata } from "next";
import { CartView } from "@/components/storefront/cart-view";

export const metadata: Metadata = {
  title: "Carrito",
  description: "Revisa los productos de tu carrito",
};

export default function CarritoPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl">Carrito</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ajusta cantidades o continúa al checkout
        </p>
      </div>
      <CartView />
    </div>
  );
}
