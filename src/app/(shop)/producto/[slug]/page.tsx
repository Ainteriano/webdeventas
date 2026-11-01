import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductoBySlug, imagenPrincipal } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const producto = await getProductoBySlug(params.slug);
  if (!producto) {
    return { title: "Producto no encontrado" };
  }
  const img = imagenPrincipal(producto);
  return {
    title: producto.nombre,
    description:
      producto.descripcion?.slice(0, 160) ||
      `${producto.nombre} — ${formatPrice(producto.precio)}`,
    openGraph: {
      title: producto.nombre,
      description: producto.descripcion?.slice(0, 160) || undefined,
      images: img ? [{ url: img }] : undefined,
    },
  };
}

export default async function ProductoPage({ params }: Props) {
  const producto = await getProductoBySlug(params.slug);
  if (!producto) notFound();

  const stock = Math.max(0, Math.floor(Number(producto.stock) || 0));
  const disponible = producto.disponible && stock > 0;
  const imagen = imagenPrincipal(producto);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/catalogo" className="hover:text-foreground">
          Catálogo
        </Link>
        {producto.categorias && (
          <>
            <span className="mx-2">/</span>
            <Link
              href={`/catalogo?categoria=${producto.categorias.slug}`}
              className="hover:text-foreground"
            >
              {producto.categorias.nombre}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-foreground">{producto.nombre}</span>
      </nav>

      <div
        className={`grid gap-8 md:grid-cols-2 md:gap-12 ${
          !disponible ? "opacity-90" : ""
        }`}
      >
        <div className={!disponible ? "grayscale" : undefined}>
          <ProductGallery
            imagenes={producto.producto_imagenes || []}
            alt={producto.nombre}
          />
        </div>

        <div className="flex flex-col">
          <Badge
            variant={disponible ? "success" : "secondary"}
            className="w-fit"
          >
            {disponible ? "Disponible" : "No disponible"}
          </Badge>

          <h1
            className={`mt-3 font-display text-3xl sm:text-4xl ${
              !disponible ? "text-muted-foreground" : ""
            }`}
          >
            {producto.nombre}
          </h1>

          {disponible ? (
            <p className="mt-4 text-2xl font-semibold text-primary">
              {formatPrice(producto.precio)}
            </p>
          ) : (
            <p className="mt-4 text-lg text-muted-foreground">
              Precio no disponible
            </p>
          )}

          {producto.descripcion && (
            <div className="mt-6 whitespace-pre-line text-sm text-muted-foreground">
              {producto.descripcion}
            </div>
          )}

          <div className="mt-8">
            {disponible ? (
              <AddToCartButton
                producto_id={producto.id}
                nombre={producto.nombre}
                precio={Number(producto.precio)}
                imagen={imagen}
                stock={stock}
              />
            ) : (
              <p className="rounded-lg border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                No disponible para compra. Sigue visible en el catálogo.
              </p>
            )}
          </div>

          {producto.subcategorias && (
            <p className="mt-6 text-xs text-muted-foreground">
              Subcategoría: {producto.subcategorias.nombre}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
