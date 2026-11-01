"use client";

import Link from "next/link";
import { ShoppingBag, Menu, X, MapPin } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader({
  nombreNegocio,
  logoUrl,
}: {
  nombreNegocio: string;
  logoUrl?: string | null;
}) {
  const count = useCart((s) => s.items.reduce((n, i) => n + i.cantidad, 0));
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/catalogo", label: "Catálogo" },
    { href: "/ubicacion", label: "Ubicación" },
    { href: "/seguimiento", label: "Seguimiento" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-display text-xl tracking-tight">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={nombreNegocio} className="h-8 w-auto" />
          ) : null}
          <span>{nombreNegocio}</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-muted-foreground transition hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
          <Button asChild variant="outline" size="sm">
            <Link href="/carrito" className="relative">
              <ShoppingBag className="h-4 w-4" />
              Carrito
              {count > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] text-accent-foreground">
                  {count}
                </span>
              )}
            </Link>
          </Button>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <Link href="/carrito" className="relative rounded-md p-2 hover:bg-muted">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] text-accent-foreground">
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="rounded-md p-2 hover:bg-muted"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menú"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "border-t bg-background md:hidden",
          open ? "block" : "hidden"
        )}
      >
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm hover:bg-muted"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/ubicacion"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
          >
            <MapPin className="h-4 w-4" /> Cómo llegar
          </Link>
        </nav>
      </div>
    </header>
  );
}
