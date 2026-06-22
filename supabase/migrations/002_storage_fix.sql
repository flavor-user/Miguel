-- Reparación: ejecutar si 002_storage.sql dio error de "policy already exists"
-- Es seguro ejecutarlo aunque partes ya existan.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'artworks',
  'artworks',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

DROP POLICY IF EXISTS "Imágenes públicas de obras" ON storage.objects;
DROP POLICY IF EXISTS "Admin sube imágenes de obras" ON storage.objects;
DROP POLICY IF EXISTS "Admin actualiza imágenes de obras" ON storage.objects;
DROP POLICY IF EXISTS "Admin borra imágenes de obras" ON storage.objects;

CREATE POLICY "Imágenes públicas de obras"
ON storage.objects FOR SELECT
USING (bucket_id = 'artworks');

CREATE POLICY "Admin sube imágenes de obras"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'artworks');

CREATE POLICY "Admin actualiza imágenes de obras"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'artworks');

CREATE POLICY "Admin borra imágenes de obras"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'artworks');
