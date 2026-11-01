"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

type Props = Omit<ImageProps, "onError"> & {
  fallbackClassName?: string;
};

/**
 * next/image con fallback si la URL falla (404, host no permitido, etc.)
 */
export function SafeImage({
  className,
  fallbackClassName,
  alt,
  ...props
}: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground",
          fallbackClassName
        )}
      >
        Sin imagen
      </div>
    );
  }

  return (
    <Image
      {...props}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
