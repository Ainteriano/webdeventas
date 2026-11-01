"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Copy, Download } from "lucide-react";
import { useCart } from "@/store/cart";
import { checkoutSchema } from "@/lib/validations";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ComprobanteUpload } from "@/components/storefront/comprobante-upload";
import { descargarPedidoPdf, type PedidoPdfData } from "@/lib/pedido-pdf";
import { scrollToPageTop } from "@/lib/scroll-top";

const checkoutFormSchema = checkoutSchema.omit({ items: true });
type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

type Step = "form" | "upload" | "confirm" | "done";
type PedidoResumen = PedidoPdfData;
type CheckoutDraft = z.infer<typeof checkoutSchema>;

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
  const [draft, setDraft] = useState<CheckoutDraft | null>(null);
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
  const [comprobantePreview, setComprobantePreview] = useState<string | null>(
    null
  );
  const [pedido, setPedido] = useState<PedidoResumen | null>(null);
  const [completing, setCompleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

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

  function goToStep(next: Step) {
    setStep(next);
    scrollToPageTop();
    window.setTimeout(() => {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      scrollToPageTop();
    }, 50);
  }

  // Al cambiar de paso, siempre subir al inicio
  useEffect(() => {
    scrollToPageTop();
    topRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
  }, [step]);

  useEffect(() => {
    return () => {
      if (comprobantePreview) URL.revokeObjectURL(comprobantePreview);
    };
  }, [comprobantePreview]);

  if (items.length === 0 && step === "form") {
    return (
      <div className="rounded-xl border border-dashed bg-muted/40 px-4 py-12 text-center sm:px-6 sm:py-16">
        <p className="text-muted-foreground">No hay productos en el carrito.</p>
        <Button asChild className="mt-4">
          <Link href="/catalogo">Ir al catálogo</Link>
        </Button>
      </div>
    );
  }

  // Paso final: compra realizada
  if (step === "done" && pedido) {
    return (
      <div
        ref={topRef}
        className="mx-auto flex max-w-md flex-col items-center rounded-2xl border bg-card px-4 py-10 text-center shadow-sm animate-fade-in sm:px-6 sm:py-14"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 sm:h-20 sm:w-20">
          <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12" />
        </div>
        <h2 className="mt-6 font-display text-2xl sm:text-3xl">Compra realizada</h2>
        <p className="mt-3 text-muted-foreground">
          Tu pedido está pendiente de confirmación. Guarda tu código de
          seguimiento.
        </p>
        <p className="mt-5 break-all font-mono text-xl font-semibold tracking-wide">
          {pedido.codigo}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
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
            variant="outline"
            size="sm"
            onClick={() => descargarPedidoPdf(pedido)}
          >
            <Download className="h-3.5 w-3.5" />
            Descargar PDF
          </Button>
        </div>
        <div className="mt-8 flex w-full flex-col gap-2">
          <Button asChild size="lg">
            <Link href={`/seguimiento/${pedido.codigo}`}>Ver seguimiento</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/catalogo">Volver al catálogo</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Paso: confirmar y completar (aquí se registra el pedido)
  if (step === "confirm" && draft && comprobanteFile) {
    return (
      <div
        ref={topRef}
        className="mx-auto max-w-lg space-y-5 rounded-xl border bg-card p-4 shadow-sm sm:space-y-6 sm:p-6"
      >
        <div>
          <h2 className="font-display text-xl sm:text-2xl">Confirmar compra</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Al completar se registra tu pedido y se descarga el comprobante PDF.
            Si sales ahora, no se crea ningún pedido.
          </p>
        </div>

        {comprobantePreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={comprobantePreview}
            alt="Comprobante"
            className="mx-auto max-h-56 w-full rounded-lg border object-contain bg-muted"
          />
        )}
        <p className="truncate text-center text-sm text-muted-foreground">
          {comprobanteFile.name}
        </p>

        <div className="rounded-lg border bg-muted/30 p-4 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Cliente</span>
            <span className="font-medium">{draft.nombre}</span>
          </div>
          <div className="mt-2 flex justify-between gap-3">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold text-primary">
              {formatPrice(total())}
            </span>
          </div>
        </div>

        {serverError && (
          <p className="text-sm text-destructive">{serverError}</p>
        )}

        <Button
          type="button"
          size="lg"
          className="h-12 w-full text-base"
          disabled={completing}
          onClick={async () => {
            setServerError(null);
            setCompleting(true);
            try {
              const body = new FormData();
              body.append("comprobante", comprobanteFile);
              body.append("checkout", JSON.stringify(draft));
              const res = await fetch("/api/pedidos/completar", {
                method: "POST",
                body,
              });
              const data = await res.json().catch(() => ({}));
              if (!res.ok) {
                throw new Error(
                  data.error || data.message || "No se pudo completar la compra"
                );
              }
              const created = {
                ...data.pedido,
                comercio: data.comercio || comercio,
              } as PedidoResumen;
              clear();
              setDraft(null);
              setComprobanteFile(null);
              if (comprobantePreview) URL.revokeObjectURL(comprobantePreview);
              setComprobantePreview(null);
              setPedido(created);
              try {
                descargarPedidoPdf(created);
              } catch {
                /* el usuario puede descargar en la pantalla final */
              }
              goToStep("done");
            } catch (err) {
              setServerError(
                err instanceof Error ? err.message : "Error al completar"
              );
            } finally {
              setCompleting(false);
            }
          }}
        >
          {completing ? "Completando compra…" : "Completar compra"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          disabled={completing}
          onClick={() => {
            setServerError(null);
            goToStep("upload");
          }}
        >
          Cambiar comprobante
        </Button>
      </div>
    );
  }

  // Paso: elegir foto del comprobante (aún NO hay pedido)
  if (step === "upload" && draft) {
    return (
      <div
        ref={topRef}
        className="mx-auto max-w-lg space-y-5 rounded-xl border bg-card p-4 shadow-sm sm:space-y-6 sm:p-6"
      >
        <div>
          <h2 className="font-display text-xl sm:text-2xl">Sube tu comprobante</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Elige la foto del depósito. El pedido se registra en el siguiente
            paso.
          </p>
        </div>
        <ComprobanteUpload
          mode="pick"
          submitLabel="Subir comprobante"
          onPicked={(file) => {
            if (comprobantePreview) URL.revokeObjectURL(comprobantePreview);
            setComprobanteFile(file);
            setComprobantePreview(URL.createObjectURL(file));
            setServerError(null);
            goToStep("confirm");
          }}
        />
      </div>
    );
  }

  function onSubmit(values: CheckoutFormValues) {
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

    // Solo guarda en memoria: el registro real es al subir el comprobante
    setDraft(parsed.data);
    goToStep("upload");
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-5 lg:grid-cols-[1fr_300px] lg:gap-8"
    >
      <div ref={topRef} className="order-2 space-y-5 rounded-xl border bg-card/70 p-4 sm:p-6 lg:order-1">
        <h2 className="font-display text-lg sm:text-xl">Datos de entrega</h2>

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
          className="h-12 w-full text-base"
          disabled={isSubmitting || (metodo === "LINK_PAGO" && !linkPagoActivo)}
        >
          {isSubmitting ? "Continuando…" : "Continuar"}
        </Button>
      </div>

      <aside className="order-1 h-fit rounded-xl border bg-card p-4 shadow-sm sm:p-5 lg:order-2 lg:sticky lg:top-24">
        <h2 className="font-display text-base sm:text-lg">Tu pedido</h2>
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
