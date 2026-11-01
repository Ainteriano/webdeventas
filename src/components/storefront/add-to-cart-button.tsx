"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/store/cart";
import { Button } from "@/components/ui/button";

interface AddToCartButtonProps {
  producto_id: string;
  nombre: string;
  precio: number;
  imagen?: string | null;
  stock: number;
  className?: string;
}

export function AddToCartButton({
  producto_id,
  nombre,
  precio,
  imagen,
  stock,
  className,
}: AddToCartButtonProps) {
  const addItem = useCart((s) => s.addItem);
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function handleClick() {
    const result = addItem({
      producto_id,
      nombre,
      precio,
      imagen,
      stock,
    });
    setOk(result.ok);
    setMessage(result.ok ? "Agregado al carrito" : result.message || "No se pudo agregar");
    window.setTimeout(() => {
      setMessage(null);
      setOk(false);
    }, 2500);
  }

  return (
    <div className={className}>
      <Button type="button" size="lg" className="w-full sm:w-auto" onClick={handleClick}>
        {ok ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
        Agregar al carrito
      </Button>
      {message && (
        <p
          className={`mt-2 text-sm ${ok ? "text-emerald-700" : "text-destructive"}`}
          role="status"
        >
          {message}
        </p>
      )}
    </div>
  );
}
