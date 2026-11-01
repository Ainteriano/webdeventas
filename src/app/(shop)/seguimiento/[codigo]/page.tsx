import type { Metadata } from "next";
import { SeguimientoDetalle } from "@/components/storefront/seguimiento-detalle";

type Props = { params: { codigo: string } };

export function generateMetadata({ params }: Props): Metadata {
  return {
    title: `Pedido ${params.codigo.toUpperCase()}`,
    description: "Estado y detalle de tu pedido",
  };
}

export default function SeguimientoCodigoPage({ params }: Props) {
  const codigo = decodeURIComponent(params.codigo).toUpperCase();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
      <SeguimientoDetalle codigo={codigo} />
    </div>
  );
}
