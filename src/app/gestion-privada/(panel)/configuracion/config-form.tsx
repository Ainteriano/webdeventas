"use client";

import { useState, useTransition } from "react";
import type { ConfiguracionSitio } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { actualizarConfiguracion } from "./actions";

export function ConfigForm({ config }: { config: ConfiguracionSitio }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [linkPago, setLinkPago] = useState(config.link_pago_activo);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOk(false);
    const fd = new FormData(e.currentTarget);
    fd.set("link_pago_activo", linkPago ? "true" : "false");

    startTransition(async () => {
      const res = await actualizarConfiguracion(fd);
      if (res?.error) setError(res.error);
      else setOk(true);
    });
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-5">
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {ok && (
        <p className="rounded-md bg-emerald-100 px-3 py-2 text-sm text-emerald-800">
          Configuración guardada.
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="nombre_negocio">Nombre del negocio</Label>
        <Input
          id="nombre_negocio"
          name="nombre_negocio"
          required
          defaultValue={config.nombre_negocio}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="logo_url">URL del logo</Label>
        <Input
          id="logo_url"
          name="logo_url"
          type="url"
          placeholder="https://…"
          defaultValue={config.logo_url || ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="whatsapp">WhatsApp</Label>
        <Input
          id="whatsapp"
          name="whatsapp"
          required
          placeholder="5215512345678"
          defaultValue={config.whatsapp}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mensaje_whatsapp">Mensaje predeterminado WhatsApp</Label>
        <Textarea
          id="mensaje_whatsapp"
          name="mensaje_whatsapp"
          rows={2}
          defaultValue={config.mensaje_whatsapp}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="direccion">Dirección</Label>
        <Textarea
          id="direccion"
          name="direccion"
          rows={2}
          defaultValue={config.direccion}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="maps_embed_url">URL embed de mapa</Label>
        <Textarea
          id="maps_embed_url"
          name="maps_embed_url"
          rows={2}
          placeholder="https://www.google.com/maps/embed?…"
          defaultValue={config.maps_embed_url}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="horarios">Horarios</Label>
        <Textarea
          id="horarios"
          name="horarios"
          rows={3}
          defaultValue={config.horarios}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="datos_bancarios">Datos bancarios</Label>
        <Textarea
          id="datos_bancarios"
          name="datos_bancarios"
          rows={5}
          defaultValue={config.datos_bancarios}
        />
      </div>

      <div className="flex items-center justify-between rounded-md border px-3 py-3">
        <div>
          <Label htmlFor="link_pago">Link de pago activo</Label>
          <p className="text-xs text-muted-foreground">
            Permite ofrecer método LINK_PAGO en el checkout.
          </p>
        </div>
        <Switch
          id="link_pago"
          checked={linkPago}
          onCheckedChange={setLinkPago}
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar configuración"}
      </Button>
    </form>
  );
}
