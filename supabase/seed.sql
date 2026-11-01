-- Seed de ejemplo (ejecutar después de migraciones)
-- Limpia datos de ejemplo previos opcionales

INSERT INTO configuracion_sitio (
  id, nombre_negocio, whatsapp, mensaje_whatsapp, direccion,
  maps_embed_url, horarios, datos_bancarios, link_pago_activo
) VALUES (
  1,
  'Catálogo Ventas',
  '5215512345678',
  'Hola, vi su catálogo y me interesa un producto',
  'Av. Reforma 123, Col. Centro, CDMX',
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.5!2d-99.1332!3d19.4326!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTnCsDI1JzU3LjQiTiA5OcKwMDcnNTkuNSJX!5e0!3m2!1ses!2smx!4v1',
  'Lun–Vie 9:00–18:00 · Sáb 10:00–14:00',
  E'Banco: BBVA\nTitular: Catálogo Ventas SA de CV\nCLABE: 012345678901234567\nCuenta: 1234567890\nConcepto: tu código de pedido',
  FALSE
)
ON CONFLICT (id) DO UPDATE SET
  nombre_negocio = EXCLUDED.nombre_negocio,
  whatsapp = EXCLUDED.whatsapp,
  mensaje_whatsapp = EXCLUDED.mensaje_whatsapp,
  direccion = EXCLUDED.direccion,
  maps_embed_url = EXCLUDED.maps_embed_url,
  horarios = EXCLUDED.horarios,
  datos_bancarios = EXCLUDED.datos_bancarios,
  link_pago_activo = EXCLUDED.link_pago_activo;

-- Categorías
INSERT INTO categorias (id, nombre, slug, orden, activa) VALUES
  ('a1000000-0000-4000-8000-000000000001', 'Electrónica', 'electronica', 1, TRUE),
  ('a1000000-0000-4000-8000-000000000002', 'Hogar', 'hogar', 2, TRUE),
  ('a1000000-0000-4000-8000-000000000003', 'Moda', 'moda', 3, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Subcategorías
INSERT INTO subcategorias (id, categoria_id, nombre, slug, orden, activa) VALUES
  ('b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'Audio', 'audio', 1, TRUE),
  ('b1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', 'Accesorios', 'accesorios', 2, TRUE),
  ('b1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000002', 'Cocina', 'cocina', 1, TRUE),
  ('b1000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000002', 'Decoración', 'decoracion', 2, TRUE),
  ('b1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000003', 'Hombre', 'hombre', 1, TRUE),
  ('b1000000-0000-4000-8000-000000000006', 'a1000000-0000-4000-8000-000000000003', 'Mujer', 'mujer', 2, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Productos
INSERT INTO productos (id, nombre, slug, descripcion, precio, stock, categoria_id, subcategoria_id, disponible, activo) VALUES
  ('c1000000-0000-4000-8000-000000000001', 'Audífonos Bluetooth Pro', 'audifonos-bluetooth-pro', 'Audífonos inalámbricos con cancelación de ruido y 30 h de batería.', 1299.00, 25, 'a1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', TRUE, TRUE),
  ('c1000000-0000-4000-8000-000000000002', 'Bocina Portátil Waterproof', 'bocina-portatil-waterproof', 'Bocina resistente al agua IPX7, ideal para exteriores.', 899.00, 40, 'a1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', TRUE, TRUE),
  ('c1000000-0000-4000-8000-000000000003', 'Cargador Rápido USB-C 65W', 'cargador-rapido-usbc-65w', 'Cargador GaN compatible con laptops y smartphones.', 449.00, 60, 'a1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000002', TRUE, TRUE),
  ('c1000000-0000-4000-8000-000000000004', 'Soporte Magnético para Auto', 'soporte-magnetico-auto', 'Soporte con imán de neodimio y rotación 360°.', 299.00, 80, 'a1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000002', TRUE, TRUE),
  ('c1000000-0000-4000-8000-000000000005', 'Set de Sartenes Antiadherentes', 'set-sartenes-antiadherentes', 'Juego de 3 sartenes con revestimiento cerámico.', 1599.00, 15, 'a1000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000003', TRUE, TRUE),
  ('c1000000-0000-4000-8000-000000000006', 'Licuadora de Alta Potencia', 'licuadora-alta-potencia', '1200 W, vaso de vidrio de 1.5 L y 6 velocidades.', 1899.00, 12, 'a1000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000003', TRUE, TRUE),
  ('c1000000-0000-4000-8000-000000000007', 'Lámpara de Mesa LED', 'lampara-mesa-led', 'Luz cálida regulable con puerto USB de carga.', 649.00, 30, 'a1000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000004', TRUE, TRUE),
  ('c1000000-0000-4000-8000-000000000008', 'Cojín Decorativo Lino', 'cojin-decorativo-lino', 'Fundas de lino 45×45 cm, varios colores.', 349.00, 50, 'a1000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000004', TRUE, TRUE),
  ('c1000000-0000-4000-8000-000000000009', 'Camisa Oxford Clásica', 'camisa-oxford-clasica', 'Camisa de algodón 100%, corte regular.', 799.00, 35, 'a1000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000005', TRUE, TRUE),
  ('c1000000-0000-4000-8000-000000000010', 'Blusa de Seda Natural', 'blusa-seda-natural', 'Blusa ligera de seda, ideal para oficina o evento.', 1199.00, 20, 'a1000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000006', TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Imágenes placeholder (picsum)
INSERT INTO producto_imagenes (producto_id, url, orden, es_principal) VALUES
  ('c1000000-0000-4000-8000-000000000001', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', 0, TRUE),
  ('c1000000-0000-4000-8000-000000000002', 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800', 0, TRUE),
  ('c1000000-0000-4000-8000-000000000003', 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800', 0, TRUE),
  ('c1000000-0000-4000-8000-000000000004', 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800', 0, TRUE),
  ('c1000000-0000-4000-8000-000000000005', 'https://images.unsplash.com/photo-1556911220-bff31c875dbb?w=800', 0, TRUE),
  ('c1000000-0000-4000-8000-000000000006', 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800', 0, TRUE),
  ('c1000000-0000-4000-8000-000000000007', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800', 0, TRUE),
  ('c1000000-0000-4000-8000-000000000008', 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800', 0, TRUE),
  ('c1000000-0000-4000-8000-000000000009', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800', 0, TRUE),
  ('c1000000-0000-4000-8000-000000000010', 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800', 0, TRUE)
ON CONFLICT DO NOTHING;
