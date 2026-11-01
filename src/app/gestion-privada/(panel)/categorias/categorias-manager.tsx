"use client";

import { useState, useTransition } from "react";
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
  Check,
  X,
} from "lucide-react";
import type { Categoria, Subcategoria } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(categorias.map((c) => [c.id, true]))
  );
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingSub, setEditingSub] = useState<string | null>(null);
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null);
  const [newCat, setNewCat] = useState("");
  const [newSub, setNewSub] = useState("");
  const [editName, setEditName] = useState("");

  function run(action: () => Promise<{ error?: string; ok?: boolean }>) {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res?.error) setError(res.error);
      else {
        setEditingCat(null);
        setEditingSub(null);
        setAddingSubFor(null);
        setNewCat("");
        setNewSub("");
        setEditName("");
      }
    });
  }

  function addCategoria() {
    const nombre = newCat.trim();
    if (!nombre) return;
    const fd = new FormData();
    fd.set("nombre", nombre);
    fd.set("orden", String(categorias.length));
    fd.set("activa", "true");
    run(() => crearCategoria(fd));
  }

  function addSub(categoriaId: string) {
    const nombre = newSub.trim();
    if (!nombre) return;
    const fd = new FormData();
    fd.set("categoria_id", categoriaId);
    fd.set("nombre", nombre);
    fd.set("orden", "0");
    run(() => crearSubcategoria(fd));
  }

  function saveCat(cat: Categoria) {
    const nombre = editName.trim();
    if (!nombre) return;
    const fd = new FormData();
    fd.set("id", cat.id);
    fd.set("nombre", nombre);
    fd.set("slug", cat.slug);
    fd.set("orden", String(cat.orden));
    fd.set("activa", cat.activa ? "true" : "false");
    run(() => actualizarCategoria(fd));
  }

  function saveSub(sub: Subcategoria, categoriaId: string) {
    const nombre = editName.trim();
    if (!nombre) return;
    const fd = new FormData();
    fd.set("id", sub.id);
    fd.set("categoria_id", categoriaId);
    fd.set("nombre", nombre);
    fd.set("slug", sub.slug);
    fd.set("orden", String(sub.orden));
    fd.set("activa", sub.activa ? "true" : "false");
    run(() => actualizarSubcategoria(fd));
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex gap-2 rounded-xl border bg-card p-2">
        <Input
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          placeholder="Nueva categoría"
          className="border-0 shadow-none focus-visible:ring-0"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCategoria();
            }
          }}
        />
        <Button
          type="button"
          size="icon"
          disabled={pending || !newCat.trim()}
          onClick={addCategoria}
          aria-label="Agregar"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <ul className="space-y-2">
        {categorias.map((cat) => {
          const open = expanded[cat.id] ?? true;
          return (
            <li key={cat.id} className="overflow-hidden rounded-xl border bg-card">
              <div className="flex items-center gap-1 px-2 py-2 sm:gap-2 sm:px-3">
                <button
                  type="button"
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() =>
                    setExpanded((s) => ({ ...s, [cat.id]: !open }))
                  }
                  aria-label={open ? "Cerrar" : "Abrir"}
                >
                  {open ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                {editingCat === cat.id ? (
                  <div className="flex min-w-0 flex-1 items-center gap-1">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          saveCat(cat);
                        }
                        if (e.key === "Escape") setEditingCat(null);
                      }}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      disabled={pending}
                      onClick={() => saveCat(cat)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setEditingCat(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      className="min-w-0 flex-1 truncate text-left font-medium"
                      onClick={() =>
                        setExpanded((s) => ({ ...s, [cat.id]: !open }))
                      }
                    >
                      {cat.nombre}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {cat.subcategorias.length}
                      </span>
                    </button>
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
                      className="h-8 w-8"
                      onClick={() => {
                        setAddingSubFor(cat.id);
                        setNewSub("");
                        setExpanded((s) => ({ ...s, [cat.id]: true }));
                      }}
                      aria-label="Subcategoría"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingCat(cat.id);
                        setEditName(cat.nombre);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {cat.nombre}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>No</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              run(() => eliminarCategoria(cat.id))
                            }
                          >
                            Sí
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>

              {open && (
                <div className="space-y-1 border-t bg-muted/25 px-2 py-2 sm:px-3">
                  {addingSubFor === cat.id && (
                    <div className="mb-1 flex gap-1 rounded-lg border bg-background p-1">
                      <Input
                        value={newSub}
                        onChange={(e) => setNewSub(e.target.value)}
                        placeholder="Subcategoría"
                        className="h-8 border-0 shadow-none focus-visible:ring-0"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSub(cat.id);
                          }
                          if (e.key === "Escape") setAddingSubFor(null);
                        }}
                      />
                      <Button
                        type="button"
                        size="icon"
                        className="h-8 w-8"
                        disabled={pending || !newSub.trim()}
                        onClick={() => addSub(cat.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setAddingSubFor(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {cat.subcategorias.length === 0 &&
                    addingSubFor !== cat.id && (
                      <p className="px-2 py-2 text-xs text-muted-foreground">
                        Sin subcategorías
                      </p>
                    )}

                  {cat.subcategorias.map((sub) =>
                    editingSub === sub.id ? (
                      <div
                        key={sub.id}
                        className="flex items-center gap-1 rounded-lg bg-background px-1 py-1"
                      >
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              saveSub(sub, cat.id);
                            }
                            if (e.key === "Escape") setEditingSub(null);
                          }}
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          disabled={pending}
                          onClick={() => saveSub(sub, cat.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setEditingSub(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        key={sub.id}
                        className="flex items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-background/80"
                      >
                        <span className="min-w-0 flex-1 truncate text-sm">
                          {sub.nombre}
                        </span>
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
                          className="h-7 w-7"
                          onClick={() => {
                            setEditingSub(sub.id);
                            setEditName(sub.nombre);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar?</AlertDialogTitle>
                              <AlertDialogDescription>
                                {sub.nombre}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>No</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  run(() => eliminarSubcategoria(sub.id))
                                }
                              >
                                Sí
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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
