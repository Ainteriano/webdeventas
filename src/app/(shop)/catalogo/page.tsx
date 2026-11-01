import Link from "next/link";
import type { Metadata } from "next";
import { getCategorias, getProductos, getSubcategorias } from "@/lib/data";
import { ProductCard } from "@/components/storefront/product-card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Catálogo",
  description: "Zapatos American Shoes — Hombre, Mujer e Infantil",
};

type SearchParams = {
  categoria?: string;
  subcategoria?: string;
  orden?: string;
};

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const categoriaSlug = searchParams.categoria || undefined;
  const subcategoriaSlug = searchParams.subcategoria || undefined;
  const orden = searchParams.orden || undefined;

  const categorias = await getCategorias();
  const categoriaActiva = categorias.find((c) => c.slug === categoriaSlug);
  const subcategorias = await getSubcategorias(categoriaActiva?.id);
  const subActiva = subcategorias.find((s) => s.slug === subcategoriaSlug);

  const productos = await getProductos({
    categoriaSlug,
    subcategoriaSlug,
    orden,
  });

  const titulo = subActiva?.nombre
    ? `${categoriaActiva?.nombre} · ${subActiva.nombre}`
    : categoriaActiva?.nombre || "Catálogo";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">{titulo}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {categoriaActiva
              ? "Elige un par y agrégalo al carrito"
              : "Usa el menú Catálogo para filtrar por Hombre, Mujer o Infantil"}
          </p>
        </div>
        {categoriaActiva && (
          <Button asChild variant="outline" size="sm">
            <Link href="/catalogo">Ver todo</Link>
          </Button>
        )}
      </div>

      {/* Chips rápidas de subcategorías si aplica */}
      {categoriaActiva && subcategorias.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href={`/catalogo?categoria=${categoriaActiva.slug}`}
            className={`rounded-md px-3 py-1.5 text-sm ${
              !subcategoriaSlug
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Todos
          </Link>
          {subcategorias.map((s) => (
            <Link
              key={s.id}
              href={`/catalogo?categoria=${categoriaActiva.slug}&subcategoria=${s.slug}`}
              className={`rounded-md px-3 py-1.5 text-sm ${
                subcategoriaSlug === s.slug
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s.nombre}
            </Link>
          ))}
        </div>
      )}

      {productos.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/40 px-6 py-16 text-center">
          <p className="text-muted-foreground">
            No hay zapatos en esta sección todavía.
          </p>
          <Button asChild variant="link" className="mt-2">
            <Link href="/catalogo">Ver todo el catálogo</Link>
          </Button>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {productos.length} producto{productos.length === 1 ? "" : "s"}
          </p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {productos.map((p) => (
              <ProductCard key={p.id} producto={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
