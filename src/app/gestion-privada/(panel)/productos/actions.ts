"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, getAdminPath } from "@/lib/admin";
import { slugify } from "@/lib/utils";
import {
  moverProductosSchema,
  productoRapidoSchema,
  productoSchema,
} from "@/lib/validations";

async function assertAdmin() {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) throw new Error("No autorizado");
}

function revalidateProductos() {
  const base = getAdminPath();
  revalidatePath(`${base}/productos`);
  revalidatePath("/catalogo");
  revalidatePath("/");
}

export async function crearProducto(input: unknown) {
  await assertAdmin();
  const parsed = productoSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Datos inválidos", details: parsed.error.flatten() };
  }
  const data = parsed.data;
  const slug = data.slug?.trim() || slugify(data.nombre);
  const supabase = createClient();
  const { data: row, error } = await supabase
    .from("productos")
    .insert({
      ...data,
      slug,
      subcategoria_id: data.subcategoria_id || null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidateProductos();
  return { ok: true, id: row.id };
}

export async function actualizarProducto(id: string, input: unknown) {
  await assertAdmin();
  const parsed = productoSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Datos inválidos", details: parsed.error.flatten() };
  }
  const data = parsed.data;
  const slug = data.slug?.trim() || slugify(data.nombre);
  const supabase = createClient();
  const { error } = await supabase
    .from("productos")
    .update({
      ...data,
      slug,
      subcategoria_id: data.subcategoria_id || null,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidateProductos();
  return { ok: true };
}

export async function edicionRapidaProducto(input: unknown) {
  await assertAdmin();
  const parsed = productoRapidoSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };
  const { id, precio, stock } = parsed.data;
  const patch: Record<string, number> = {};
  if (precio !== undefined) patch.precio = precio;
  if (stock !== undefined) patch.stock = stock;
  if (Object.keys(patch).length === 0) return { error: "Nada que actualizar" };
  const supabase = createClient();
  const { error } = await supabase.from("productos").update(patch).eq("id", id);
  if (error) return { error: error.message };
  revalidateProductos();
  return { ok: true };
}

export async function toggleProducto(
  id: string,
  field: "disponible" | "activo",
  value: boolean
) {
  await assertAdmin();
  const supabase = createClient();
  const { error } = await supabase
    .from("productos")
    .update({ [field]: value })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidateProductos();
  return { ok: true };
}

export async function eliminarProducto(id: string) {
  await assertAdmin();
  const supabase = createClient();
  // Borrar imágenes de storage asociadas
  const { data: imgs } = await supabase
    .from("producto_imagenes")
    .select("url")
    .eq("producto_id", id);

  const { error } = await supabase.from("productos").delete().eq("id", id);
  if (error) return { error: error.message };

  // Intentar limpiar storage si las URLs son del bucket productos
  if (imgs?.length) {
    const paths = imgs
      .map((i) => {
        const marker = "/storage/v1/object/public/productos/";
        const idx = i.url.indexOf(marker);
        return idx >= 0 ? i.url.slice(idx + marker.length) : null;
      })
      .filter(Boolean) as string[];
    if (paths.length) {
      await supabase.storage.from("productos").remove(paths);
    }
  }

  revalidateProductos();
  return { ok: true };
}

export async function moverProductos(input: unknown) {
  await assertAdmin();
  const parsed = moverProductosSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };
  const { producto_ids, categoria_id, subcategoria_id } = parsed.data;
  const supabase = createClient();
  const { error } = await supabase
    .from("productos")
    .update({
      categoria_id,
      subcategoria_id: subcategoria_id ?? null,
    })
    .in("id", producto_ids);
  if (error) return { error: error.message };
  revalidateProductos();
  return { ok: true };
}

export async function toggleMasivo(
  producto_ids: string[],
  field: "disponible" | "activo",
  value: boolean
) {
  await assertAdmin();
  if (!producto_ids.length) return { error: "Selecciona productos" };
  const supabase = createClient();
  const { error } = await supabase
    .from("productos")
    .update({ [field]: value })
    .in("id", producto_ids);
  if (error) return { error: error.message };
  revalidateProductos();
  return { ok: true };
}

