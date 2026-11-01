import { createClient } from "@/lib/supabase/server";
import type { Categoria, Subcategoria } from "@/types/database";
import { CategoriasManager } from "./categorias-manager";

export default async function CategoriasPage() {
  const supabase = createClient();

  const [{ data: cats }, { data: subs }] = await Promise.all([
    supabase.from("categorias").select("*").order("orden"),
    supabase.from("subcategorias").select("*").order("orden"),
  ]);

  const categorias = ((cats || []) as Categoria[]).map((c) => ({
    ...c,
    subcategorias: ((subs || []) as Subcategoria[]).filter(
      (s) => s.categoria_id === c.id
    ),
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Categorías</h1>
      <CategoriasManager categorias={categorias} />
    </div>
  );
}
