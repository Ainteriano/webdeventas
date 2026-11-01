import Link from "next/link";
import type { Metadata } from "next";
import {
  getCategorias,
  getProductos,
  getSubcategorias,
} from "@/lib/data";
import { ProductCard } from "@/components/storefront/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "Catálogo",
  description: "Explora todos nuestros productos",
};

type SearchParams = {
  categoria?: string;
  subcategoria?: string;
  q?: string;
  orden?: string;
};

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const categoriaSlug = searchParams.categoria || undefined;
  const subcategoriaSlug = searchParams.subcategoria || undefined;
  const q = searchParams.q?.trim() || undefined;
  const orden = searchParams.orden || undefined;

  const categorias = await getCategorias();
  const categoriaActiva = categorias.find((c) => c.slug === categoriaSlug);
  const subcategorias = await getSubcategorias(categoriaActiva?.id);

  const productos = await getProductos({
    categoriaSlug,
    subcategoriaSlug,
    q,
    orden,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl">Catálogo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Filtra por categoría, busca por nombre u ordena los resultados
        </p>
      </div>

      <form
        method="get"
        className="mb-8 grid gap-4 rounded-xl border bg-card/70 p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <div className="space-y-2">
          <Label htmlFor="q">Buscar</Label>
          <Input
            id="q"
            name="q"
            type="search"
            placeholder="Nombre del producto"
            defaultValue={q || ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoria">Categoría</Label>
          <select
            id="categoria"
            name="categoria"
            defaultValue={categoriaSlug || ""}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subcategoria">Subcategoría</Label>
          <select
            id="subcategoria"
            name="subcategoria"
            defaultValue={subcategoriaSlug || ""}
            disabled={!categoriaActiva}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Todas</option>
            {subcategorias.map((s) => (
              <option key={s.id} value={s.slug}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="orden">Orden</Label>
          <select
            id="orden"
            name="orden"
            defaultValue={orden || ""}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Más recientes</option>
            <option value="precio_asc">Precio: menor a mayor</option>
            <option value="precio_desc">Precio: mayor a menor</option>
            <option value="nombre">Nombre A–Z</option>
          </select>
        </div>

        <div className="flex items-end gap-2">
          <Button type="submit" className="w-full">
            Aplicar
          </Button>
          {(categoriaSlug || subcategoriaSlug || q || orden) && (
            <Button asChild type="button" variant="outline">
              <Link href="/catalogo">Limpiar</Link>
            </Button>
          )}
        </div>
      </form>

      {categoriaActiva && (
        <p className="mb-4 text-sm text-muted-foreground">
          Mostrando: <span className="font-medium text-foreground">{categoriaActiva.nombre}</span>
          {subcategoriaSlug
            ? ` · ${subcategorias.find((s) => s.slug === subcategoriaSlug)?.nombre || subcategoriaSlug}`
            : ""}
          {q ? ` · “${q}”` : ""}
        </p>
      )}

      {productos.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/40 px-6 py-16 text-center">
          <p className="text-muted-foreground">No hay productos con estos filtros.</p>
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
