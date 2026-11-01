"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function CartView() {
  const items = useCart((s) => s.items);
  const setQuantity = useCart((s) => s.setQuantity);
  const removeItem = useCart((s) => s.removeItem);
  const total = useCart((s) => s.total);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/40 px-6 py-16 text-center">
        <p className="text-muted-foreground">Tu carrito está vacío.</p>
        <Button asChild className="mt-4">
          <Link href="/catalogo">Ir al catálogo</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <ul className="divide-y rounded-xl border bg-card/70">
        {items.map((item) => {
          const maxStock = Math.max(0, Math.floor(Number(item.stock) || 0));
          const atMax = item.cantidad >= maxStock;
          return (
            <li key={item.producto_id} className="flex gap-3 p-4 sm:gap-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                {item.imagen ? (
                  <Image
                    src={item.imagen}
                    alt={item.nombre}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                    Sin imagen
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.nombre}</p>
                <p className="mt-0.5 text-sm text-primary">
                  {formatPrice(item.precio)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.talla ? `Talla ${item.talla} · ` : ""}Máx. {maxStock}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <div className="flex items-center rounded-md border">
                    <button
                      type="button"
                      className="p-2 hover:bg-muted"
                      aria-label="Disminuir cantidad"
                      onClick={() =>
                        setQuantity(item.producto_id, item.cantidad - 1)
                      }
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-8 text-center text-sm tabular-nums">
                      {item.cantidad}
                    </span>
                    <button
                      type="button"
                      className="p-2 hover:bg-muted disabled:opacity-40"
                      aria-label="Aumentar cantidad"
                      disabled={atMax || maxStock <= 0}
                      onClick={() =>
                        setQuantity(item.producto_id, item.cantidad + 1)
                      }
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-sm text-destructive hover:underline"
                    onClick={() => removeItem(item.producto_id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Quitar
                  </button>
                </div>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums">
                {formatPrice(item.precio * item.cantidad)}
              </p>
            </li>
          );
        })}
      </ul>

      <aside className="h-fit rounded-xl border bg-card p-5 shadow-sm lg:sticky lg:top-24">
        <h2 className="font-display text-xl">Resumen</h2>
        <div className="mt-4 flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-semibold tabular-nums">{formatPrice(total())}</span>
        </div>
        <Button asChild size="lg" className="mt-6 w-full">
          <Link href="/checkout">Ir a pagar</Link>
        </Button>
        <Button asChild variant="ghost" className="mt-2 w-full">
          <Link href="/catalogo">Seguir comprando</Link>
        </Button>
      </aside>
    </div>
  );
}
