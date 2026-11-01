import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAdminPath } from "@/lib/admin";
import type { Categoria, Producto, Subcategoria } from "@/types/database";
import { Button } from "@/components/ui/button";
import { ProductosTabla } from "./productos-tabla";

export default async function ProductosPage() {
  const supabase = createClient();
  const adminPath = getAdminPath();

  const [{ data: productos }, { data: cats }, { data: subs }] =
    await Promise.all([
      supabase
        .from("productos")
        .select(
          `*, producto_imagenes(*), categorias(id, nombre, slug), subcategorias(id, nombre, slug)`
        )
        .order("created_at", { ascending: false }),
      supabase.from("categorias").select("*").order("orden"),
      supabase.from("subcategorias").select("*").order("orden"),
    ]);

  const list = ((productos || []) as Producto[]).map((p) => ({
    ...p,
    precio: Number(p.precio),
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Productos</h1>
        <Button asChild>
          <Link href={`${adminPath}/productos/nuevo`}>
            <Plus className="h-4 w-4" />
            Nuevo
          </Link>
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
