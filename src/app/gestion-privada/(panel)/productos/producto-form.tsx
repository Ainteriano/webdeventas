"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Replace,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { productoSchema } from "@/lib/validations";
import {
  TALLA_GENEROS,
  TALLA_NUMEROS,
  formatTallaAmericana,
  parseTallaAmericana,
} from "@/lib/tallas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  actualizarProducto,
  crearProducto,
  eliminarImagenProducto,
  eliminarProducto,
  reemplazarImagenProducto,
  reordenarImagenes,
  setImagenPrincipal,
  subirImagenProducto,
} from "./actions";
import type {
  Categoria,
  Producto,
  ProductoImagen,
  Subcategoria,
} from "@/types/database";

type FormValues = z.infer<typeof productoSchema>;
type PendingPreview = { id: string; file: File; url: string };

export function ProductoForm({
  producto,
  categorias,
  subcategorias,
  imagenes = [],
  adminPath,
}: {
  producto?: Producto | null;
  categorias: Categoria[];
  subcategorias: Subcategoria[];
  imagenes?: ProductoImagen[];
  adminPath: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [imgs, setImgs] = useState(imagenes);
  const [pendingFiles, setPendingFiles] = useState<PendingPreview[]>([]);

  useEffect(() => {
    setImgs(imagenes);
  }, [imagenes]);

  useEffect(() => {
    return () => {
      pendingFiles.forEach((p) => URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      nombre: producto?.nombre || "",
      slug: producto?.slug || "",
      descripcion: producto?.descripcion || "",
      precio: producto?.precio ?? 0,
      stock: producto?.stock ?? 1,
      talla: producto?.talla || "",
      categoria_id: producto?.categoria_id || categorias[0]?.id || "",
      subcategoria_id: producto?.subcategoria_id || null,
      disponible: producto?.disponible ?? true,
      activo: producto?.activo ?? true,
    },
  });

  const categoriaId = watch("categoria_id");
  const tallaActual = watch("talla");
  const tallaParsed = useMemo(
    () => parseTallaAmericana(tallaActual),
    [tallaActual]
  );
  const [tallaNumero, setTallaNumero] = useState(
    () => parseTallaAmericana(producto?.talla)?.numero || "8"
  );
  const [tallaGenero, setTallaGenero] = useState<"M" | "W">(
    () => parseTallaAmericana(producto?.talla)?.genero || "M"
  );

  const subs = useMemo(
    () => subcategorias.filter((s) => s.categoria_id === categoriaId),
    [subcategorias, categoriaId]
  );

  useEffect(() => {
    setValue("talla", formatTallaAmericana(tallaNumero, tallaGenero), {
      shouldValidate: true,
    });
  }, [tallaNumero, tallaGenero, setValue]);

  useEffect(() => {
    if (tallaParsed) {
      setTallaNumero(tallaParsed.numero);
      setTallaGenero(tallaParsed.genero);
    }
    // Solo al montar / cambiar producto externo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [producto?.id]);

  function validateFiles(fileList: FileList | null): File[] {
    if (!fileList?.length) return [];
    const ok: File[] = [];
    for (const file of Array.from(fileList)) {
      if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
        setError("Solo JPG, PNG o WEBP");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Máximo 5 MB por foto");
        continue;
      }
      ok.push(file);
    }
    return ok;
  }

  function addPendingFiles(fileList: FileList | null) {
    const files = validateFiles(fileList);
    if (!files.length) return;
    setError(null);
    setPendingFiles((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        url: URL.createObjectURL(file),
      })),
    ]);
  }

  function removePending(id: string) {
    setPendingFiles((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter((p) => p.id !== id);
    });
  }

  function onSubmit(values: FormValues) {
    setError(null);
    startTransition(async () => {
      if (producto) {
        const res = await actualizarProducto(producto.id, values);
        if (res.error) {
          setError(res.error);
          return;
        }
        router.push(`${adminPath}/productos`);
        router.refresh();
        return;
      }

      const res = await crearProducto(values);
      if (res.error || !("id" in res) || !res.id) {
        setError(res.error || "No se pudo crear");
        return;
      }

      for (const item of pendingFiles) {
        const fd = new FormData();
        fd.append("file", item.file);
        const up = await subirImagenProducto(res.id, fd);
        if (up.error) {
          setError(up.error);
          router.push(`${adminPath}/productos/${res.id}`);
          router.refresh();
          return;
        }
      }

      router.push(`${adminPath}/productos`);
      router.refresh();
    });
  }

  async function onUploadExisting(fileList: FileList | null) {
    if (!producto) return;
    const files = validateFiles(fileList);
    if (!files.length) return;
    setError(null);
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await subirImagenProducto(producto.id, fd);
      if (res.error) {
        setError(res.error);
        break;
      }
    }
    router.refresh();
  }

  function moveImage(index: number, dir: -1 | 1) {
    if (!producto) return;
    const next = [...imgs];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    const tmp = next[index];
    next[index] = next[swap];
    next[swap] = tmp;
    setImgs(next);
    startTransition(async () => {
      await reordenarImagenes(
        producto.id,
        next.map((i) => i.id)
      );
    });
  }

  const photoCount = producto ? imgs.length : pendingFiles.length;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Fotos */}
      <section className="space-y-3 rounded-xl border bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Fotos</h2>
          <span className="text-xs text-muted-foreground">{photoCount}</span>
        </div>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/30 px-4 py-8 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/50 hover:text-foreground"
        >
          <ImagePlus className="h-6 w-6" />
          Agregar fotos
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (producto) void onUploadExisting(e.target.files);
            else addPendingFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {!producto && pendingFiles.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {pendingFiles.map((item) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-lg border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt=""
                  className="aspect-square w-full object-cover"
                />
                <button
                  type="button"
                  className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white"
                  onClick={() => removePending(item.id)}
                  aria-label="Quitar"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {producto && imgs.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {imgs.map((img, idx) => (
              <div
                key={img.id}
                className="overflow-hidden rounded-lg border bg-muted/20"
              >
                <div className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  {img.es_principal && (
                    <span className="absolute left-1.5 top-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                      Principal
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-0.5 p-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    disabled={pending || img.es_principal}
                    onClick={() =>
                      startTransition(async () => {
                        await setImagenPrincipal(img.id);
                        setImgs((prev) =>
                          prev.map((i) => ({
                            ...i,
                            es_principal: i.id === img.id,
                          }))
                        );
                        router.refresh();
                      })
                    }
                    aria-label="Principal"
                  >
                    <Star className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    disabled={idx === 0 || pending}
                    onClick={() => moveImage(idx, -1)}
                    aria-label="Subir"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    disabled={idx === imgs.length - 1 || pending}
                    onClick={() => moveImage(idx, 1)}
                    aria-label="Bajar"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <label className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md hover:bg-muted">
                    <Replace className="h-3.5 w-3.5" />
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={pending}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file) return;
                        startTransition(async () => {
                          setError(null);
                          const fd = new FormData();
                          fd.append("file", file);
                          const res = await reemplazarImagenProducto(
                            img.id,
                            fd
                          );
                          if (res.error) {
                            setError(res.error);
                            return;
                          }
                          if (res.url) {
                            setImgs((prev) =>
                              prev.map((i) =>
                                i.id === img.id ? { ...i, url: res.url! } : i
                              )
                            );
                          }
                          router.refresh();
                        });
                      }}
                    />
                  </label>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const res = await eliminarImagenProducto(img.id);
                        if (res.error) {
                          setError(res.error);
                          return;
                        }
                        setImgs((prev) =>
                          prev.filter((i) => i.id !== img.id)
                        );
                        router.refresh();
                      })
                    }
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Datos */}
      <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
        <h2 className="text-sm font-semibold">Producto</h2>

        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" {...register("nombre")} autoFocus={!producto} />
          {errors.nombre && (
            <p className="text-sm text-destructive">{errors.nombre.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Talla americana</Label>
          <input type="hidden" {...register("talla")} />
          <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
            <Select value={tallaNumero} onValueChange={setTallaNumero}>
              <SelectTrigger>
                <SelectValue placeholder="Número" />
              </SelectTrigger>
              <SelectContent>
                {TALLA_NUMEROS.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={tallaGenero}
              onValueChange={(v) => setTallaGenero(v as "M" | "W")}
            >
              <SelectTrigger>
                <SelectValue placeholder="M / W" />
              </SelectTrigger>
              <SelectContent>
                {TALLA_GENEROS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Seleccionada:{" "}
            <span className="font-semibold text-foreground">
              {formatTallaAmericana(tallaNumero, tallaGenero)}
            </span>{" "}
            · M = Hombre · W = Mujer
          </p>
          {errors.talla && (
            <p className="text-sm text-destructive">{errors.talla.message}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="precio">Precio (L)</Label>
            <Input
              id="precio"
              type="number"
              step="0.01"
              min={0}
              {...register("precio")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stock">Stock</Label>
            <Input id="stock" type="number" min={0} {...register("stock")} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select
              value={categoriaId}
              onValueChange={(v) => {
                setValue("categoria_id", v);
                setValue("subcategoria_id", null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Elegir" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Subcategoría</Label>
            <Select
              value={watch("subcategoria_id") || "none"}
              onValueChange={(v) =>
                setValue("subcategoria_id", v === "none" ? null : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Opcional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguna</SelectItem>
                {subs.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea id="descripcion" rows={3} {...register("descripcion")} />
        </div>

        <div className="flex flex-wrap gap-6 border-t pt-4">
          <label className="flex items-center gap-3 text-sm">
            <Switch
              checked={watch("disponible")}
              onCheckedChange={(v) => setValue("disponible", v)}
            />
            Disponible
          </label>
          <label className="flex items-center gap-3 text-sm">
            <Switch
              checked={watch("activo")}
              onCheckedChange={(v) => setValue("activo", v)}
            />
            Activo
          </label>
        </div>
      </section>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending} className="min-w-[120px]">
          {producto ? "Guardar" : "Crear"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(`${adminPath}/productos`)}
        >
          Cancelar
        </Button>
        {producto && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="ml-auto text-destructive"
              >
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar?</AlertDialogTitle>
                <AlertDialogDescription>
                  {producto.nombre}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>No</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    startTransition(async () => {
                      const res = await eliminarProducto(producto.id);
                      if (res?.error) setError(res.error);
                      else {
                        router.push(`${adminPath}/productos`);
                        router.refresh();
                      }
                    })
                  }
                >
                  Sí
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </form>
  );
}
