import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminPath } from "@/lib/admin";
import { ProductoForm } from "../producto-form";
import type { Categoria, Producto, Subcategoria } from "@/types/database";

export default async function EditarProductoPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const adminPath = getAdminPath();

  const [{ data: producto }, { data: categorias }, { data: subcategorias }] =
    await Promise.all([
      supabase
        .from("productos")
        .select("*, producto_imagenes(*)")
        .eq("id", params.id)
        .maybeSingle(),
      supabase.from("categorias").select("*").order("orden"),
      supabase.from("subcategorias").select("*").order("orden"),
    ]);

  if (!producto) notFound();

  const p = {
    ...producto,
    precio: Number(producto.precio),
  } as Producto;

  const imagenes = (producto.producto_imagenes || []).sort(
    (a: { orden: number }, b: { orden: number }) => a.orden - b.orden
  );

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Editar producto</h1>
      <ProductoForm
        producto={p}
        categorias={(categorias || []) as Categoria[]}
        subcategorias={(subcategorias || []) as Subcategoria[]}
        imagenes={imagenes}
        adminPath={adminPath}
      />
    </div>
  );
}
