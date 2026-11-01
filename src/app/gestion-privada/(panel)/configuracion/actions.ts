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
  link_pago_activo: z.boolean(),
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
    link_pago_activo:
      formData.get("link_pago_activo") === "on" ||
      formData.get("link_pago_activo") === "true",
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || "Datos inválidos" };
  }

  const data = parsed.data;
  const supabase = createClient();
  const { error } = await supabase
    .from("configuracion_sitio")
    .update({
      whatsapp: data.whatsapp.trim(),
      mensaje_whatsapp: data.mensaje_whatsapp,
      direccion: data.direccion,
      maps_embed_url: data.maps_embed_url,
      horarios: data.horarios,
      link_pago_activo: data.link_pago_activo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) return { error: error.message };

  revalidatePath(`${getAdminPath()}/configuracion`);
  revalidatePath("/");
  return { ok: true };
}
