import Link from "next/link";
import type { ConfiguracionSitio } from "@/types/database";

export function SiteFooter({
  config,
}: {
  config: ConfiguracionSitio | null;
}) {
  return (
    <footer className="mt-16 border-t bg-secondary/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <p className="font-display text-lg">
            {config?.nombre_negocio || "Catálogo de Ventas"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {config?.direccion || "Dirección por confirmar"}
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">Horarios</p>
          <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
            {config?.horarios || "Consulta por WhatsApp"}
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <Link href="/catalogo" className="hover:text-primary">
            Catálogo
          </Link>
          <Link href="/ubicacion" className="hover:text-primary">
            Ubicación
          </Link>
          <Link href="/seguimiento" className="hover:text-primary">
            Seguimiento de pedido
          </Link>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {config?.nombre_negocio || "Catálogo"}
      </div>
    </footer>
  );
}
