-- Orden manual de obras en galería e inicio
ALTER TABLE artworks
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Conservar el orden actual (más recientes primero → sort_order 0, 1, 2…)
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      ORDER BY published_at DESC NULLS LAST, created_at DESC
    ) - 1 AS rn
  FROM artworks
)
UPDATE artworks
SET sort_order = ranked.rn
FROM ranked
WHERE artworks.id = ranked.id;
