"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminPath, requireAdmin } from "@/lib/admin";
import { categoriaSchema, subcategoriaSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

async function assertAdmin() {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) throw new Error("No autorizado");
}

function revalidateCategorias() {
  revalidatePath(`${getAdminPath()}/categorias`);
  revalidatePath("/");
}

export async function crearCategoria(formData: FormData) {
  await assertAdmin();
  const parsed = categoriaSchema.safeParse({
    nombre: formData.get("nombre"),
    slug: formData.get("slug") || undefined,
    orden: formData.get("orden") || 0,
    activa: formData.get("activa") !== "false",
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || "Datos inválidos" };
  }

  const data = parsed.data;
  const slug = data.slug?.trim() || slugify(data.nombre);
  const supabase = createClient();
  const { error } = await supabase.from("categorias").insert({
    nombre: data.nombre.trim(),
    slug,
    orden: data.orden,
    activa: data.activa,
  });

  if (error) {
    return {
      error: error.message.includes("duplicate")
        ? "Ya existe una categoría con ese slug"
        : error.message,
    };
  }

  revalidateCategorias();
  return { ok: true };
}

export async function actualizarCategoria(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return { error: "ID requerido" };

  const parsed = categoriaSchema.safeParse({
    nombre: formData.get("nombre"),
    slug: formData.get("slug") || undefined,
    orden: formData.get("orden") || 0,
    activa: formData.get("activa") === "true" || formData.get("activa") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || "Datos inválidos" };
  }

  const data = parsed.data;
  const slug = data.slug?.trim() || slugify(data.nombre);
  const supabase = createClient();
  const { error } = await supabase
    .from("categorias")
    .update({
      nombre: data.nombre.trim(),
      slug,
      orden: data.orden,
      activa: data.activa,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidateCategorias();
  return { ok: true };
}

export async function eliminarCategoria(id: string) {
  await assertAdmin();
  const supabase = createClient();
  const { error } = await supabase.from("categorias").delete().eq("id", id);
  if (error) {
    return {
      error: error.message.includes("foreign key")
        ? "No se puede eliminar: hay productos asociados"
        : error.message,
    };
  }
  revalidateCategorias();
  return { ok: true };
}

export async function crearSubcategoria(formData: FormData) {
  await assertAdmin();
  const parsed = subcategoriaSchema.safeParse({
    categoria_id: formData.get("categoria_id"),
    nombre: formData.get("nombre"),
    slug: formData.get("slug") || undefined,
    orden: formData.get("orden") || 0,
    activa: formData.get("activa") !== "false",
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || "Datos inválidos" };
  }

  const data = parsed.data;
  const slug = data.slug?.trim() || slugify(data.nombre);
  const supabase = createClient();
  const { error } = await supabase.from("subcategorias").insert({
    categoria_id: data.categoria_id,
    nombre: data.nombre.trim(),
    slug,
    orden: data.orden,
    activa: data.activa,
  });

  if (error) {
    return {
      error: error.message.includes("duplicate")
        ? "Ya existe una subcategoría con ese slug"
        : error.message,
    };
  }

  revalidateCategorias();
  return { ok: true };
}

export async function actualizarSubcategoria(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return { error: "ID requerido" };

  const parsed = subcategoriaSchema.safeParse({
    categoria_id: formData.get("categoria_id"),
    nombre: formData.get("nombre"),
    slug: formData.get("slug") || undefined,
    orden: formData.get("orden") || 0,
    activa: formData.get("activa") === "true" || formData.get("activa") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || "Datos inválidos" };
  }

  const data = parsed.data;
  const slug = data.slug?.trim() || slugify(data.nombre);
  const supabase = createClient();
  const { error } = await supabase
    .from("subcategorias")
    .update({
      categoria_id: data.categoria_id,
      nombre: data.nombre.trim(),
      slug,
      orden: data.orden,
      activa: data.activa,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidateCategorias();
  return { ok: true };
}

export async function eliminarSubcategoria(id: string) {
  await assertAdmin();
  const supabase = createClient();
  const { error } = await supabase.from("subcategorias").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateCategorias();
  return { ok: true };
}

export async function toggleCategoriaActiva(id: string, activa: boolean) {
  await assertAdmin();
  const supabase = createClient();
  const { error } = await supabase
    .from("categorias")
    .update({ activa })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidateCategorias();
  return { ok: true };
}

export async function toggleSubcategoriaActiva(id: string, activa: boolean) {
  await assertAdmin();
  const supabase = createClient();
  const { error } = await supabase
    .from("subcategorias")
    .update({ activa })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidateCategorias();
  return { ok: true };
}
