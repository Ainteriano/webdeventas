"use client";

import { useState } from "react";
import { ShoppingCart, Check, Minus, Plus } from "lucide-react";
import { useCart } from "@/store/cart";
import { Button } from "@/components/ui/button";

interface AddToCartButtonProps {
  producto_id: string;
  nombre: string;
  precio: number;
  imagen?: string | null;
  stock: number;
  talla: string;
  className?: string;
}

export function AddToCartButton({
  producto_id,
  nombre,
  precio,
  imagen,
  stock,
  talla,
  className,
}: AddToCartButtonProps) {
  const maxStock = Math.max(0, Math.floor(Number(stock) || 0));
  const addItem = useCart((s) => s.addItem);
  const remaining = useCart((s) => s.remaining(producto_id, maxStock));
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const canAdd = remaining > 0;
  const maxSelectable = Math.max(1, remaining || maxStock);

  function handleClick() {
    if (!canAdd) {
      setOk(false);
      setMessage(
        maxStock <= 0
          ? "Sin stock"
          : maxStock === 1
            ? "Solo hay 1 unidad disponible"
            : `Solo hay ${maxStock} unidades disponibles`
      );
      return;
    }

    const cantidad = Math.min(qty, remaining);
    const result = addItem(
      {
        producto_id,
        nombre,
        precio,
        imagen,
        stock: maxStock,
        talla: talla || "",
      },
      cantidad
    );
    setOk(result.ok);
    setMessage(
      result.ok ? "Agregado al carrito" : result.message || "No se pudo agregar"
    );
    if (result.ok) setQty(1);
    window.setTimeout(() => {
      setMessage(null);
      setOk(false);
    }, 2500);
  }

  if (maxStock <= 0) {
    return (
      <p className="text-sm text-muted-foreground">Sin unidades disponibles</p>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-md border bg-card">
          <button
            type="button"
            className="p-2.5 hover:bg-muted disabled:opacity-40"
            aria-label="Disminuir"
            disabled={qty <= 1}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-10 text-center text-sm font-medium tabular-nums">
            {qty}
          </span>
          <button
            type="button"
            className="p-2.5 hover:bg-muted disabled:opacity-40"
            aria-label="Aumentar"
            disabled={qty >= maxSelectable || !canAdd}
            onClick={() =>
              setQty((q) => Math.min(maxSelectable, q + 1))
            }
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <Button
          type="button"
          size="lg"
          className="flex-1 sm:flex-none"
          disabled={!canAdd}
          onClick={handleClick}
        >
          {ok ? (
            <Check className="h-4 w-4" />
          ) : (
            <ShoppingCart className="h-4 w-4" />
          )}
          {canAdd ? "Agregar al carrito" : "Sin stock"}
        </Button>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {maxStock === 1
          ? "1 unidad disponible"
          : `${maxStock} unidades disponibles`}
        {remaining < maxStock ? ` · ${remaining} libres en carrito` : ""}
      </p>

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
