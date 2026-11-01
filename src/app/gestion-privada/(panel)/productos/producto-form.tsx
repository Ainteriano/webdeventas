"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { productoSchema } from "@/lib/validations";
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
      stock: producto?.stock ?? 0,
      categoria_id: producto?.categoria_id || categorias[0]?.id || "",
      subcategoria_id: producto?.subcategoria_id || null,
      disponible: producto?.disponible ?? true,
      activo: producto?.activo ?? true,
    },
  });

  const categoriaId = watch("categoria_id");
  const subs = useMemo(
    () => subcategorias.filter((s) => s.categoria_id === categoriaId),
    [subcategorias, categoriaId]
  );

  function addPendingFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const next: PendingPreview[] = [];
    for (const file of Array.from(fileList)) {
      if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
        setError("Solo se permiten JPG, PNG o WEBP");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Cada imagen debe pesar máximo 5 MB");
        continue;
      }
      next.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        url: URL.createObjectURL(file),
      });
    }
    if (next.length) {
      setError(null);
      setPendingFiles((prev) => [...prev, ...next]);
    }
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
        setError(res.error || "No se pudo crear el producto");
        return;
      }

      for (const item of pendingFiles) {
        const fd = new FormData();
        fd.append("file", item.file);
        const up = await subirImagenProducto(res.id, fd);
        if (up.error) {
          setError(
            `Producto creado, pero falló una foto: ${up.error}. Puedes completarlas editando el producto.`
          );
          router.push(`${adminPath}/productos/${res.id}`);
          router.refresh();
          return;
        }
      }

      router.push(`${adminPath}/productos/${res.id}`);
      router.refresh();
    });
  }

  async function onUploadExisting(fileList: FileList | null) {
    if (!producto || !fileList?.length) return;
    setError(null);
    for (const file of Array.from(fileList)) {
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label>Nombre</Label>
          <Input {...register("nombre")} />
          {errors.nombre && (
            <p className="text-sm text-destructive">{errors.nombre.message}</p>
          )}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Slug (opcional)</Label>
          <Input {...register("slug")} placeholder="se-genera-automatico" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Descripción</Label>
          <Textarea rows={4} {...register("descripcion")} />
        </div>
        <div className="space-y-2">
          <Label>Precio (Lempiras)</Label>
          <Input type="number" step="0.01" {...register("precio")} />
        </div>
        <div className="space-y-2">
          <Label>Stock</Label>
          <Input type="number" {...register("stock")} />
        </div>
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
              <SelectValue placeholder="Selecciona" />
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

        <div className="space-y-2 rounded-md border p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label>Disponible para compra</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Si lo apagas, el zapato sigue en el sitio (gris, sin precio),
                pero no se puede comprar.
              </p>
            </div>
            <Switch
              checked={watch("disponible")}
              onCheckedChange={(v) => setValue("disponible", v)}
            />
          </div>
        </div>

        <div className="space-y-2 rounded-md border p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label>Activo en el catálogo</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Si lo apagas, desaparece del sitio público. No se borra de la
                base de datos.
              </p>
            </div>
            <Switch
              checked={watch("activo")}
              onCheckedChange={(v) => setValue("activo", v)}
            />
          </div>
        </div>
      </div>

      {/* Imágenes: también al crear */}
      <div className="space-y-3 rounded-lg border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-medium">Fotos del producto</h3>
            <p className="text-xs text-muted-foreground">
              JPG, PNG o WEBP · máx. 5 MB · puedes subir varias
            </p>
          </div>
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="max-w-xs"
            multiple
            onChange={(e) => {
              if (producto) void onUploadExisting(e.target.files);
              else addPendingFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {!producto && pendingFiles.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {pendingFiles.map((item, idx) => (
              <div
                key={item.id}
                className="relative overflow-hidden rounded-md border"
              >
                <div className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-between gap-1 p-1">
                  <span className="truncate px-1 text-[10px] text-muted-foreground">
                    {idx === 0 ? "Principal" : `Foto ${idx + 1}`}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => removePending(item.id)}
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {producto && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {imgs.map((img, idx) => (
              <div
                key={img.id}
                className="relative overflow-hidden rounded-md border"
              >
                <div className="relative aspect-square">
                  <Image
                    src={img.url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="150px"
                  />
                </div>
                <div className="flex flex-wrap gap-1 p-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={img.es_principal ? "default" : "outline"}
                    className="flex-1 text-xs"
                    onClick={() =>
                      startTransition(async () => {
                        await setImagenPrincipal(img.id);
                        setImgs((prev) =>
                          prev.map((i) => ({
                            ...i,
                            es_principal: i.id === img.id,
                          }))
                        );
                      })
                    }
                  >
                    Principal
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={idx === 0 || pending}
                    onClick={() => moveImage(idx, -1)}
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={idx === imgs.length - 1 || pending}
                    onClick={() => moveImage(idx, 1)}
                  >
                    ↓
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      startTransition(async () => {
                        await eliminarImagenProducto(img.id);
                        setImgs((prev) =>
                          prev.filter((i) => i.id !== img.id)
                        );
                      })
                    }
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {producto ? "Guardar cambios" : "Crear producto"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`${adminPath}/productos`)}
        >
          Volver
        </Button>
        {producto && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive">
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se eliminará &quot;{producto.nombre}&quot; y sus imágenes.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
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
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </form>
  );
}
