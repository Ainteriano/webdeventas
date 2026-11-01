"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import type { Categoria, Subcategoria } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  crearSubcategoria,
  actualizarSubcategoria,
  eliminarSubcategoria,
  toggleCategoriaActiva,
  toggleSubcategoriaActiva,
} from "./actions";

type CatConSubs = Categoria & { subcategorias: Subcategoria[] };

export function CategoriasManager({
  categorias,
}: {
  categorias: CatConSubs[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingSub, setEditingSub] = useState<string | null>(null);
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null);

  function run(action: () => Promise<{ error?: string; ok?: boolean }>) {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res?.error) setError(res.error);
      else {
        setEditingCat(null);
        setEditingSub(null);
        setAddingSubFor(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <form
        className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          run(() => crearCategoria(fd));
          e.currentTarget.reset();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="nueva-cat">Nueva categoría</Label>
          <Input id="nueva-cat" name="nombre" required placeholder="Nombre" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="orden-cat">Orden</Label>
          <Input
            id="orden-cat"
            name="orden"
            type="number"
            min={0}
            defaultValue={0}
            className="w-24"
          />
        </div>
        <input type="hidden" name="activa" value="true" />
        <Button type="submit" disabled={pending}>
          <Plus className="h-4 w-4" />
          Agregar
        </Button>
      </form>

      <ul className="space-y-3">
        {categorias.map((cat) => {
          const open = expanded[cat.id] ?? true;
          return (
            <li key={cat.id} className="rounded-lg border bg-card">
              <div className="flex flex-wrap items-center gap-2 p-3 sm:gap-3">
                <button
                  type="button"
                  className="rounded p-1 hover:bg-muted"
                  onClick={() =>
                    setExpanded((s) => ({ ...s, [cat.id]: !open }))
                  }
                  aria-label={open ? "Colapsar" : "Expandir"}
                >
                  {open ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                {editingCat === cat.id ? (
                  <form
                    className="flex flex-1 flex-wrap items-end gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      run(() => actualizarCategoria(fd));
                    }}
                  >
                    <input type="hidden" name="id" value={cat.id} />
                    <Input
                      name="nombre"
                      defaultValue={cat.nombre}
                      required
                      className="min-w-[140px] flex-1"
                    />
                    <Input
                      name="slug"
                      defaultValue={cat.slug}
                      className="w-36"
                    />
                    <Input
                      name="orden"
                      type="number"
                      defaultValue={cat.orden}
                      className="w-20"
                    />
                    <input
                      type="hidden"
                      name="activa"
                      value={cat.activa ? "true" : "false"}
                    />
                    <Button type="submit" size="sm" disabled={pending}>
                      Guardar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingCat(null)}
                    >
                      Cancelar
                    </Button>
                  </form>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{cat.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        /{cat.slug} · orden {cat.orden}
                      </p>
                    </div>
                    <Badge variant={cat.activa ? "success" : "secondary"}>
                      {cat.activa ? "Activa" : "Inactiva"}
                    </Badge>
                    <Switch
                      checked={cat.activa}
                      disabled={pending}
                      onCheckedChange={(v) =>
                        run(() => toggleCategoriaActiva(cat.id, v))
                      }
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditingCat(cat.id)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button type="button" size="icon" variant="ghost">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Se eliminará &quot;{cat.nombre}&quot; y sus
                            subcategorías. No debe tener productos asociados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              run(() => eliminarCategoria(cat.id))
                            }
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setAddingSubFor(cat.id)}
                    >
                      <Plus className="h-4 w-4" />
                      Sub
                    </Button>
                  </>
                )}
              </div>

              {open && (
                <div className="space-y-2 border-t bg-muted/30 p-3">
                  {addingSubFor === cat.id && (
                    <form
                      className="mb-2 grid gap-2 rounded-md border bg-background p-3 sm:grid-cols-[1fr_auto_auto]"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        run(() => crearSubcategoria(fd));
                      }}
                    >
                      <input type="hidden" name="categoria_id" value={cat.id} />
                      <Input name="nombre" required placeholder="Subcategoría" />
                      <Input
                        name="orden"
                        type="number"
                        defaultValue={0}
                        className="w-24"
                      />
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={pending}>
                          Guardar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setAddingSubFor(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  )}

                  {cat.subcategorias.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Sin subcategorías
                    </p>
                  ) : (
                    cat.subcategorias.map((sub) =>
                      editingSub === sub.id ? (
                        <form
                          key={sub.id}
                          className="flex flex-wrap items-end gap-2 rounded-md border bg-background p-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const fd = new FormData(e.currentTarget);
                            run(() => actualizarSubcategoria(fd));
                          }}
                        >
                          <input type="hidden" name="id" value={sub.id} />
                          <input
                            type="hidden"
                            name="categoria_id"
                            value={cat.id}
                          />
                          <Input
                            name="nombre"
                            defaultValue={sub.nombre}
                            required
                            className="min-w-[120px] flex-1"
                          />
                          <Input
                            name="slug"
                            defaultValue={sub.slug}
                            className="w-32"
                          />
                          <Input
                            name="orden"
                            type="number"
                            defaultValue={sub.orden}
                            className="w-20"
                          />
                          <input
                            type="hidden"
                            name="activa"
                            value={sub.activa ? "true" : "false"}
                          />
                          <Button type="submit" size="sm" disabled={pending}>
                            Guardar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingSub(null)}
                          >
                            Cancelar
                          </Button>
                        </form>
                      ) : (
                        <div
                          key={sub.id}
                          className="flex flex-wrap items-center gap-2 rounded-md border bg-background px-3 py-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{sub.nombre}</p>
                            <p className="text-xs text-muted-foreground">
                              /{sub.slug}
                            </p>
                          </div>
                          <Switch
                            checked={sub.activa}
                            disabled={pending}
                            onCheckedChange={(v) =>
                              run(() => toggleSubcategoriaActiva(sub.id, v))
                            }
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditingSub(sub.id)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button type="button" size="icon" variant="ghost">
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  ¿Eliminar subcategoría?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Se eliminará &quot;{sub.nombre}&quot;.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    run(() => eliminarSubcategoria(sub.id))
                                  }
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )
                    )
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
