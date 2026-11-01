"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  producto_id: string;
  nombre: string;
  precio: number;
  imagen?: string | null;
  stock: number;
  cantidad: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "cantidad">, cantidad?: number) => {
    ok: boolean;
    message?: string;
  };
  removeItem: (producto_id: string) => void;
  setQuantity: (producto_id: string, cantidad: number) => {
    ok: boolean;
    message?: string;
  };
  clear: () => void;
  total: () => number;
  count: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, cantidad = 1) => {
        const existing = get().items.find(
          (i) => i.producto_id === item.producto_id
        );
        const nextQty = (existing?.cantidad || 0) + cantidad;
        if (nextQty > item.stock) {
          return {
            ok: false,
            message: `Solo hay ${item.stock} unidades disponibles`,
          };
        }
        set((state) => {
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.producto_id === item.producto_id
                  ? { ...i, cantidad: nextQty, stock: item.stock, precio: item.precio }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { ...item, cantidad }],
          };
        });
        return { ok: true };
      },
      removeItem: (producto_id) =>
        set((state) => ({
          items: state.items.filter((i) => i.producto_id !== producto_id),
        })),
      setQuantity: (producto_id, cantidad) => {
        const item = get().items.find((i) => i.producto_id === producto_id);
        if (!item) return { ok: false, message: "Producto no encontrado" };
        if (cantidad <= 0) {
          get().removeItem(producto_id);
          return { ok: true };
        }
        if (cantidad > item.stock) {
          return {
            ok: false,
            message: `Solo hay ${item.stock} unidades disponibles`,
          };
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.producto_id === producto_id ? { ...i, cantidad } : i
          ),
        }));
        return { ok: true };
      },
      clear: () => set({ items: [] }),
      total: () =>
        get().items.reduce((sum, i) => sum + i.precio * i.cantidad, 0),
      count: () => get().items.reduce((sum, i) => sum + i.cantidad, 0),
    }),
    { name: "catalogo-cart" }
  )
);
