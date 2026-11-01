"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Categoria, Subcategoria } from "@/types/database";

export type NavCategoria = Categoria & {
  subcategorias: Subcategoria[];
};

export function SiteHeader({
  nombreNegocio,
  logoUrl,
  categorias = [],
}: {
  nombreNegocio: string;
  logoUrl?: string | null;
  categorias?: NavCategoria[];
}) {
  const pathname = usePathname();
  const count = useCart((s) => s.items.reduce((n, i) => n + i.cantidad, 0));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [mobileCatalogOpen, setMobileCatalogOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const catalogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCatalogOpen(false);
    setExpandedCat(null);
    setMobileOpen(false);
    setMobileCatalogOpen(false);
    setMobileExpanded(null);
  }, [pathname]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!catalogRef.current?.contains(e.target as Node)) {
        setCatalogOpen(false);
        setExpandedCat(null);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setCatalogOpen(false);
        setExpandedCat(null);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-xl tracking-tight"
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={nombreNegocio} className="h-8 w-auto" />
          ) : null}
          <span>{nombreNegocio}</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {/* Catálogo dropdown */}
          <div className="relative" ref={catalogRef}>
            <button
              type="button"
              onClick={() => {
                setCatalogOpen((v) => !v);
                if (catalogOpen) setExpandedCat(null);
              }}
              className={cn(
                "inline-flex items-center gap-1 text-sm transition",
                catalogOpen
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-expanded={catalogOpen}
              aria-haspopup="true"
            >
              Catálogo
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition",
                  catalogOpen && "rotate-180"
                )}
              />
            </button>

            {catalogOpen && (
              <div className="absolute left-0 top-full z-50 mt-3 min-w-[240px] overflow-hidden rounded-xl border bg-card shadow-lg animate-fade-in">
                <div className="border-b px-3 py-2">
                  <Link
                    href="/catalogo"
                    onClick={() => setCatalogOpen(false)}
                    className="block rounded-md px-2 py-2 text-sm font-medium hover:bg-muted"
                  >
                    Ver todo el catálogo
                  </Link>
                </div>
                <ul className="p-2">
                  {categorias.map((cat) => {
                    const hasSubs = cat.subcategorias.length > 0;
                    const isExpanded = expandedCat === cat.id;
                    return (
                      <li key={cat.id}>
                        {hasSubs ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedCat(isExpanded ? null : cat.id)
                              }
                              className="flex w-full items-center justify-between rounded-md px-2 py-2.5 text-left text-sm hover:bg-muted"
                            >
                              <span className="font-medium">{cat.nombre}</span>
                              <ChevronRight
                                className={cn(
                                  "h-4 w-4 text-muted-foreground transition",
                                  isExpanded && "rotate-90"
                                )}
                              />
                            </button>
                            {isExpanded && (
                              <ul className="mb-1 ml-2 space-y-0.5 border-l border-border/80 pl-2">
                                <li>
                                  <Link
                                    href={`/catalogo?categoria=${cat.slug}`}
                                    onClick={() => setCatalogOpen(false)}
                                    className="block rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                                  >
                                    Todo {cat.nombre}
                                  </Link>
                                </li>
                                {cat.subcategorias.map((sub) => (
                                  <li key={sub.id}>
                                    <Link
                                      href={`/catalogo?categoria=${cat.slug}&subcategoria=${sub.slug}`}
                                      onClick={() => setCatalogOpen(false)}
                                      className="block rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                                    >
                                      {sub.nombre}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </>
                        ) : (
                          <Link
                            href={`/catalogo?categoria=${cat.slug}`}
                            onClick={() => setCatalogOpen(false)}
                            className="block rounded-md px-2 py-2.5 text-sm font-medium hover:bg-muted"
                          >
                            {cat.nombre}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <Link
            href="/ubicacion"
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            Ubicación
          </Link>
          <Link
            href="/seguimiento"
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            Seguimiento
          </Link>
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
          <Link
            href="/carrito"
            className="relative rounded-md p-2 hover:bg-muted"
          >
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
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menú"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "border-t bg-background md:hidden",
          mobileOpen ? "block" : "hidden"
        )}
      >
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
          <button
            type="button"
            onClick={() => setMobileCatalogOpen((v) => !v)}
            className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted"
          >
            Catálogo
            <ChevronDown
              className={cn(
                "h-4 w-4 transition",
                mobileCatalogOpen && "rotate-180"
              )}
            />
          </button>

          {mobileCatalogOpen && (
            <div className="ml-2 space-y-1 border-l pl-2">
              <Link
                href="/catalogo"
                onClick={() => setMobileOpen(false)}
                className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Ver todo
              </Link>
              {categorias.map((cat) => {
                const hasSubs = cat.subcategorias.length > 0;
                const open = mobileExpanded === cat.id;
                return (
                  <div key={cat.id}>
                    {hasSubs ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setMobileExpanded(open ? null : cat.id)
                          }
                          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
                        >
                          {cat.nombre}
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 transition",
                              open && "rotate-90"
                            )}
                          />
                        </button>
                        {open && (
                          <div className="ml-2 space-y-0.5 border-l pl-2">
                            <Link
                              href={`/catalogo?categoria=${cat.slug}`}
                              onClick={() => setMobileOpen(false)}
                              className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                            >
                              Todo {cat.nombre}
                            </Link>
                            {cat.subcategorias.map((sub) => (
                              <Link
                                key={sub.id}
                                href={`/catalogo?categoria=${cat.slug}&subcategoria=${sub.slug}`}
                                onClick={() => setMobileOpen(false)}
                                className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                              >
                                {sub.nombre}
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        href={`/catalogo?categoria=${cat.slug}`}
                        onClick={() => setMobileOpen(false)}
                        className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
                      >
                        {cat.nombre}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <Link
            href="/ubicacion"
            onClick={() => setMobileOpen(false)}
            className="rounded-md px-3 py-2.5 text-sm hover:bg-muted"
          >
            Ubicación
          </Link>
          <Link
            href="/seguimiento"
            onClick={() => setMobileOpen(false)}
            className="rounded-md px-3 py-2.5 text-sm hover:bg-muted"
          >
            Seguimiento
          </Link>
        </nav>
      </div>
    </header>
  );
}
