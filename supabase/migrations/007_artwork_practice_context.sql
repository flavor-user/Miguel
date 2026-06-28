-- Marco y práctica por obra (en lugar del panel general)
ALTER TABLE artworks
  ADD COLUMN IF NOT EXISTS practice_context TEXT;
