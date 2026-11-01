-- Banco del cliente + reserva de stock al subir comprobante
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS banco TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS stock_reservado BOOLEAN NOT NULL DEFAULT FALSE;

-- Realtime para alertas del panel admin
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE pedidos;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

-- Reservar stock al subir comprobante (FOR UPDATE)
CREATE OR REPLACE FUNCTION reservar_stock_pedido(p_pedido_id UUID)
RETURNS pedidos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido pedidos%ROWTYPE;
  v_item RECORD;
  v_producto productos%ROWTYPE;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' AND NOT es_admin() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  SELECT * INTO v_pedido
  FROM pedidos
  WHERE id = p_pedido_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado';
  END IF;

  -- Ya reservado: no volver a descontar
  IF v_pedido.stock_reservado THEN
    RETURN v_pedido;
  END IF;

  FOR v_item IN
    SELECT * FROM pedido_items WHERE pedido_id = p_pedido_id
  LOOP
    IF v_item.producto_id IS NULL THEN
      CONTINUE;
    END IF;

    SELECT * INTO v_producto
    FROM productos
    WHERE id = v_item.producto_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Producto % no encontrado', v_item.nombre_snapshot;
    END IF;

    IF v_producto.stock < v_item.cantidad THEN
      RAISE EXCEPTION 'Stock insuficiente para "%": disponible %, solicitado %',
        v_producto.nombre, v_producto.stock, v_item.cantidad;
    END IF;

    UPDATE productos
    SET
      stock = stock - v_item.cantidad,
      disponible = CASE
        WHEN (stock - v_item.cantidad) <= 0 THEN FALSE
        ELSE disponible
      END
    WHERE id = v_producto.id;
  END LOOP;

  UPDATE pedidos
  SET stock_reservado = TRUE
  WHERE id = p_pedido_id
  RETURNING * INTO v_pedido;

  RETURN v_pedido;
END;
$$;

REVOKE ALL ON FUNCTION reservar_stock_pedido(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reservar_stock_pedido(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reservar_stock_pedido(UUID) TO service_role;

-- Liberar stock (rechazo / cancelación)
CREATE OR REPLACE FUNCTION liberar_stock_pedido(p_pedido_id UUID)
RETURNS pedidos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido pedidos%ROWTYPE;
  v_item RECORD;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' AND NOT es_admin() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  SELECT * INTO v_pedido
  FROM pedidos
  WHERE id = p_pedido_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado';
  END IF;

  IF NOT v_pedido.stock_reservado THEN
    RETURN v_pedido;
  END IF;

  FOR v_item IN
    SELECT * FROM pedido_items WHERE pedido_id = p_pedido_id
  LOOP
    IF v_item.producto_id IS NULL THEN
      CONTINUE;
    END IF;

    UPDATE productos
    SET
      stock = stock + v_item.cantidad,
      disponible = CASE
        WHEN stock + v_item.cantidad > 0 THEN TRUE
        ELSE disponible
      END
    WHERE id = v_item.producto_id;
  END LOOP;

  UPDATE pedidos
  SET stock_reservado = FALSE
  WHERE id = p_pedido_id
  RETURNING * INTO v_pedido;

  RETURN v_pedido;
END;
$$;

REVOKE ALL ON FUNCTION liberar_stock_pedido(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION liberar_stock_pedido(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION liberar_stock_pedido(UUID) TO service_role;

-- Confirmar: si ya hay reserva, solo cambia estado; si no, descuenta
CREATE OR REPLACE FUNCTION confirmar_pedido(p_pedido_id UUID)
RETURNS pedidos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido pedidos%ROWTYPE;
  v_item RECORD;
  v_producto productos%ROWTYPE;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' AND NOT es_admin() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  SELECT * INTO v_pedido
  FROM pedidos
  WHERE id = p_pedido_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado';
  END IF;

  IF v_pedido.estado NOT IN ('COMPROBANTE_SUBIDO', 'PENDIENTE_PAGO', 'RECHAZADO') THEN
    RAISE EXCEPTION 'El pedido no puede confirmarse desde el estado %', v_pedido.estado;
  END IF;

  -- Si no estaba reservado, descontar ahora
  IF NOT v_pedido.stock_reservado THEN
    FOR v_item IN
      SELECT * FROM pedido_items WHERE pedido_id = p_pedido_id
    LOOP
      IF v_item.producto_id IS NULL THEN
        CONTINUE;
      END IF;

      SELECT * INTO v_producto
      FROM productos
      WHERE id = v_item.producto_id
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Producto % no encontrado', v_item.nombre_snapshot;
      END IF;

      IF v_producto.stock < v_item.cantidad THEN
        RAISE EXCEPTION 'Stock insuficiente para "%": disponible %, solicitado %',
          v_producto.nombre, v_producto.stock, v_item.cantidad;
      END IF;

      UPDATE productos
      SET
        stock = stock - v_item.cantidad,
        disponible = CASE
          WHEN (stock - v_item.cantidad) <= 0 THEN FALSE
          ELSE disponible
        END
      WHERE id = v_producto.id;
    END LOOP;
  END IF;

  UPDATE pedidos
  SET estado = 'CONFIRMADO',
      motivo_rechazo = NULL,
      stock_reservado = TRUE
  WHERE id = p_pedido_id
  RETURNING * INTO v_pedido;

  RETURN v_pedido;
END;
$$;

-- Rechazar: libera stock reservado
CREATE OR REPLACE FUNCTION rechazar_pedido(p_pedido_id UUID, p_motivo TEXT)
RETURNS pedidos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido pedidos%ROWTYPE;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' AND NOT es_admin() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  IF p_motivo IS NULL OR length(trim(p_motivo)) = 0 THEN
    RAISE EXCEPTION 'El motivo de rechazo es obligatorio';
  END IF;

  -- Liberar reserva si existe
  PERFORM liberar_stock_pedido(p_pedido_id);

  UPDATE pedidos
  SET estado = 'RECHAZADO',
      motivo_rechazo = trim(p_motivo)
  WHERE id = p_pedido_id
    AND estado IN ('COMPROBANTE_SUBIDO', 'PENDIENTE_PAGO', 'RECHAZADO')
  RETURNING * INTO v_pedido;

  IF NOT FOUND THEN
    -- Intentar con estado actual tras liberar
    UPDATE pedidos
    SET estado = 'RECHAZADO',
        motivo_rechazo = trim(p_motivo)
    WHERE id = p_pedido_id
    RETURNING * INTO v_pedido;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado o no se puede rechazar';
  END IF;

  RETURN v_pedido;
END;
$$;

-- Cancelar también libera stock
CREATE OR REPLACE FUNCTION actualizar_estado_pedido(
  p_pedido_id UUID,
  p_estado estado_pedido
)
RETURNS pedidos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido pedidos%ROWTYPE;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' AND NOT es_admin() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  IF p_estado NOT IN ('ENVIADO', 'ENTREGADO', 'CANCELADO', 'CONFIRMADO') THEN
    RAISE EXCEPTION 'Estado no permitido vía esta función: %', p_estado;
  END IF;

  IF p_estado = 'CANCELADO' THEN
    PERFORM liberar_stock_pedido(p_pedido_id);
  END IF;

  IF p_estado = 'CONFIRMADO' THEN
    RETURN confirmar_pedido(p_pedido_id);
  END IF;

  UPDATE pedidos
  SET estado = p_estado
  WHERE id = p_pedido_id
  RETURNING * INTO v_pedido;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado';
  END IF;

  RETURN v_pedido;
END;
$$;
