"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  producto_id: string;
  nombre: string;
  precio: number;
  imagen?: string | null;
  stock: number;
  talla: string;
  cantidad: number;
}

function toStock(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

function clampQty(cantidad: number, stock: number): number {
  const s = toStock(stock);
  const q = Math.floor(Number(cantidad) || 0);
  if (q <= 0) return 0;
  return Math.min(q, Math.max(0, s));
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
  updateStock: (producto_id: string, stock: number) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
  remaining: (producto_id: string, stock: number) => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      remaining: (producto_id, stock) => {
        const max = toStock(stock);
        const existing = get().items.find((i) => i.producto_id === producto_id);
        const inCart = existing?.cantidad || 0;
        return Math.max(0, max - inCart);
      },
      addItem: (item, cantidad = 1) => {
        const stock = toStock(item.stock);
        if (stock <= 0) {
          return { ok: false, message: "Sin stock disponible" };
        }

        const existing = get().items.find(
          (i) => i.producto_id === item.producto_id
        );
        const addQty = Math.max(1, Math.floor(Number(cantidad) || 1));
        const current = existing?.cantidad || 0;
        const nextQty = current + addQty;

        if (nextQty > stock) {
          return {
            ok: false,
            message:
              stock === 1
                ? "Solo hay 1 unidad disponible"
                : `Solo hay ${stock} unidades disponibles`,
          };
        }

        set((state) => {
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.producto_id === item.producto_id
                  ? {
                      ...i,
                      cantidad: nextQty,
                      stock,
                      talla: item.talla || i.talla || "",
                      precio: Number(item.precio) || i.precio,
                      nombre: item.nombre || i.nombre,
                      imagen: item.imagen ?? i.imagen,
                    }
                  : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                ...item,
                precio: Number(item.precio) || 0,
                talla: item.talla || "",
                stock,
                cantidad: addQty,
              },
            ],
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

        const stock = toStock(item.stock);
        if (cantidad <= 0) {
          get().removeItem(producto_id);
          return { ok: true };
        }

        if (cantidad > stock) {
          set((state) => ({
            items: state.items.map((i) =>
              i.producto_id === producto_id
                ? { ...i, cantidad: stock, stock }
                : i
            ),
          }));
          return {
            ok: false,
            message:
              stock === 1
                ? "Solo hay 1 unidad disponible"
                : `Solo hay ${stock} unidades disponibles`,
          };
        }

        set((state) => ({
          items: state.items.map((i) =>
            i.producto_id === producto_id
              ? { ...i, cantidad: Math.floor(cantidad), stock }
              : i
          ),
        }));
        return { ok: true };
      },
      updateStock: (producto_id, stock) => {
        const max = toStock(stock);
        set((state) => ({
          items: state.items
            .map((i) => {
              if (i.producto_id !== producto_id) return i;
              const cantidad = clampQty(i.cantidad, max);
              return { ...i, stock: max, cantidad };
            })
            .filter((i) => i.cantidad > 0),
        }));
      },
      clear: () => set({ items: [] }),
      total: () =>
        get().items.reduce((sum, i) => sum + i.precio * i.cantidad, 0),
      count: () => get().items.reduce((sum, i) => sum + i.cantidad, 0),
    }),
    {
      name: "catalogo-cart",
      version: 3,
      migrate: (persisted) => {
        const state = (persisted || {}) as { items?: CartItem[] };
        const items = Array.isArray(state.items)
          ? state.items
              .map((i) => {
                const stock = toStock(i?.stock);
                const cantidad = clampQty(i?.cantidad, stock);
                return {
                  producto_id: String(i?.producto_id || ""),
                  nombre: String(i?.nombre || ""),
                  precio: Number(i?.precio) || 0,
                  imagen: i?.imagen ?? null,
                  talla: String(i?.talla || ""),
                  stock,
                  cantidad,
                } satisfies CartItem;
              })
              .filter((i) => i.producto_id && i.cantidad > 0 && i.stock > 0)
          : [];
        return { items };
      },
    }
  )
);
