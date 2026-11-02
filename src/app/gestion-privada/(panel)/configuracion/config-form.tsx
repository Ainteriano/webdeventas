"use client";

import { useState, useTransition } from "react";
import type { ConfiguracionSitio } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { actualizarConfiguracion } from "./actions";

type Fields = {
  whatsapp: string;
  mensaje_whatsapp: string;
  direccion: string;
  maps_embed_url: string;
  horarios: string;
};

function fromConfig(config: ConfiguracionSitio): Fields {
  return {
    whatsapp: config.whatsapp || "",
    mensaje_whatsapp: config.mensaje_whatsapp || "",
    direccion: config.direccion || "",
    maps_embed_url: config.maps_embed_url || "",
    horarios: config.horarios || "",
  };
}

export function ConfigForm({ config }: { config: ConfiguracionSitio }) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [saved, setSaved] = useState<Fields>(() => fromConfig(config));
  const [draft, setDraft] = useState<Fields>(() => fromConfig(config));

  function setField<K extends keyof Fields>(key: K, value: Fields[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function startEdit() {
    setError(null);
    setOk(false);
    setDraft(saved);
    setEditing(true);
  }

  function discard() {
    setError(null);
    setOk(false);
    setDraft(saved);
    setEditing(false);
  }

  function save() {
    setError(null);
    setOk(false);
    const fd = new FormData();
    fd.set("whatsapp", draft.whatsapp);
    fd.set("mensaje_whatsapp", draft.mensaje_whatsapp);
    fd.set("direccion", draft.direccion);
    fd.set("maps_embed_url", draft.maps_embed_url);
    fd.set("horarios", draft.horarios);

    startTransition(async () => {
      const res = await actualizarConfiguracion(fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setSaved(draft);
      setEditing(false);
      setOk(true);
    });
  }

  const values = editing ? draft : saved;

  return (
    <div className="space-y-5">
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {ok && !editing && (
        <p className="rounded-md bg-emerald-100 px-3 py-2 text-sm text-emerald-800">
          Cambios guardados
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        {!editing ? (
          <Button type="button" onClick={startEdit}>
            Editar
          </Button>
        ) : (
          <>
            <Button type="button" onClick={save} disabled={pending}>
              {pending ? "Guardando…" : "Guardar cambios"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={discard}
              disabled={pending}
            >
              Descartar cambios
            </Button>
          </>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="whatsapp">WhatsApp</Label>
        <Input
          id="whatsapp"
          value={values.whatsapp}
          readOnly={!editing}
          disabled={!editing}
          onChange={(e) => setField("whatsapp", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mensaje_whatsapp">Mensaje WhatsApp</Label>
        <Textarea
          id="mensaje_whatsapp"
          rows={2}
          value={values.mensaje_whatsapp}
          readOnly={!editing}
          disabled={!editing}
          onChange={(e) => setField("mensaje_whatsapp", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="direccion">Dirección</Label>
        <Textarea
          id="direccion"
          rows={2}
          value={values.direccion}
          readOnly={!editing}
          disabled={!editing}
          onChange={(e) => setField("direccion", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="maps_embed_url">URL del mapa</Label>
        <Textarea
          id="maps_embed_url"
          rows={2}
          value={values.maps_embed_url}
          readOnly={!editing}
          disabled={!editing}
          onChange={(e) => setField("maps_embed_url", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="horarios">Horarios</Label>
        <Textarea
          id="horarios"
          rows={3}
          value={values.horarios}
          readOnly={!editing}
          disabled={!editing}
          onChange={(e) => setField("horarios", e.target.value)}
        />
      </div>
    </div>
  );
}
