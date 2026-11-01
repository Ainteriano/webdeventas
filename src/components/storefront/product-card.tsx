import Image from "next/image";
import Link from "next/link";
import type { Producto } from "@/types/database";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { imagenPrincipal } from "@/lib/data-client";

export function ProductCard({ producto }: { producto: Producto }) {
  const img = imagenPrincipal(producto);

  return (
    <Link
      href={`/producto/${producto.slug}`}
      className="group block animate-fade-in overflow-hidden rounded-xl border border-border/70 bg-card/80 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {img ? (
          <Image
            src={img}
            alt={producto.nombre}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Sin imagen
          </div>
        )}
        <div className="absolute left-2 top-2">
          <Badge variant={producto.disponible && producto.stock > 0 ? "success" : "secondary"}>
            {producto.disponible && producto.stock > 0
              ? "Disponible"
              : "No disponible"}
          </Badge>
        </div>
      </div>
      <div className="space-y-1 p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">
          {producto.nombre}
        </h3>
        <p className="text-base font-semibold text-primary">
          {formatPrice(producto.precio)}
        </p>
      </div>
    </Link>
  );
}
