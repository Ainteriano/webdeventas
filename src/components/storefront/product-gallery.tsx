"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ProductoImagen } from "@/types/database";
import { SafeImage } from "@/components/storefront/safe-image";

export function ProductGallery({
  imagenes,
  alt,
}: {
  imagenes: ProductoImagen[];
  alt: string;
}) {
  const sorted = [...imagenes].sort((a, b) => {
    if (a.es_principal !== b.es_principal) return a.es_principal ? -1 : 1;
    return a.orden - b.orden;
  });
  const [active, setActive] = useState(0);
  const current = sorted[active];

  if (sorted.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
        Sin imagen
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
        <SafeImage
          key={current.id}
          src={current.url}
          alt={alt}
          fill
          priority
          className="object-cover animate-fade-in"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Ver imagen ${i + 1}`}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition",
                i === active
                  ? "border-primary"
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <SafeImage
                src={img.url}
                alt=""
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
