"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Settings,
  LogOut,
  Menu,
  X,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logoutAdmin } from "@/app/gestion-privada/(panel)/actions";

const links = [
  { href: "", label: "Dashboard", icon: LayoutDashboard },
  { href: "/productos", label: "Productos", icon: Package },
  { href: "/categorias", label: "Categorías", icon: FolderTree },
  { href: "/pedidos", label: "Pedidos", icon: ShoppingBag },
  { href: "/configuracion", label: "Configuración", icon: Settings },
] as const;

export function AdminNav({ adminPath }: { adminPath: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    const full = `${adminPath}${href}`;
    if (href === "") return pathname === adminPath || pathname === `${adminPath}/`;
    return pathname.startsWith(full);
  }

  const nav = (
    <nav className="flex flex-col gap-1 p-3">
      <div className="mb-4 flex items-center gap-2 px-2 py-3">
        <Store className="h-5 w-5 text-primary" />
        <span className="font-semibold tracking-tight">Panel admin</span>
      </div>
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={`${adminPath}${href}`}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
            isActive(href)
              ? "bg-primary text-primary-foreground"
              : "text-foreground/80 hover:bg-muted"
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </Link>
      ))}
      <form action={logoutAdmin} className="mt-4 border-t pt-3">
        <Button
          type="submit"
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </form>
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r bg-card/80 md:block">
        <div className="sticky top-0 h-screen overflow-y-auto">{nav}</div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b bg-card/95 px-4 py-3 backdrop-blur md:hidden">
        <span className="font-semibold">Panel admin</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-card shadow-xl">
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