export async function subirImagenProducto(productoId: string, formData: FormData) {
  await assertAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Archivo requerido" };
  if (file.size > 5 * 1024 * 1024) return { error: "Máximo 5 MB" };
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) return { error: "Formato no permitido" };

  // Storage + DB con service role para evitar fallos de RLS en Storage
  const admin = createAdminClient();
  const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
  const path = `${productoId}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await admin.storage
    .from("productos")
    .upload(path, buffer, { contentType: file.type, upsert: false });
  if (upErr) return { error: upErr.message };

  const { data: pub } = admin.storage.from("productos").getPublicUrl(path);

  const { data: existing } = await admin
    .from("producto_imagenes")
    .select("id")
    .eq("producto_id", productoId);

  const esPrincipal = !existing?.length;
  const orden = existing?.length || 0;

  const { error: dbErr } = await admin.from("producto_imagenes").insert({
    producto_id: productoId,
    url: pub.publicUrl,
    orden,
    es_principal: esPrincipal,
  });
  if (dbErr) return { error: dbErr.message };

  revalidateProductos();
  return { ok: true, url: pub.publicUrl };
}

export async function eliminarImagenProducto(imagenId: string) {
  await assertAdmin();
  const supabase = createClient();
  const { data: img } = await supabase
    .from("producto_imagenes")
    .select("*")
    .eq("id", imagenId)
    .maybeSingle();
  if (!img) return { error: "Imagen no encontrada" };

  const { error } = await supabase
    .from("producto_imagenes")
    .delete()
    .eq("id", imagenId);
  if (error) return { error: error.message };

  const marker = "/storage/v1/object/public/productos/";
  const idx = img.url.indexOf(marker);
  if (idx >= 0) {
    await supabase.storage
      .from("productos")
      .remove([img.url.slice(idx + marker.length)]);
  }

  if (img.es_principal) {
    const { data: next } = await supabase
      .from("producto_imagenes")
      .select("id")
      .eq("producto_id", img.producto_id)
      .order("orden")
      .limit(1)
      .maybeSingle();
    if (next) {
      await supabase
        .from("producto_imagenes")
        .update({ es_principal: true })
        .eq("id", next.id);
    }
  }

  revalidateProductos();
  return { ok: true };
}

export async function setImagenPrincipal(imagenId: string) {
  await assertAdmin();
  const supabase = createClient();
  const { data: img } = await supabase
    .from("producto_imagenes")
    .select("producto_id")
    .eq("id", imagenId)
    .maybeSingle();
  if (!img) return { error: "Imagen no encontrada" };

  await supabase
    .from("producto_imagenes")
    .update({ es_principal: false })
    .eq("producto_id", img.producto_id);
  const { error } = await supabase
    .from("producto_imagenes")
    .update({ es_principal: true })
    .eq("id", imagenId);
  if (error) return { error: error.message };
  revalidateProductos();
  return { ok: true };
}

export async function reordenarImagenes(
  productoId: string,
  ordenIds: string[]
) {
  await assertAdmin();
  const supabase = createClient();
  for (let i = 0; i < ordenIds.length; i++) {
    await supabase
      .from("producto_imagenes")
      .update({ orden: i })
      .eq("id", ordenIds[i])
      .eq("producto_id", productoId);
  }
  revalidateProductos();
  return { ok: true };
}

/** Reemplaza una foto existente (útil si se subió equivocada). */
export async function reemplazarImagenProducto(
  imagenId: string,
  formData: FormData
) {
  await assertAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Archivo requerido" };
  if (file.size > 5 * 1024 * 1024) return { error: "Máximo 5 MB" };
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) return { error: "Formato no permitido" };

  const admin = createAdminClient();
  const { data: img } = await admin
    .from("producto_imagenes")
    .select("*")
    .eq("id", imagenId)
    .maybeSingle();
  if (!img) return { error: "Imagen no encontrada" };

  const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
  const path = `${img.producto_id}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await admin.storage
    .from("productos")
    .upload(path, buffer, { contentType: file.type, upsert: false });
  if (upErr) return { error: upErr.message };

  const { data: pub } = admin.storage.from("productos").getPublicUrl(path);

  const { error: dbErr } = await admin
    .from("producto_imagenes")
    .update({ url: pub.publicUrl })
    .eq("id", imagenId);
  if (dbErr) return { error: dbErr.message };

  const marker = "/storage/v1/object/public/productos/";
  const idx = img.url.indexOf(marker);
  if (idx >= 0) {
    await admin.storage
      .from("productos")
      .remove([img.url.slice(idx + marker.length)]);
  }

  revalidateProductos();
  return { ok: true, url: pub.publicUrl };
}
