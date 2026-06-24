-- Recuerda desde qué obra entra el visitante al chat
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_artwork_slug TEXT,
  ADD COLUMN IF NOT EXISTS last_artwork_title TEXT;

CREATE TABLE IF NOT EXISTS user_artwork_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  artwork_slug TEXT NOT NULL,
  artwork_title TEXT NOT NULL,
  last_visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, artwork_slug)
);

CREATE INDEX IF NOT EXISTS user_artwork_visits_user_idx
  ON user_artwork_visits (user_id, last_visited_at DESC);

ALTER TABLE user_artwork_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven sus visitas a obras"
  ON user_artwork_visits FOR SELECT
  USING (auth.uid() = user_id);
