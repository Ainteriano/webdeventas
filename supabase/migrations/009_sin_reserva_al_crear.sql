-- La reserva de stock NO ocurre al iniciar el pedido.
-- Solo al completar la compra (subir comprobante) vía reservar_stock_pedido.
-- Desactivamos el uso de crear_pedido_con_reserva (queda disponible pero no se usa).

COMMENT ON FUNCTION crear_pedido_con_reserva(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, metodo_pago, JSONB
) IS 'DEPRECATED: no usar. El stock se reserva solo al subir comprobante.';
