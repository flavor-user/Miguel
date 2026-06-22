-- Dimensiones reales de imagen + eliminar obras de prueba (Unsplash / demo)

ALTER TABLE artworks
  ADD COLUMN IF NOT EXISTS image_width INT,
  ADD COLUMN IF NOT EXISTS image_height INT;

-- Borrar relaciones y obras de demostración
DELETE FROM artwork_concepts
WHERE artwork_id IN (
  SELECT id FROM artworks
  WHERE slug IN (
    'impresion-amanecer',
    'la-noche-estrellada',
    'composicion-roja-azul',
    'las-meninas'
  )
  OR image_url ILIKE '%unsplash.com%'
  OR image_url ILIKE '%images.unsplash%'
);

DELETE FROM artworks
WHERE slug IN (
  'impresion-amanecer',
  'la-noche-estrellada',
  'composicion-roja-azul',
  'las-meninas'
)
OR image_url ILIKE '%unsplash.com%'
OR image_url ILIKE '%images.unsplash%';
