-- Talla del zapato (obligatoria en el flujo de admin)
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS talla TEXT NOT NULL DEFAULT '';

ALTER TABLE pedido_items
  ADD COLUMN IF NOT EXISTS talla_snapshot TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN productos.talla IS 'Talla del calzado (ej. 40, 8.5, 26 MX)';
