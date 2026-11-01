-- Habilitar RLS en TODAS las tablas
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE producto_imagenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_sitio ENABLE ROW LEVEL SECURITY;

-- ========== ADMINS ==========
-- Solo admins pueden ver la tabla admins
CREATE POLICY "admins_select_admin"
  ON admins FOR SELECT
  USING (es_admin());

CREATE POLICY "admins_insert_admin"
  ON admins FOR INSERT
  WITH CHECK (es_admin());

CREATE POLICY "admins_delete_admin"
  ON admins FOR DELETE
  USING (es_admin());

-- ========== CATEGORIAS ==========
CREATE POLICY "categorias_select_public"
  ON categorias FOR SELECT
  USING (activa = TRUE OR es_admin());

CREATE POLICY "categorias_insert_admin"
  ON categorias FOR INSERT
  WITH CHECK (es_admin());

CREATE POLICY "categorias_update_admin"
  ON categorias FOR UPDATE
  USING (es_admin())
  WITH CHECK (es_admin());

CREATE POLICY "categorias_delete_admin"
  ON categorias FOR DELETE
  USING (es_admin());

-- ========== SUBCATEGORIAS ==========
CREATE POLICY "subcategorias_select_public"
  ON subcategorias FOR SELECT
  USING (activa = TRUE OR es_admin());

CREATE POLICY "subcategorias_insert_admin"
  ON subcategorias FOR INSERT
  WITH CHECK (es_admin());

CREATE POLICY "subcategorias_update_admin"
  ON subcategorias FOR UPDATE
  USING (es_admin())
  WITH CHECK (es_admin());

CREATE POLICY "subcategorias_delete_admin"
  ON subcategorias FOR DELETE
  USING (es_admin());

-- ========== PRODUCTOS ==========
CREATE POLICY "productos_select_public"
  ON productos FOR SELECT
  USING (activo = TRUE OR es_admin());

CREATE POLICY "productos_insert_admin"
  ON productos FOR INSERT
  WITH CHECK (es_admin());

CREATE POLICY "productos_update_admin"
  ON productos FOR UPDATE
  USING (es_admin())
  WITH CHECK (es_admin());

CREATE POLICY "productos_delete_admin"
  ON productos FOR DELETE
  USING (es_admin());

-- ========== PRODUCTO_IMAGENES ==========
CREATE POLICY "producto_imagenes_select_public"
  ON producto_imagenes FOR SELECT
  USING (
    es_admin()
    OR EXISTS (
      SELECT 1 FROM productos p
      WHERE p.id = producto_imagenes.producto_id AND p.activo = TRUE
    )
  );

CREATE POLICY "producto_imagenes_insert_admin"
  ON producto_imagenes FOR INSERT
  WITH CHECK (es_admin());

CREATE POLICY "producto_imagenes_update_admin"
  ON producto_imagenes FOR UPDATE
  USING (es_admin())
  WITH CHECK (es_admin());

CREATE POLICY "producto_imagenes_delete_admin"
  ON producto_imagenes FOR DELETE
  USING (es_admin());

-- ========== PEDIDOS ==========
-- El público NO puede SELECT ni UPDATE/DELETE.
-- INSERT público deshabilitado a nivel RLS: solo service role / admin.
-- Creación de pedidos vía route handler con service role.
CREATE POLICY "pedidos_select_admin"
  ON pedidos FOR SELECT
  USING (es_admin());

CREATE POLICY "pedidos_insert_admin"
  ON pedidos FOR INSERT
  WITH CHECK (es_admin());

CREATE POLICY "pedidos_update_admin"
  ON pedidos FOR UPDATE
  USING (es_admin())
  WITH CHECK (es_admin());

CREATE POLICY "pedidos_delete_admin"
  ON pedidos FOR DELETE
  USING (es_admin());

-- ========== PEDIDO_ITEMS ==========
CREATE POLICY "pedido_items_select_admin"
  ON pedido_items FOR SELECT
  USING (es_admin());

CREATE POLICY "pedido_items_insert_admin"
  ON pedido_items FOR INSERT
  WITH CHECK (es_admin());

CREATE POLICY "pedido_items_update_admin"
  ON pedido_items FOR UPDATE
  USING (es_admin())
  WITH CHECK (es_admin());

CREATE POLICY "pedido_items_delete_admin"
  ON pedido_items FOR DELETE
  USING (es_admin());

-- ========== CONFIGURACION_SITIO ==========
-- Lectura pública de la configuración (datos no sensibles del negocio)
CREATE POLICY "config_select_public"
  ON configuracion_sitio FOR SELECT
  USING (TRUE);

CREATE POLICY "config_update_admin"
  ON configuracion_sitio FOR UPDATE
  USING (es_admin())
  WITH CHECK (es_admin());

CREATE POLICY "config_insert_admin"
  ON configuracion_sitio FOR INSERT
  WITH CHECK (es_admin());
