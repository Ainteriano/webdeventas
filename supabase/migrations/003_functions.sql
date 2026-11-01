-- Función transaccional: confirmar pedido y descontar stock con FOR UPDATE
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
  -- service_role bypassa RLS; autenticados deben ser admin
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
  SET estado = 'CONFIRMADO',
      motivo_rechazo = NULL
  WHERE id = p_pedido_id
  RETURNING * INTO v_pedido;

  RETURN v_pedido;
END;
$$;

REVOKE ALL ON FUNCTION confirmar_pedido(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION confirmar_pedido(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION confirmar_pedido(UUID) TO service_role;

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

  UPDATE pedidos
  SET estado = 'RECHAZADO',
      motivo_rechazo = trim(p_motivo)
  WHERE id = p_pedido_id
    AND estado IN ('COMPROBANTE_SUBIDO', 'PENDIENTE_PAGO')
  RETURNING * INTO v_pedido;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado o no se puede rechazar';
  END IF;

  RETURN v_pedido;
END;
$$;

REVOKE ALL ON FUNCTION rechazar_pedido(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rechazar_pedido(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION rechazar_pedido(UUID, TEXT) TO service_role;

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

REVOKE ALL ON FUNCTION actualizar_estado_pedido(UUID, estado_pedido) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION actualizar_estado_pedido(UUID, estado_pedido) TO authenticated;
GRANT EXECUTE ON FUNCTION actualizar_estado_pedido(UUID, estado_pedido) TO service_role;
