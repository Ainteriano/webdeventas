"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Copy, Download } from "lucide-react";
import { useCart } from "@/store/cart";
import { checkoutSchema } from "@/lib/validations";
import { formatPrice, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ComprobanteUpload } from "@/components/storefront/comprobante-upload";
import { descargarPedidoPdf, type PedidoPdfData } from "@/lib/pedido-pdf";

const checkoutFormSchema = checkoutSchema.omit({ items: true });
type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

type Step = "form" | "upload" | "summary" | "done";
type PedidoResumen = PedidoPdfData;

export function CheckoutForm({
  linkPagoActivo,
  comercio,
}: {
  linkPagoActivo: boolean;
  comercio: PedidoPdfData["comercio"];
}) {
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total);
  const clear = useCart((s) => s.clear);
  const [serverError, setServerError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("form");
  const [pedido, setPedido] = useState<PedidoResumen | null>(null);
  const [copied, setCopied] = useState(false);
  const pdfAutoDone = useRef(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      nombre: "",
      telefono: "",
      correo: "",
      direccion: "",
      notas: "",
      banco: "",
      metodo_pago: "TRANSFERENCIA",
    },
  });

  const metodo = watch("metodo_pago");

  // Auto-descargar PDF al entrar al resumen
  useEffect(() => {
    if (step !== "summary" || !pedido || pdfAutoDone.current) return;
    pdfAutoDone.current = true;
    const t = window.setTimeout(() => {
      try {
        descargarPedidoPdf(pedido);
      } catch {
        /* el usuario puede descargar manualmente */
      }
    }, 400);
    return () => window.clearTimeout(t);
  }, [step, pedido]);

  if (items.length === 0 && step === "form") {
    return (
      <div className="rounded-xl border border-dashed bg-muted/40 px-6 py-16 text-center">
        <p className="text-muted-foreground">No hay productos en el carrito.</p>
        <Button asChild className="mt-4">
          <Link href="/catalogo">Ir al catálogo</Link>
        </Button>
      </div>
    );
  }

  // Paso: Resumen + PDF (antes de cerrar)
  if (step === "summary" && pedido) {
    return (
      <div className="mx-auto max-w-2xl space-y-5 animate-fade-in">
        <div className="rounded-xl border-2 border-amber-400/60 bg-amber-50 px-5 py-4 text-center">
          <p className="text-base font-semibold text-amber-950">
            ¡No olvides guardar el número de seguimiento, es muy importante!
          </p>
          <p className="mt-3 font-mono text-2xl font-bold tracking-wider text-foreground sm:text-3xl">
            {pedido.codigo}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(pedido.codigo);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2000);
                } catch {
                  /* ignore */
                }
              }}
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? "Copiado" : "Copiar código"}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => descargarPedidoPdf(pedido)}
            >
              <Download className="h-3.5 w-3.5" />
              Descargar PDF
            </Button>
          </div>
          <p className="mt-3 text-xs text-amber-900/80">
            El PDF se descarga automáticamente. Si no aparece, tócalo arriba.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5 sm:p-6">
          <h2 className="font-display text-xl">Resumen del pedido</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDate(pedido.created_at)}
          </p>

          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Cliente</dt>
              <dd className="font-medium">{pedido.nombre}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Teléfono</dt>
              <dd>{pedido.telefono}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Correo</dt>
              <dd>{pedido.correo}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Banco de origen</dt>
              <dd>{pedido.banco}</dd>
            </div>
            {pedido.direccion ? (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Dirección</dt>
                <dd className="whitespace-pre-line">{pedido.direccion}</dd>
              </div>
            ) : null}
          </dl>

          <ul className="mt-6 space-y-2 border-t pt-4 text-sm">
            {pedido.items.map((item, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span>
                  {item.nombre}
                  {item.talla ? ` · Talla ${item.talla}` : ""} × {item.cantidad}
                </span>
                <span>{formatPrice(item.precio * item.cantidad)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t pt-4 text-lg font-semibold">
            <span>Total</span>
            <span className="text-primary">{formatPrice(pedido.total)}</span>
          </div>
        </div>

        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={() => setStep("done")}
        >
          Completar
        </Button>
      </div>
    );
  }

  // Paso final: compra enviada / pendiente
  if (step === "done" && pedido) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border bg-card px-6 py-14 text-center shadow-sm animate-fade-in">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <h2 className="mt-6 font-display text-3xl">Compra realizada</h2>
        <p className="mt-3 text-muted-foreground">
          Tu pedido está pendiente de confirmación. Guarda tu código de
          seguimiento.
        </p>
        <p className="mt-5 font-mono text-xl font-semibold tracking-wide">
          {pedido.codigo}
        </p>
        <div className="mt-8 flex w-full flex-col gap-2">
          <Button asChild size="lg">
            <Link href={`/seguimiento/${pedido.codigo}`}>Ver seguimiento</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => descargarPedidoPdf(pedido)}
          >
            <Download className="h-4 w-4" />
            Descargar PDF otra vez
          </Button>
          <Button asChild variant="ghost">
            <Link href="/catalogo">Volver al catálogo</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Paso: Subir comprobante
  if (step === "upload" && pedido) {
    return (
      <div className="mx-auto max-w-lg space-y-6 rounded-xl border bg-card p-6 shadow-sm">
        <div>
          <h2 className="font-display text-2xl">Sube tu comprobante</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Pedido{" "}
            <span className="font-mono font-semibold text-foreground">
              {pedido.codigo}
            </span>
          </p>
        </div>
        {pedido.id ? (
          <ComprobanteUpload
            pedidoId={pedido.id}
            onSuccess={({ pedido: p, comercio: c }) => {
              pdfAutoDone.current = false;
              setPedido({
                ...p,
                id: p.id || pedido.id,
                comercio: c,
              });
              setStep("summary");
            }}
          />
        ) : (
          <p className="text-sm text-destructive">
            No se encontró el ID del pedido. Recarga e intenta de nuevo.
          </p>
        )}
      </div>
    );
  }

  async function onSubmit(values: CheckoutFormValues) {
    setServerError(null);

    for (const i of items) {
      const max = Math.max(0, Math.floor(Number(i.stock) || 0));
      if (i.cantidad > max) {
        setServerError(
          `Stock insuficiente para "${i.nombre}" (máximo ${max})`
        );
        return;
      }
    }

    const payload = {
      ...values,
      direccion: values.direccion?.trim() || "",
      notas: "",
      items: items.map((i) => ({
        producto_id: i.producto_id,
        cantidad: i.cantidad,
      })),
    };

    const parsed = checkoutSchema.safeParse(payload);
    if (!parsed.success) {
      setServerError(parsed.error.errors[0]?.message || "Datos inválidos");
      return;
    }

    try {
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.error || data.message || "No se pudo crear el pedido"
        );
      }

      const created = data.pedido;
      clear();
      setPedido({
        id: created.id,
        codigo: created.codigo,
        nombre: created.nombre,
        telefono: created.telefono,
        correo: created.correo,
        direccion: created.direccion || "",
        notas: "",
        banco: created.banco,
        total: Number(created.total),
        metodo_pago: created.metodo_pago,
        created_at: created.created_at,
        items: created.items || [],
        comercio: data.comercio || comercio,
      });
      setStep("upload");
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Error al crear el pedido"
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-8 lg:grid-cols-[1fr_300px]"
    >
      <div className="space-y-5 rounded-xl border bg-card/70 p-5 sm:p-6">
        <h2 className="font-display text-xl">Datos de entrega</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="nombre">Nombre completo</Label>
            <Input id="nombre" {...register("nombre")} autoComplete="name" />
            {errors.nombre && (
              <p className="text-sm text-destructive">{errors.nombre.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              {...register("telefono")}
              autoComplete="tel"
              inputMode="tel"
            />
            {errors.telefono && (
              <p className="text-sm text-destructive">
                {errors.telefono.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="correo">Correo</Label>
            <Input
              id="correo"
              type="email"
              {...register("correo")}
              autoComplete="email"
            />
            {errors.correo && (
              <p className="text-sm text-destructive">{errors.correo.message}</p>
            )}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="direccion">
              Dirección{" "}
              <span className="font-normal text-muted-foreground">
                (opcional)
              </span>
            </Label>
            <Textarea
              id="direccion"
              rows={2}
              {...register("direccion")}
              autoComplete="street-address"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="banco">Banco de origen del depósito</Label>
            <Input
              id="banco"
              placeholder="Ej. BAC, Banpaís, Ficohsa…"
              {...register("banco")}
            />
            {errors.banco && (
              <p className="text-sm text-destructive">{errors.banco.message}</p>
            )}
          </div>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Método de pago</legend>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
            <input
              type="radio"
              value="TRANSFERENCIA"
              className="mt-1"
              {...register("metodo_pago")}
            />
            <span className="font-medium">Transferencia bancaria</span>
          </label>
          <label
            className={`flex items-start gap-3 rounded-lg border p-3 ${
              linkPagoActivo
                ? "cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                : "cursor-not-allowed opacity-60"
            }`}
          >
            <input
              type="radio"
              value="LINK_PAGO"
              className="mt-1"
              disabled={!linkPagoActivo}
              {...register("metodo_pago")}
            />
            <span className="font-medium">
              Link de pago
              {!linkPagoActivo && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  Próximamente
                </span>
              )}
            </span>
          </label>
        </fieldset>

        {serverError && (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {serverError}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full sm:w-auto"
          disabled={isSubmitting || (metodo === "LINK_PAGO" && !linkPagoActivo)}
        >
          {isSubmitting ? "Creando pedido…" : "Continuar"}
        </Button>
      </div>

      <aside className="h-fit rounded-xl border bg-card p-5 shadow-sm lg:sticky lg:top-24">
        <h2 className="font-display text-lg">Tu pedido</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {items.map((i) => (
            <li key={i.producto_id} className="flex justify-between gap-2">
              <span className="text-muted-foreground">
                {i.nombre}
                {i.talla ? ` · T${i.talla}` : ""} × {i.cantidad}
              </span>
              <span className="tabular-nums">
                {formatPrice(i.precio * i.cantidad)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t pt-4 font-semibold">
          <span>Total</span>
          <span className="tabular-nums text-primary">
            {formatPrice(total())}
          </span>
        </div>
        <Button asChild variant="ghost" size="sm" className="mt-3 w-full">
          <Link href="/carrito">Editar carrito</Link>
        </Button>
      </aside>
    </form>
  );
}
