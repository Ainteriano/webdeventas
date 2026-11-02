"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminPath, requireAdmin } from "@/lib/admin";
import { z } from "zod";

const ajustesSchema = z.object({
  whatsapp: z.string().min(8).max(20),
  mensaje_whatsapp: z.string().max(500),
  direccion: z.string().max(500),
  maps_embed_url: z.string().max(2000),
  horarios: z.string().max(500),
});

export async function actualizarConfiguracion(formData: FormData) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return { error: "No autorizado" };

  const parsed = ajustesSchema.safeParse({
    whatsapp: formData.get("whatsapp"),
    mensaje_whatsapp: formData.get("mensaje_whatsapp") || "",
    direccion: formData.get("direccion") || "",
    maps_embed_url: formData.get("maps_embed_url") || "",
    horarios: formData.get("horarios") || "",
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || "Datos inválidos" };
  }

  const data = parsed.data;
  const supabase = createClient();
  // link_pago_activo no se edita aquí; se controla en código / DB.
  const { error } = await supabase
    .from("configuracion_sitio")
    .update({
      whatsapp: data.whatsapp.trim(),
      mensaje_whatsapp: data.mensaje_whatsapp,
      direccion: data.direccion,
      maps_embed_url: data.maps_embed_url,
      horarios: data.horarios,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) return { error: error.message };

  revalidatePath(`${getAdminPath()}/configuracion`);
  revalidatePath("/");
  return { ok: true };
}
