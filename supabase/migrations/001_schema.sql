-- Extensiones
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE metodo_pago AS ENUM ('TRANSFERENCIA', 'LINK_PAGO');
CREATE TYPE estado_pedido AS ENUM (
  'PENDIENTE_PAGO',
  'COMPROBANTE_SUBIDO',
  'CONFIRMADO',
  'RECHAZADO',
  'ENVIADO',
  'ENTREGADO',
  'CANCELADO'
);

-- Admins (referencia a auth.users)
CREATE TABLE admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categorías
CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  orden INT NOT NULL DEFAULT 0,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subcategorías
CREATE TABLE subcategorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL,
  orden INT NOT NULL DEFAULT 0,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (categoria_id, slug)
);

-- Productos
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descripcion TEXT NOT NULL DEFAULT '',
  precio NUMERIC(12, 2) NOT NULL CHECK (precio >= 0),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
  subcategoria_id UUID REFERENCES subcategorias(id) ON DELETE SET NULL,
  disponible BOOLEAN NOT NULL DEFAULT TRUE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_subcategoria ON productos(subcategoria_id);
CREATE INDEX idx_productos_activo ON productos(activo) WHERE activo = TRUE;
CREATE INDEX idx_productos_nombre ON productos USING gin (to_tsvector('spanish', nombre));

-- Imágenes de producto
CREATE TABLE producto_imagenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  orden INT NOT NULL DEFAULT 0,
  es_principal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_producto_imagenes_producto ON producto_imagenes(producto_id);

-- Pedidos
CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  correo TEXT NOT NULL,
  direccion TEXT NOT NULL DEFAULT '',
  notas TEXT NOT NULL DEFAULT '',
  total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
  metodo_pago metodo_pago NOT NULL,
  estado estado_pedido NOT NULL DEFAULT 'PENDIENTE_PAGO',
  comprobante_path TEXT,
  motivo_rechazo TEXT,
  payment_url TEXT,
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pedidos_codigo ON pedidos(codigo);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pedidos_created ON pedidos(created_at DESC);

-- Items de pedido
CREATE TABLE pedido_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
  nombre_snapshot TEXT NOT NULL,
  precio_snapshot NUMERIC(12, 2) NOT NULL CHECK (precio_snapshot >= 0),
  cantidad INT NOT NULL CHECK (cantidad > 0)
);

CREATE INDEX idx_pedido_items_pedido ON pedido_items(pedido_id);

-- Configuración del sitio (una sola fila)
CREATE TABLE configuracion_sitio (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  nombre_negocio TEXT NOT NULL DEFAULT 'Mi Tienda',
  logo_url TEXT,
  whatsapp TEXT NOT NULL DEFAULT '',
  mensaje_whatsapp TEXT NOT NULL DEFAULT 'Hola, me interesa un producto de su catálogo',
  direccion TEXT NOT NULL DEFAULT '',
  maps_embed_url TEXT NOT NULL DEFAULT '',
  horarios TEXT NOT NULL DEFAULT '',
  datos_bancarios TEXT NOT NULL DEFAULT '',
  link_pago_activo BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO configuracion_sitio (id) VALUES (1);

-- Helper: generar código de pedido legible
CREATE OR REPLACE FUNCTION generar_codigo_pedido()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  codigo TEXT;
  existe BOOLEAN;
BEGIN
  LOOP
    codigo := 'PED-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 8));
    SELECT EXISTS(SELECT 1 FROM pedidos WHERE pedidos.codigo = codigo) INTO existe;
    EXIT WHEN NOT existe;
  END LOOP;
  RETURN codigo;
END;
$$;

-- Helper: ¿es admin?
CREATE OR REPLACE FUNCTION es_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()
  )
  OR COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', FALSE);
$$;

-- Trigger updated_at en pedidos
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER pedidos_updated_at
  BEFORE UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
