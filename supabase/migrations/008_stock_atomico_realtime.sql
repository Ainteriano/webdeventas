-- Publicar productos para que el storefront vea stock/disponible en vivo
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE productos;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

-- Liberar pedidos abandonados (sin comprobante) tras 45 minutos
CREATE OR REPLACE FUNCTION liberar_pedidos_expirados(p_minutos INT DEFAULT 45)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
  v_count INT := 0;
BEGIN
  FOR v_row IN
    SELECT id
    FROM pedidos
    WHERE estado = 'PENDIENTE_PAGO'
      AND stock_reservado = TRUE
      AND created_at < NOW() - make_interval(mins => GREATEST(p_minutos, 5))
    FOR UPDATE SKIP LOCKED
  LOOP
    PERFORM liberar_stock_pedido(v_row.id);
    UPDATE pedidos
    SET estado = 'CANCELADO',
        motivo_rechazo = COALESCE(NULLIF(motivo_rechazo, ''), 'Expiró sin subir comprobante')
    WHERE id = v_row.id;
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION liberar_pedidos_expirados(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION liberar_pedidos_expirados(INT) TO service_role;

-- Crear pedido + reservar stock en UNA sola transacción (evita doble venta)
CREATE OR REPLACE FUNCTION crear_pedido_con_reserva(
  p_codigo TEXT,
  p_nombre TEXT,
  p_telefono TEXT,
  p_correo TEXT,
  p_direccion TEXT,
  p_notas TEXT,
  p_banco TEXT,
  p_metodo_pago metodo_pago,
  p_items JSONB
)
RETURNS pedidos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
  v_producto productos%ROWTYPE;
  v_cantidad INT;
  v_producto_id UUID;
  v_total NUMERIC(12, 2) := 0;
  v_pedido pedidos%ROWTYPE;
  v_lineas JSONB := '[]'::JSONB;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- Liberar abandonados antes de validar stock
  PERFORM liberar_pedidos_expirados(45);

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'El carrito está vacío';
  END IF;

  -- 1) Bloquear y validar todos los productos
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_producto_id := (v_item->>'producto_id')::UUID;
    v_cantidad := (v_item->>'cantidad')::INT;

    IF v_cantidad IS NULL OR v_cantidad < 1 THEN
      RAISE EXCEPTION 'Cantidad inválida';
    END IF;

    SELECT * INTO v_producto
    FROM productos
    WHERE id = v_producto_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Producto no encontrado';
    END IF;

    IF NOT v_producto.activo OR NOT v_producto.disponible THEN
      RAISE EXCEPTION 'Producto no disponible: %', v_producto.nombre;
    END IF;

    IF v_producto.stock < v_cantidad THEN
      RAISE EXCEPTION 'Stock insuficiente para "%": disponible %, solicitado %',
        v_producto.nombre, v_producto.stock, v_cantidad;
    END IF;

    v_total := v_total + (v_producto.precio * v_cantidad);
    v_lineas := v_lineas || jsonb_build_array(
      jsonb_build_object(
        'producto_id', v_producto.id,
        'nombre_snapshot', v_producto.nombre,
        'precio_snapshot', v_producto.precio,
        'cantidad', v_cantidad,
        'talla_snapshot', COALESCE(v_producto.talla, '')
      )
    );
  END LOOP;

  -- 2) Crear pedido
  INSERT INTO pedidos (
    codigo, nombre, telefono, correo, direccion, notas, banco,
    total, metodo_pago, estado, stock_reservado
  ) VALUES (
    p_codigo, p_nombre, p_telefono, p_correo,
    COALESCE(p_direccion, ''), COALESCE(p_notas, ''), COALESCE(p_banco, ''),
    v_total, p_metodo_pago, 'PENDIENTE_PAGO', TRUE
  )
  RETURNING * INTO v_pedido;

  -- 3) Items + descontar stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_lineas)
  LOOP
    INSERT INTO pedido_items (
      pedido_id, producto_id, nombre_snapshot, precio_snapshot, cantidad, talla_snapshot
    ) VALUES (
      v_pedido.id,
      (v_item->>'producto_id')::UUID,
      v_item->>'nombre_snapshot',
      (v_item->>'precio_snapshot')::NUMERIC,
      (v_item->>'cantidad')::INT,
      COALESCE(v_item->>'talla_snapshot', '')
    );

    UPDATE productos
    SET
      stock = stock - (v_item->>'cantidad')::INT,
      disponible = CASE
        WHEN stock - (v_item->>'cantidad')::INT <= 0 THEN FALSE
        ELSE disponible
      END
    WHERE id = (v_item->>'producto_id')::UUID;
  END LOOP;

  RETURN v_pedido;
END;
$$;

REVOKE ALL ON FUNCTION crear_pedido_con_reserva(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, metodo_pago, JSONB
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION crear_pedido_con_reserva(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, metodo_pago, JSONB
) TO service_role;
