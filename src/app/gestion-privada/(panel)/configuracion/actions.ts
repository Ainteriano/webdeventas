"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminPath, requireAdmin } from "@/lib/admin";
import { configuracionSchema } from "@/lib/validations";

export async function actualizarConfiguracion(formData: FormData) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return { error: "No autorizado" };

  const parsed = configuracionSchema.safeParse({
    nombre_negocio: formData.get("nombre_negocio"),
    logo_url: formData.get("logo_url") || "",
    whatsapp: formData.get("whatsapp"),
    mensaje_whatsapp: formData.get("mensaje_whatsapp") || "",
    direccion: formData.get("direccion") || "",
    maps_embed_url: formData.get("maps_embed_url") || "",
    horarios: formData.get("horarios") || "",
    datos_bancarios: formData.get("datos_bancarios") || "",
    link_pago_activo:
      formData.get("link_pago_activo") === "on" ||
      formData.get("link_pago_activo") === "true",
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || "Datos inválidos" };
  }

  const data = parsed.data;
  const logo =
    !data.logo_url || data.logo_url === "" ? null : data.logo_url;

  const supabase = createClient();
  const { error } = await supabase
    .from("configuracion_sitio")
    .update({
      nombre_negocio: data.nombre_negocio.trim(),
      logo_url: logo,
      whatsapp: data.whatsapp.trim(),
      mensaje_whatsapp: data.mensaje_whatsapp,
      direccion: data.direccion,
      maps_embed_url: data.maps_embed_url,
      horarios: data.horarios,
      datos_bancarios: data.datos_bancarios,
      link_pago_activo: data.link_pago_activo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) return { error: error.message };

  revalidatePath(`${getAdminPath()}/configuracion`);
  revalidatePath("/");
  revalidatePath("/layout");
  return { ok: true };
}
