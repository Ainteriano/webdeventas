"use client";

import { useRef, useState } from "react";
import { Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MAX_COMPROBANTE_BYTES } from "@/lib/validations";
import type { PedidoPdfData } from "@/lib/pedido-pdf";

const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const;

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
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onPick(fileList: FileList | null) {
    const next = fileList?.[0] || null;
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
    if (!next) return;

    const type = next.type.toLowerCase();
    const okType =
      IMAGE_TYPES.includes(type as (typeof IMAGE_TYPES)[number]) ||
      /\.(jpe?g|png|webp)$/i.test(next.name);

    if (!okType) {
      setError("Elige una foto (JPG, PNG o WEBP) de tu galería");
      return;
    }
    if (next.size > MAX_COMPROBANTE_BYTES) {
      setError("La foto no debe superar 5 MB");
      return;
    }

    setFile(next);
    setPreview(URL.createObjectURL(next));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Selecciona una foto de tu galería");
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
        <Label>Foto del comprobante</Label>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/50"
        >
          <Images className="h-8 w-8" />
          <span className="font-medium text-foreground">
            {file ? file.name : "Elegir foto de la galería"}
          </span>
          <span className="text-xs">Solo fotos · JPG o PNG · máx. 5 MB</span>
        </button>
        {/*
          Solo image/* (sin PDF ni capture):
          iOS → Fotos/Galería
          Android → suele priorizar Galería / Fotos
        */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
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
          className="mx-auto max-h-64 w-full rounded-lg border object-contain bg-muted"
        />
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        type="submit"
        disabled={loading || !file}
        className="h-12 w-full text-base"
      >
        {loading ? "Completando compra…" : "Siguiente"}
      </Button>
    </form>
  );
}
