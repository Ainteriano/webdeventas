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
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Nuevo producto</h1>
        <p className="text-sm text-muted-foreground">
          Guarda el producto y luego agrega fotos en la edición
        </p>
      </div>
      <ProductoForm
        categorias={(categorias || []) as Categoria[]}
        subcategorias={(subcategorias || []) as Subcategoria[]}
        adminPath={adminPath}
      />
    </div>
  );
}
