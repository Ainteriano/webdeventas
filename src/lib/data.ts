import { createClient } from "@/lib/supabase/server";
import type {
  Categoria,
  ConfiguracionSitio,
  Producto,
  Subcategoria,
} from "@/types/database";

function hasSupabaseEnv() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function getConfiguracion(): Promise<ConfiguracionSitio | null> {
  if (!hasSupabaseEnv()) return null;
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("configuracion_sitio")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}

export async function getCategorias(): Promise<Categoria[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("categorias")
      .select("*")
      .eq("activa", true)
      .order("orden");
    return data || [];
  } catch {
    return [];
  }
}

export async function getSubcategorias(
  categoriaId?: string
): Promise<Subcategoria[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createClient();
    let query = supabase
      .from("subcategorias")
      .select("*")
      .eq("activa", true)
      .order("orden");
    if (categoriaId) query = query.eq("categoria_id", categoriaId);
    const { data } = await query;
    return data || [];
  } catch {
    return [];
  }
}

export async function getProductos(opts?: {
  categoriaSlug?: string;
  subcategoriaSlug?: string;
  q?: string;
  orden?: string;
  limit?: number;
}): Promise<Producto[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createClient();
    let query = supabase
      .from("productos")
      .select(
        `*, producto_imagenes(*), categorias!inner(id, nombre, slug), subcategorias(id, nombre, slug)`
      )
      .eq("activo", true);

    if (opts?.categoriaSlug) {
      query = query.eq("categorias.slug", opts.categoriaSlug);
    }
    if (opts?.q) {
      query = query.ilike("nombre", `%${opts.q}%`);
    }
    if (opts?.limit) {
      query = query.limit(opts.limit);
    }

    switch (opts?.orden) {
      case "precio_asc":
        query = query.order("precio", { ascending: true });
        break;
      case "precio_desc":
        query = query.order("precio", { ascending: false });
        break;
      case "nombre":
        query = query.order("nombre", { ascending: true });
        break;
      default:
        query = query.order("created_at", { ascending: false });
    }

    const { data } = await query;
    let productos = (data || []) as Producto[];

    if (opts?.subcategoriaSlug) {
      productos = productos.filter(
        (p) => p.subcategorias?.slug === opts.subcategoriaSlug
      );
    }

    return productos.map((p) => ({
      ...p,
      precio: Number(p.precio),
      producto_imagenes: (p.producto_imagenes || []).sort(
        (a, b) => a.orden - b.orden
      ),
    }));
  } catch {
    return [];
  }
}

export async function getProductoBySlug(
  slug: string
): Promise<Producto | null> {
  if (!hasSupabaseEnv()) return null;
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("productos")
      .select(
        `*, producto_imagenes(*), categorias(id, nombre, slug), subcategorias(id, nombre, slug)`
      )
      .eq("slug", slug)
      .eq("activo", true)
      .maybeSingle();

    if (!data) return null;
    return {
      ...data,
      precio: Number(data.precio),
      producto_imagenes: (data.producto_imagenes || []).sort(
        (a: { orden: number }, b: { orden: number }) => a.orden - b.orden
      ),
    } as Producto;
  } catch {
    return null;
  }
}

export function imagenPrincipal(producto: Producto): string | null {
  const imgs = producto.producto_imagenes || [];
  const principal = imgs.find((i) => i.es_principal) || imgs[0];
  return principal?.url || null;
}
