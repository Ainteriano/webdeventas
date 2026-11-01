"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  COMPROBANTE_MIME,
  MAX_COMPROBANTE_BYTES,
} from "@/lib/validations";

export function ComprobanteUpload({
  pedidoId,
  onSuccess,
}: {
  pedidoId: string;
  onSuccess?: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Selecciona un archivo");
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
        throw new Error(data.error || data.message || "No se pudo subir el comprobante");
      }
      setDone(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Comprobante enviado. Revisaremos tu pago y actualizaremos el estado del pedido.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="comprobante">Comprobante de pago (JPG, PNG o PDF, máx. 5 MB)</Label>
        <Input
          id="comprobante"
          type="file"
          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading || !file}>
        <Upload className="h-4 w-4" />
        {loading ? "Subiendo…" : "Subir comprobante"}
      </Button>
    </form>
  );
}
