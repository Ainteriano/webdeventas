"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import type { Categoria, Producto, Subcategoria } from "@/types/database";

export function ProductosTabla({
  productos,
  categorias,
  subcategorias,
  adminPath,
  initialStockFilter = "all",
}: {
  productos: Producto[];
  categorias: Categoria[];
  subcategorias: Subcategoria[];
  adminPath: string;
  initialStockFilter?: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState(initialStockFilter);
  const [catMove, setCatMove] = useState("");
  const [subMove, setSubMove] = useState("");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return productos.filter((p) => {
      if (q && !p.nombre.toLowerCase().includes(q.trim().toLowerCase())) {
        return false;
      }
      if (catFilter !== "all" && p.categoria_id !== catFilter) return false;
      if (stockFilter === "0" && p.stock > 0) return false;
      if (stockFilter === "low" && p.stock > 5) return false;
      if (stockFilter === "ok" && p.stock <= 0) return false;
      return true;
    });
  }, [productos, q, catFilter, stockFilter]);

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
      const res = await edicionRapidaProducto({
        id,
        [field]: field === "stock" ? Math.floor(n) : n,
      });
      setMsg(res.error || "Guardado");
      if (!res.error) router.refresh();
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
      setMsg(res.error || `Movidos ${selected.length} productos`);
      if (!res.error) {
        setSelected([]);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <Input
          placeholder="Buscar producto…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="lg:max-w-xs"
        />
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="lg:w-48">
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
        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="lg:w-40">
            <SelectValue placeholder="Stock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo stock</SelectItem>
            <SelectItem value="0">Sin stock</SelectItem>
            <SelectItem value="low">≤ 5</SelectItem>
            <SelectItem value="ok">Con stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-3 sm:flex-row sm:flex-wrap sm:items-end">
          <p className="text-sm font-medium">{selected.length} seleccionados</p>
          <Select
            value={catMove}
            onValueChange={(v) => {
              setCatMove(v);
              setSubMove("");
            }}
          >
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Mover a categoría" />
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
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Subcategoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Sin subcategoría</SelectItem>
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
            Disponibles
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
            Desactivar
          </Button>
        </div>
      )}

      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}

      {/* Mobile */}
      <div className="space-y-3 md:hidden">
        {filtered.map((p) => (
          <div key={p.id} className="space-y-3 rounded-lg border bg-card p-3">
            <div className="flex items-start gap-2">
              <Checkbox
                checked={selected.includes(p.id)}
                onCheckedChange={() => toggleSelect(p.id)}
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`${adminPath}/productos/${p.id}`}
                  className="font-medium hover:underline"
                >
                  {p.nombre}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {p.categorias?.nombre || "—"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Precio</p>
                <Input
                  type="number"
                  step="0.01"
                  defaultValue={p.precio}
                  onBlur={(e) => saveRapido(p.id, "precio", e.target.value)}
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Stock</p>
                <Input
                  type="number"
                  defaultValue={p.stock}
                  onBlur={(e) => saveRapido(p.id, "stock", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span title="Visible en sitio, sin compra si está apagado">
                  Disponible compra
                </span>
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
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span title="Oculta del sitio si está apagado">En sitio</span>
                <Badge variant={p.activo ? "success" : "secondary"}>
                  {p.activo ? "Visible" : "Oculto"}
                </Badge>
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
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">Sin resultados.</p>
        )}
      </div>

      {/* Desktop */}
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="w-10 p-3">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(c) => toggleAll(!!c)}
                />
              </th>
              <th className="p-3">Producto</th>
              <th className="p-3">Categoría</th>
              <th className="p-3">Precio</th>
              <th className="p-3">Stock</th>
              <th
                className="p-3"
                title="Sigue visible en el sitio, sin precio y en gris"
              >
                Compra
              </th>
              <th
                className="p-3"
                title="Si está apagado, se oculta del sitio (no se borra)"
              >
                En sitio
              </th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b align-middle">
                <td className="p-3">
                  <Checkbox
                    checked={selected.includes(p.id)}
                    onCheckedChange={() => toggleSelect(p.id)}
                  />
                </td>
                <td className="p-3">
                  <Link
                    href={`${adminPath}/productos/${p.id}`}
                    className="font-medium hover:underline"
                  >
                    {p.nombre}
                  </Link>
                </td>
                <td className="p-3 text-muted-foreground">
                  {p.categorias?.nombre || "—"}
                </td>
                <td className="p-3">
                  <Input
                    type="number"
                    step="0.01"
                    defaultValue={p.precio}
                    className="h-8 w-28"
                    title={formatPrice(p.precio)}
                    onBlur={(e) => saveRapido(p.id, "precio", e.target.value)}
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
                  <div className="flex flex-wrap gap-1">
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`${adminPath}/productos/${p.id}`}>
                        Editar
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          Eliminar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            ¿Eliminar producto?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Se eliminará &quot;{p.nombre}&quot; y sus imágenes.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              startTransition(async () => {
                                await eliminarProducto(p.id);
                                router.refresh();
                              })
                            }
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="p-6 text-center text-muted-foreground"
                >
                  No hay productos con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
