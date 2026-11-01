import { describe, it, expect } from "vitest";

/**
 * Tests de la lógica de confirmación de pedido.
 * La función SQL real `confirmar_pedido` vive en Supabase;
 * aquí validamos el contrato y la lógica de stock equivalente.
 */

type Producto = { id: string; nombre: string; stock: number };
type Item = { producto_id: string; nombre_snapshot: string; cantidad: number };

function confirmarPedidoLocal(
  productos: Producto[],
  items: Item[],
  estado: string
): { ok: true; productos: Producto[] } | { ok: false; error: string } {
  if (!["COMPROBANTE_SUBIDO", "PENDIENTE_PAGO", "RECHAZADO"].includes(estado)) {
    return {
      ok: false,
      error: `El pedido no puede confirmarse desde el estado ${estado}`,
    };
  }

  const map = new Map(productos.map((p) => [p.id, { ...p }]));

  for (const item of items) {
    const p = map.get(item.producto_id);
    if (!p) {
      return { ok: false, error: `Producto ${item.nombre_snapshot} no encontrado` };
    }
    if (p.stock < item.cantidad) {
      return {
        ok: false,
        error: `Stock insuficiente para "${p.nombre}": disponible ${p.stock}, solicitado ${item.cantidad}`,
      };
    }
    p.stock -= item.cantidad;
  }

  return { ok: true, productos: [...map.values()] };
}

describe("confirmar_pedido (lógica de stock)", () => {
  const productos: Producto[] = [
    { id: "p1", nombre: "Audífonos", stock: 5 },
    { id: "p2", nombre: "Bocina", stock: 2 },
  ];

  it("descuenta stock correctamente", () => {
    const result = confirmarPedidoLocal(
      productos,
      [
        { producto_id: "p1", nombre_snapshot: "Audífonos", cantidad: 2 },
        { producto_id: "p2", nombre_snapshot: "Bocina", cantidad: 1 },
      ],
      "COMPROBANTE_SUBIDO"
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.productos.find((p) => p.id === "p1")?.stock).toBe(3);
      expect(result.productos.find((p) => p.id === "p2")?.stock).toBe(1);
    }
  });

  it("falla si no hay stock suficiente", () => {
    const result = confirmarPedidoLocal(
      productos,
      [{ producto_id: "p2", nombre_snapshot: "Bocina", cantidad: 5 }],
      "COMPROBANTE_SUBIDO"
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Stock insuficiente");
    }
  });

  it("falla desde estado no permitido", () => {
    const result = confirmarPedidoLocal(
      productos,
      [{ producto_id: "p1", nombre_snapshot: "Audífonos", cantidad: 1 }],
      "ENVIADO"
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("ENVIADO");
    }
  });

  it("permite confirmar desde RECHAZADO (reintento)", () => {
    const result = confirmarPedidoLocal(
      productos,
      [{ producto_id: "p1", nombre_snapshot: "Audífonos", cantidad: 1 }],
      "RECHAZADO"
    );
    expect(result.ok).toBe(true);
  });
});
