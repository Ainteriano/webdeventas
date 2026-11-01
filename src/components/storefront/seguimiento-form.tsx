"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { seguimientoSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SeguimientoForm() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const normalized = codigo.trim().toUpperCase();
    const parsed = seguimientoSchema.safeParse({ codigo: normalized });
    if (!parsed.success) {
      setError(
        parsed.error.errors[0]?.message ||
          "Código inválido. Ejemplo: PED-ABC123"
      );
      return;
    }
    router.push(`/seguimiento/${parsed.data.codigo.toUpperCase()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border bg-card/70 p-5 sm:p-6"
    >
      <div className="space-y-2">
        <Label htmlFor="codigo">Código de pedido</Label>
        <Input
          id="codigo"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="PED-XXXXXX"
          autoComplete="off"
          className="uppercase"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <Button type="submit" className="w-full" size="lg">
        <Search className="h-4 w-4" />
        Consultar
      </Button>
    </form>
  );
}
