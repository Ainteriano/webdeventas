import { createClient } from "@/lib/supabase/server";
import { getAdminPath } from "@/lib/admin";
import { ProductoForm } from "../producto-form";
import type { Categoria, Subcategoria } from "@/types/database";

export default async function NuevoProductoPage() {
  const supabase = createClient();
  const adminPath = getAdminPath();
  const [{ data: categorias }, { data: subcategorias }] = await Promise.all([
    supabase.from("categorias").select("*").order("orden"),
    supabase.from("subcategorias").select("*").order("orden"),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Nuevo producto</h1>
      <ProductoForm
        categorias={(categorias || []) as Categoria[]}
        subcategorias={(subcategorias || []) as Subcategoria[]}
        adminPath={adminPath}
      />
    </div>
  );
}
