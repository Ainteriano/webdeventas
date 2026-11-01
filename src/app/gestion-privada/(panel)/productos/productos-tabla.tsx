"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  edicionRapidaProducto,
  eliminarProducto,
  moverProductos,
  toggleMasivo,
  toggleProducto,
} from "./actions";
import type { Categoria, Producto, ProductoImagen, Subcategoria } from "@/types/database";

type TriFilter = "all" | "yes" | "no";

function ChipGroup({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-lg border bg-card p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            value === opt.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function mainImage(p: Producto): string | null {
  const imgs = (p.producto_imagenes || []) as ProductoImagen[];
  if (!imgs.length) return null;
  const principal = imgs.find((i) => i.es_principal);
  return (principal || imgs[0])?.url || null;
}

export function ProductosTabla({
  productos,
  categorias,
  subcategorias,
  adminPath,
}: {
  productos: Producto[];
  categorias: Categoria[];
  subcategorias: Subcategoria[];
  adminPath: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [activoFilter, setActivoFilter] = useState<TriFilter>("all");
  const [dispFilter, setDispFilter] = useState<TriFilter>("all");
  const [catMove, setCatMove] = useState("");
  const [subMove, setSubMove] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return productos.filter((p) => {
      if (term && !p.nombre.toLowerCase().includes(term)) return false;
      if (catFilter !== "all" && p.categoria_id !== catFilter) return false;
      if (activoFilter === "yes" && !p.activo) return false;
      if (activoFilter === "no" && p.activo) return false;
      if (dispFilter === "yes" && !p.disponible) return false;
      if (dispFilter === "no" && p.disponible) return false;
      return true;
    });
  }, [productos, q, catFilter, activoFilter, dispFilter]);

  const subsForCat = subcategorias.filter((s) => s.categoria_id === catMove);
  const allSelected =
    filtered.length > 0 && filtered.every((p) => selected.includes(p.id));

  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? filtered.map((p) => p.id) : []);
  }

  function saveRapido(id: string, field: "precio" | "stock", value: string) {
    const n = Number(value);
    if (Number.isNaN(n) || n < 0) return;
    startTransition(async () => {
      await edicionRapidaProducto({
        id,
        [field]: field === "stock" ? Math.floor(n) : n,
      });
      router.refresh();
    });
  }

  function onMover() {
    if (!catMove || selected.length === 0) return;
    startTransition(async () => {
      const res = await moverProductos({
        producto_ids: selected,
        categoria_id: catMove,
        subcategoria_id: subMove || null,
      });
      if (!res.error) {
        setSelected([]);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="h-9 w-auto min-w-[140px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categorias.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Activo</span>
            <ChipGroup
              value={activoFilter}
              onChange={(v) => setActivoFilter(v as TriFilter)}
              options={[
                { value: "all", label: "Todos" },
                { value: "yes", label: "Sí" },
                { value: "no", label: "No" },
              ]}
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Disponible</span>
            <ChipGroup
              value={dispFilter}
              onChange={(v) => setDispFilter(v as TriFilter)}
              options={[
                { value: "all", label: "Todos" },
                { value: "yes", label: "Sí" },
                { value: "no", label: "No" },
              ]}
            />
          </div>

          <span className="ml-auto text-xs text-muted-foreground">
            {filtered.length} de {productos.length}
          </span>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5">
          <span className="text-sm font-medium">{selected.length}</span>
          <Select
            value={catMove}
            onValueChange={(v) => {
              setCatMove(v);
              setSubMove("");
            }}
          >
            <SelectTrigger className="h-8 w-40">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              {categorias.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={subMove || "__none__"}
            onValueChange={(v) => setSubMove(v === "__none__" ? "" : v)}
            disabled={!catMove}
          >
            <SelectTrigger className="h-8 w-40">
              <SelectValue placeholder="Subcategoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">—</SelectItem>
              {subsForCat.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pending || !catMove}
            onClick={onMover}
          >
            Mover
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await toggleMasivo(selected, "disponible", true);
                router.refresh();
              })
            }
          >
            Disponible
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await toggleMasivo(selected, "activo", true);
                router.refresh();
              })
            }
          >
            Activar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await toggleMasivo(selected, "activo", false);
                router.refresh();
              })
            }
          >
            Ocultar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setSelected([])}
          >
            ×
          </Button>
        </div>
      )}

      {/* Mobile cards */}
      <div className="space-y-2 md:hidden">
        {filtered.map((p) => {
          const img = mainImage(p);
          return (
            <div
              key={p.id}
              className="flex gap-3 rounded-xl border bg-card p-3"
            >
              <Checkbox
                checked={selected.includes(p.id)}
                onCheckedChange={() => toggleSelect(p.id)}
                className="mt-1"
              />
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`${adminPath}/productos/${p.id}`}
                      className="block truncate font-medium"
                    >
                      {p.nombre}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {p.categorias?.nombre || "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                      <Link href={`${adminPath}/productos/${p.id}`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {p.nombre}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>No</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              startTransition(async () => {
                                await eliminarProducto(p.id);
                                router.refresh();
                              })
                            }
                          >
                            Sí
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    defaultValue={p.precio}
                    className="h-8"
                    aria-label="Precio"
                    onBlur={(e) => saveRapido(p.id, "precio", e.target.value)}
                  />
                  <Input
                    type="number"
                    defaultValue={p.stock}
                    className="h-8"
                    aria-label="Stock"
                    onBlur={(e) => saveRapido(p.id, "stock", e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between gap-4 text-xs">
                  <label className="flex items-center gap-2">
                    <span className="text-muted-foreground">Disp.</span>
                    <Switch
                      checked={p.disponible}
                      disabled={pending}
                      onCheckedChange={(v) =>
                        startTransition(async () => {
                          await toggleProducto(p.id, "disponible", v);
                          router.refresh();
                        })
                      }
                    />
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="text-muted-foreground">Activo</span>
                    <Switch
                      checked={p.activo}
                      disabled={pending}
                      onCheckedChange={(v) =>
                        startTransition(async () => {
                          await toggleProducto(p.id, "activo", v);
                          router.refresh();
                        })
                      }
                    />
                  </label>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Sin resultados
          </p>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="w-10 p-3">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(c) => toggleAll(!!c)}
                />
              </th>
              <th className="p-3 font-medium">Producto</th>
              <th className="p-3 font-medium">Categoría</th>
              <th className="p-3 font-medium">Precio</th>
              <th className="p-3 font-medium">Stock</th>
              <th className="p-3 font-medium">Disp.</th>
              <th className="p-3 font-medium">Activo</th>
              <th className="w-24 p-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const img = mainImage(p);
              return (
                <tr
                  key={p.id}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="p-3">
                    <Checkbox
                      checked={selected.includes(p.id)}
                      onCheckedChange={() => toggleSelect(p.id)}
                    />
                  </td>
                  <td className="p-3">
                    <Link
                      href={`${adminPath}/productos/${p.id}`}
                      className="flex items-center gap-3"
                    >
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={img}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <span className="font-medium hover:underline">
                        {p.nombre}
                      </span>
                    </Link>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    <div>{p.categorias?.nombre || "—"}</div>
                    {p.subcategorias?.nombre && (
                      <div className="text-xs">{p.subcategorias.nombre}</div>
                    )}
                  </td>
                  <td className="p-3">
                    <Input
                      type="number"
                      step="0.01"
                      defaultValue={p.precio}
                      className="h-8 w-28"
                      onBlur={(e) =>
                        saveRapido(p.id, "precio", e.target.value)
                      }
                    />
                  </td>
                  <td className="p-3">
                    <Input
                      type="number"
                      defaultValue={p.stock}
                      className="h-8 w-20"
                      onBlur={(e) => saveRapido(p.id, "stock", e.target.value)}
                    />
                  </td>
                  <td className="p-3">
                    <Switch
                      checked={p.disponible}
                      disabled={pending}
                      onCheckedChange={(v) =>
                        startTransition(async () => {
                          await toggleProducto(p.id, "disponible", v);
                          router.refresh();
                        })
                      }
                    />
                  </td>
                  <td className="p-3">
                    <Switch
                      checked={p.activo}
                      disabled={pending}
                      onCheckedChange={(v) =>
                        startTransition(async () => {
                          await toggleProducto(p.id, "activo", v);
                          router.refresh();
                        })
                      }
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-0.5">
                      <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                        <Link href={`${adminPath}/productos/${p.id}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {p.nombre}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>No</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                startTransition(async () => {
                                  await eliminarProducto(p.id);
                                  router.refresh();
                                })
                              }
                            >
                              Sí
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="p-10 text-center text-muted-foreground"
                >
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
