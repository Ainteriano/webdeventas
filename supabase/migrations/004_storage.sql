-- Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'productos',
    'productos',
    TRUE,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
  ),
  (
    'comprobantes',
    'comprobantes',
    FALSE,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ========== BUCKET productos (público lectura, escritura admin) ==========
CREATE POLICY "productos_storage_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'productos');

CREATE POLICY "productos_storage_insert_admin"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'productos' AND public.es_admin());

CREATE POLICY "productos_storage_update_admin"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'productos' AND public.es_admin())
  WITH CHECK (bucket_id = 'productos' AND public.es_admin());

CREATE POLICY "productos_storage_delete_admin"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'productos' AND public.es_admin());

-- ========== BUCKET comprobantes (privado) ==========
-- Lectura solo admin (URLs firmadas desde el servidor)
CREATE POLICY "comprobantes_storage_select_admin"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'comprobantes' AND public.es_admin());

-- Insert: se hace con service role desde el route handler.
-- Política adicional para admin por si sube desde el panel.
CREATE POLICY "comprobantes_storage_insert_admin"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'comprobantes' AND public.es_admin());

CREATE POLICY "comprobantes_storage_update_admin"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'comprobantes' AND public.es_admin())
  WITH CHECK (bucket_id = 'comprobantes' AND public.es_admin());

CREATE POLICY "comprobantes_storage_delete_admin"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'comprobantes' AND public.es_admin());
