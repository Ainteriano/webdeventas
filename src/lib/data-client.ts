import type { Producto } from "@/types/database";

export function imagenPrincipal(producto: Producto): string | null {
  const imgs = producto.producto_imagenes || [];
  const principal = imgs.find((i) => i.es_principal) || imgs[0];
  return principal?.url || null;
}
