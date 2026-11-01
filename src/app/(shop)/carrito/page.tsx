import type { Metadata } from "next";
import { CartView } from "@/components/storefront/cart-view";

export const metadata: Metadata = {
  title: "Carrito",
  description: "Revisa los productos de tu carrito",
};

export default function CarritoPage() {
  return (
    <div className="mx-auto max-w-6xl px-3 py-5 sm:px-4 sm:py-10">
      <div className="mb-5 sm:mb-8">
        <h1 className="font-display text-2xl sm:text-4xl">Carrito</h1>
      </div>
      <CartView />
    </div>
  );
}
