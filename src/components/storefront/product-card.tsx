import Link from "next/link";
import type { Producto } from "@/types/database";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { imagenPrincipal } from "@/lib/data-client";
import { cn } from "@/lib/utils";
import { SafeImage } from "@/components/storefront/safe-image";

export function ProductCard({ producto }: { producto: Producto }) {
  const img = imagenPrincipal(producto);
  const disponible = producto.disponible && producto.stock > 0;

  return (
    <Link
      href={`/producto/${producto.slug}`}
      className={cn(
        "group block animate-fade-in overflow-hidden rounded-xl border border-border/70 bg-card/80 transition hover:-translate-y-0.5 hover:shadow-md",
        !disponible && "grayscale opacity-75"
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {img ? (
          <SafeImage
            src={img}
            alt={producto.nombre}
            fill
            className={cn(
              "object-cover transition duration-500 group-hover:scale-105",
              !disponible && "grayscale"
            )}
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Sin imagen
          </div>
        )}
        <div className="absolute left-2 top-2">
          <Badge variant={disponible ? "success" : "secondary"}>
            {disponible ? "Disponible" : "No disponible"}
          </Badge>
        </div>
      </div>
      <div className="space-y-1 p-3">
        <h3
          className={cn(
            "line-clamp-2 text-sm font-medium leading-snug",
            !disponible && "text-muted-foreground"
          )}
        >
          {producto.nombre}
        </h3>
        {disponible ? (
          <p className="text-base font-semibold text-primary">
            {formatPrice(producto.precio)}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Precio no disponible</p>
        )}
      </div>
    </Link>
  );
}
