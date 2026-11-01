import type { Metadata } from "next";
import { MapPin, Clock, Phone } from "lucide-react";
import { getConfiguracion } from "@/lib/data";

export const metadata: Metadata = {
  title: "Ubicación",
  description: "Dirección, horarios y cómo llegar",
};

export default async function UbicacionPage() {
  const config = await getConfiguracion();
  const direccion = config?.direccion || "Dirección por confirmar";
  const horarios = config?.horarios || "Consulta por WhatsApp";
  const telefono = config?.whatsapp || "";
  const mapsUrl = config?.maps_embed_url || "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl">Ubicación</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visítanos o consulta cómo llegar
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="overflow-hidden rounded-xl border bg-muted">
          {mapsUrl ? (
            <iframe
              title="Mapa de ubicación"
              src={mapsUrl}
              className="h-[320px] w-full border-0 sm:h-[420px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ) : (
            <div className="flex h-[280px] items-center justify-center px-6 text-center text-sm text-muted-foreground sm:h-[360px]">
              El mapa se mostrará cuando se configure la ubicación en el panel.
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border bg-card/70 p-5">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold">Dirección</p>
                <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                  {direccion}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card/70 p-5">
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold">Horarios</p>
                <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                  {horarios}
                </p>
              </div>
            </div>
          </div>

          {telefono && (
            <div className="rounded-xl border bg-card/70 p-5">
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Teléfono / WhatsApp</p>
                  <a
                    href={`https://wa.me/${telefono.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-sm text-primary hover:underline"
                  >
                    {telefono}
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
