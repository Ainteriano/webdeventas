"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  COMPROBANTE_MIME,
  MAX_COMPROBANTE_BYTES,
} from "@/lib/validations";
import type { PedidoPdfData } from "@/lib/pedido-pdf";

export function ComprobanteUpload({
  pedidoId,
  onSuccess,
}: {
  pedidoId: string;
  onSuccess?: (data: {
    pedido: PedidoPdfData;
    comercio: PedidoPdfData["comercio"];
  }) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onPick(fileList: FileList | null) {
    const next = fileList?.[0] || null;
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(next);
    if (next?.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(next));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Selecciona una foto de tu galería");
      return;
    }
    if (!COMPROBANTE_MIME.includes(file.type as (typeof COMPROBANTE_MIME)[number])) {
      setError("Formato no válido. Usa JPG, PNG o PDF.");
      return;
    }
    if (file.size > MAX_COMPROBANTE_BYTES) {
      setError("El archivo no debe superar 5 MB");
      return;
    }

    setLoading(true);
    try {
      const body = new FormData();
      body.append("comprobante", file);
      const res = await fetch(`/api/pedidos/${pedidoId}/comprobante`, {
        method: "POST",
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.error || data.message || "No se pudo subir el comprobante"
        );
      }
      onSuccess?.({
        pedido: data.pedido,
        comercio: data.comercio,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="comprobante">Foto del comprobante</Label>
        <label
          htmlFor="comprobante"
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground hover:border-primary/40 hover:bg-muted/50"
        >
          <ImageIcon className="h-8 w-8" />
          <span className="font-medium text-foreground">
            {file ? file.name : "Elegir de la galería"}
          </span>
          <span className="text-xs">JPG, PNG o PDF · máx. 5 MB</span>
        </label>
        {/* Sin capture= → en móvil abre galería / archivos, no solo cámara */}
        <input
          id="comprobante"
          type="file"
          accept="image/*,image/jpeg,image/png,image/jpg,application/pdf,.jpg,.jpeg,.png,.pdf"
          className="sr-only"
          onChange={(e) => {
            onPick(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Vista previa"
          className="max-h-56 w-full rounded-lg border object-contain bg-muted"
        />
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading || !file} className="w-full">
        {loading ? "Completando compra…" : "Siguiente"}
      </Button>
    </form>
  );
}
