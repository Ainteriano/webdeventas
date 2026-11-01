"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/store/cart";

/**
 * Escucha cambios de stock/disponible y refresca el catálogo en vivo
 * (dos compradores no deben seguir viendo el producto disponible).
 */
export function StockRealtime() {
  const router = useRouter();
  const updateStock = useCart((s) => s.updateStock);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("productos-stock-live")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "productos" },
        (payload) => {
          const row = payload.new as {
            id?: string;
            stock?: number;
            disponible?: boolean;
          };
          if (row?.id) {
            const stock =
              row.disponible === false ? 0 : Math.max(0, Number(row.stock) || 0);
            updateStock(row.id, stock);
          }
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router, updateStock]);

  return null;
}
