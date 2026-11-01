import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCategorias, getConfiguracion, getProductos } from "@/lib/data";
import { ProductCard } from "@/components/storefront/product-card";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const [config, categorias, recientes] = await Promise.all([
    getConfiguracion(),
    getCategorias(),
    getProductos({ limit: 8 }),
  ]);

  const nombre = config?.nombre_negocio || "Catálogo de Ventas";

  return (
    <div>
      <section className="relative min-h-[72vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1600&q=80)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/55 to-transparent" />
        <div className="relative mx-auto flex min-h-[72vh] max-w-6xl flex-col justify-center px-4 py-20 text-white">
          <p className="animate-fade-in font-display text-4xl sm:text-6xl md:text-7xl">
            {nombre}
          </p>
          <p className="mt-2 text-sm uppercase tracking-[0.2em] text-white/70 sm:text-base">
            Outlet Shoes San Pedro Sula
          </p>
          <p className="mt-4 max-w-md animate-slide-up text-base text-white/85 sm:text-lg">
            Zapatos para hombre, mujer e infantil. Pide en línea con
            transferencia en lempiras y seguimiento de tu pedido.
          </p>
          <div className="mt-8 flex animate-slide-up flex-wrap gap-3">
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90">
              <Link href="/catalogo">
                Ver catálogo <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-white/10 text-white hover:bg-white/20"
            >
              <Link href="/ubicacion">Visítanos</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl">Categorías</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Explora por tipo de producto
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {categorias.map((c, i) => (
            <Link
              key={c.id}
              href={`/catalogo?categoria=${c.slug}`}
              className="group rounded-xl border bg-card/70 p-6 transition hover:border-primary/40 hover:shadow-md"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <h3 className="font-display text-xl group-hover:text-primary">
                {c.nombre}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Ver productos →
              </p>
            </Link>
          ))}
          {categorias.length === 0 && (
            <p className="text-muted-foreground">
              Aún no hay categorías. Configura el panel admin y el seed.
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl">Recientes</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Lo último en el catálogo
            </p>
          </div>
          <Button asChild variant="ghost">
            <Link href="/catalogo">Ver todo</Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {recientes.map((p) => (
            <ProductCard key={p.id} producto={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
