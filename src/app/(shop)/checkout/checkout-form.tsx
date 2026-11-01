"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCart } from "@/store/cart";
import { checkoutSchema } from "@/lib/validations";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ComprobanteUpload } from "@/components/storefront/comprobante-upload";

const checkoutFormSchema = checkoutSchema.omit({ items: true });
type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

type PedidoCreado = {
  id: string;
  codigo: string;
  metodo_pago: string;
  payment_url?: string | null;
};

export function CheckoutForm({
  linkPagoActivo,
  datosBancarios,
}: {
  linkPagoActivo: boolean;
  datosBancarios: string;
}) {
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total);
  const clear = useCart((s) => s.clear);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pedido, setPedido] = useState<PedidoCreado | null>(null);
  const [bancarios, setBancarios] = useState(datosBancarios);

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
      metodo_pago: "TRANSFERENCIA",
    },
  });

  const metodo = watch("metodo_pago");

  if (items.length === 0 && !pedido) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/40 px-6 py-16 text-center">
        <p className="text-muted-foreground">No hay productos en el carrito.</p>
        <Button asChild className="mt-4">
          <Link href="/catalogo">Ir al catálogo</Link>
        </Button>
      </div>
    );
  }

  if (pedido) {
    return (
      <div className="mx-auto max-w-lg space-y-6 rounded-xl border bg-card p-6 shadow-sm">
        <div>
          <h2 className="font-display text-2xl">Pedido creado</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Tu código de seguimiento es{" "}
            <Link
              href={`/seguimiento/${pedido.codigo}`}
              className="font-semibold text-primary hover:underline"
            >
              {pedido.codigo}
            </Link>
          </p>
        </div>

        {pedido.metodo_pago === "TRANSFERENCIA" && (
          <>
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-sm font-semibold">Datos bancarios</p>
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                {bancarios || "Te contactaremos con los datos de transferencia."}
              </p>
            </div>
            <div>
              <p className="mb-3 text-sm font-medium">
                Sube tu comprobante de pago
              </p>
              <ComprobanteUpload pedidoId={pedido.id} />
            </div>
          </>
        )}

        {pedido.metodo_pago === "LINK_PAGO" && (
          <div className="rounded-lg border bg-muted/40 p-4 text-sm">
            {pedido.payment_url ? (
              <p>
                Continúa el pago en:{" "}
                <a
                  href={pedido.payment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline"
                >
                  Abrir enlace de pago
                </a>
              </p>
            ) : (
              <p className="text-muted-foreground">
                Recibirás el enlace de pago por correo o WhatsApp.
              </p>
            )}
          </div>
        )}

        <Button asChild variant="outline" className="w-full">
          <Link href={`/seguimiento/${pedido.codigo}`}>Ver seguimiento</Link>
        </Button>
      </div>
    );
  }

  async function onSubmit(values: CheckoutFormValues) {
    setServerError(null);
    const payload = {
      ...values,
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

      const created: PedidoCreado = data.pedido || data;
      if (data.datos_bancarios) setBancarios(data.datos_bancarios);
      clear();
      setPedido({
        id: created.id,
        codigo: created.codigo,
        metodo_pago: created.metodo_pago || parsed.data.metodo_pago,
        payment_url: created.payment_url ?? data.payment_url ?? null,
      });
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
            <Label htmlFor="direccion">Dirección</Label>
            <Textarea
              id="direccion"
              rows={3}
              {...register("direccion")}
              autoComplete="street-address"
            />
            {errors.direccion && (
              <p className="text-sm text-destructive">
                {errors.direccion.message}
              </p>
            )}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea id="notas" rows={2} {...register("notas")} />
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
            <span>
              <span className="block font-medium">Transferencia bancaria</span>
              <span className="text-xs text-muted-foreground">
                Recibirás los datos para depositar y subir el comprobante
              </span>
            </span>
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
            <span>
              <span className="block font-medium">
                Link de pago
                {!linkPagoActivo && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    Próximamente
                  </span>
                )}
              </span>
              <span className="text-xs text-muted-foreground">
                Paga en línea con un enlace seguro
              </span>
            </span>
          </label>
          {errors.metodo_pago && (
            <p className="text-sm text-destructive">
              {errors.metodo_pago.message}
            </p>
          )}
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
          {isSubmitting ? "Creando pedido…" : "Confirmar pedido"}
        </Button>
      </div>

      <aside className="h-fit rounded-xl border bg-card p-5 shadow-sm lg:sticky lg:top-24">
        <h2 className="font-display text-lg">Tu pedido</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {items.map((i) => (
            <li key={i.producto_id} className="flex justify-between gap-2">
              <span className="text-muted-foreground">
                {i.nombre} × {i.cantidad}
              </span>
              <span className="tabular-nums">
                {formatPrice(i.precio * i.cantidad)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t pt-4 font-semibold">
          <span>Total</span>
          <span className="tabular-nums text-primary">{formatPrice(total())}</span>
        </div>
        <Button asChild variant="ghost" size="sm" className="mt-3 w-full">
          <Link href="/carrito">Editar carrito</Link>
        </Button>
      </aside>
    </form>
  );
}
