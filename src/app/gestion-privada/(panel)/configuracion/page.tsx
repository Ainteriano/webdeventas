import { createClient } from "@/lib/supabase/server";
import type { ConfiguracionSitio } from "@/types/database";
import { ConfigForm } from "./config-form";

export default async function ConfiguracionPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("configuracion_sitio")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  const config = (data || {
    id: 1,
    nombre_negocio: "Mi Tienda",
    logo_url: null,
    whatsapp: "",
    mensaje_whatsapp: "Hola, me interesa un producto de su catálogo",
    direccion: "",
    maps_embed_url: "",
    horarios: "",
    datos_bancarios: "",
    link_pago_activo: false,
  }) as ConfiguracionSitio;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Configuración
        </h1>
        <p className="text-muted-foreground">
          Datos del negocio, contacto, mapa y pagos.
        </p>
      </div>
      <ConfigForm config={config} />
    </div>
  );
}
