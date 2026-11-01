import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAdminPath } from "@/lib/admin";
import type { Categoria, Producto, Subcategoria } from "@/types/database";
import { Button } from "@/components/ui/button";
import { ProductosTabla } from "./productos-tabla";

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: { stock?: string; q?: string };
}) {
  const supabase = createClient();
  const adminPath = getAdminPath();

  let query = supabase
    .from("productos")
    .select(
      `*, producto_imagenes(*), categorias(id, nombre, slug), subcategorias(id, nombre, slug)`
    )
    .order("created_at", { ascending: false });

  if (searchParams.stock === "0") {
    query = query.lte("stock", 0);
  }

  const [{ data: productos }, { data: cats }, { data: subs }] =
    await Promise.all([
      query,
      supabase.from("categorias").select("*").order("orden"),
      supabase.from("subcategorias").select("*").order("orden"),
    ]);

  const list = ((productos || []) as Producto[]).map((p) => ({
    ...p,
    precio: Number(p.precio),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Productos
          </h1>
          <p className="text-muted-foreground">
            Edición rápida de precio/stock, filtros y acciones masivas.
          </p>
        </div>
        <Button asChild>
          <Link href={`${adminPath}/productos/nuevo`}>Nuevo producto</Link>
        </Button>
      </div>
      <ProductosTabla
        productos={list}
        categorias={(cats || []) as Categoria[]}
        subcategorias={(subs || []) as Subcategoria[]}
        adminPath={adminPath}
      />
    </div>
  );
}
