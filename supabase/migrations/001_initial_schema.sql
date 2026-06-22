-- Flavor User v1 — esquema completo
-- Ejecutar en Supabase SQL Editor o con supabase db push

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── Perfiles ───────────────────────────────────────────────
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  flavor_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Conversaciones ─────────────────────────────────────────
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Nueva conversación',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Memoria persistente ────────────────────────────────────
CREATE TABLE user_memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL CHECK (memory_type IN ('preference', 'dislike', 'fact', 'context')),
  content TEXT NOT NULL,
  source_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  embedding vector(1536),
  importance REAL NOT NULL DEFAULT 0.5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- ─── Obras artísticas (galería) ─────────────────────────────
CREATE TABLE artworks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  year INT,
  medium TEXT,
  description TEXT,
  essay TEXT,
  image_url TEXT NOT NULL,
  image_alt TEXT,
  source_url TEXT,
  tags TEXT[] DEFAULT '{}',
  embedding vector(1536),
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE artwork_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artwork_id UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Conceptos y relaciones ─────────────────────────────────
CREATE TABLE concepts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE concept_relations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  concept_a_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  concept_b_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL DEFAULT 'related'
    CHECK (relation_type IN ('related', 'parent', 'influenced_by', 'opposite')),
  weight REAL NOT NULL DEFAULT 1.0,
  UNIQUE (concept_a_id, concept_b_id, relation_type)
);

CREATE TABLE artwork_concepts (
  artwork_id UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  relevance REAL NOT NULL DEFAULT 1.0,
  PRIMARY KEY (artwork_id, concept_id)
);

CREATE TABLE user_concept_interests (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  strength REAL NOT NULL DEFAULT 1.0,
  PRIMARY KEY (user_id, concept_id)
);

-- ─── Índices ────────────────────────────────────────────────
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_user_memories_user ON user_memories(user_id);
CREATE INDEX idx_artworks_published ON artworks(is_published, published_at DESC);
CREATE INDEX idx_artworks_slug ON artworks(slug);
CREATE INDEX idx_concepts_slug ON concepts(slug);

CREATE INDEX idx_user_memories_embedding ON user_memories
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_artworks_embedding ON artworks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_concepts_embedding ON concepts
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ─── Trigger: perfil al registrarse ─────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Trigger: updated_at ────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER artworks_updated_at BEFORE UPDATE ON artworks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Row Level Security ─────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE artwork_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE artwork_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_concept_interests ENABLE ROW LEVEL SECURITY;

-- Perfiles
CREATE POLICY "Usuarios ven su perfil" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Usuarios editan su perfil" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Conversaciones y mensajes
CREATE POLICY "Usuarios ven sus conversaciones" ON conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios crean conversaciones" ON conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios editan sus conversaciones" ON conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuarios borran sus conversaciones" ON conversations FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Usuarios ven mensajes de sus conversaciones" ON messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));
CREATE POLICY "Usuarios crean mensajes en sus conversaciones" ON messages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));

-- Memorias
CREATE POLICY "Usuarios ven sus memorias" ON user_memories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios crean memorias" ON user_memories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios editan sus memorias" ON user_memories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuarios borran sus memorias" ON user_memories FOR DELETE USING (auth.uid() = user_id);

-- Obras: galería pública + gestión privada
CREATE POLICY "Cualquiera ve obras publicadas" ON artworks FOR SELECT
  USING (is_published = true OR auth.uid() = user_id);
CREATE POLICY "Usuarios crean obras" ON artworks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios editan sus obras" ON artworks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuarios borran sus obras" ON artworks FOR DELETE USING (auth.uid() = user_id);

-- Notas personales
CREATE POLICY "Usuarios ven sus notas" ON artwork_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios crean notas" ON artwork_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios editan sus notas" ON artwork_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuarios borran sus notas" ON artwork_notes FOR DELETE USING (auth.uid() = user_id);

-- Conceptos: lectura pública, escritura solo service role (API)
CREATE POLICY "Cualquiera lee conceptos" ON concepts FOR SELECT USING (true);
CREATE POLICY "Cualquiera lee relaciones" ON concept_relations FOR SELECT USING (true);
CREATE POLICY "Cualquiera lee artwork_concepts" ON artwork_concepts FOR SELECT USING (true);

CREATE POLICY "Usuarios ven sus intereses" ON user_concept_interests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios gestionan sus intereses" ON user_concept_interests FOR ALL USING (auth.uid() = user_id);

-- ─── Funciones de búsqueda semántica ────────────────────────
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding vector(1536),
  match_user_id UUID,
  match_count INT DEFAULT 8
)
RETURNS TABLE (id UUID, content TEXT, memory_type TEXT, similarity FLOAT)
LANGUAGE sql STABLE AS $$
  SELECT m.id, m.content, m.memory_type,
    1 - (m.embedding <=> query_embedding) AS similarity
  FROM user_memories m
  WHERE m.user_id = match_user_id AND m.embedding IS NOT NULL
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION match_artworks(
  query_embedding vector(1536),
  match_count INT DEFAULT 6,
  only_published BOOLEAN DEFAULT true
)
RETURNS TABLE (id UUID, slug TEXT, title TEXT, artist TEXT, description TEXT, image_url TEXT, similarity FLOAT)
LANGUAGE sql STABLE AS $$
  SELECT a.id, a.slug, a.title, a.artist, a.description, a.image_url,
    1 - (a.embedding <=> query_embedding) AS similarity
  FROM artworks a
  WHERE a.embedding IS NOT NULL
    AND (NOT only_published OR a.is_published = true)
  ORDER BY a.embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION match_concepts(
  query_embedding vector(1536),
  match_count INT DEFAULT 8
)
RETURNS TABLE (id UUID, slug TEXT, name TEXT, description TEXT, similarity FLOAT)
LANGUAGE sql STABLE AS $$
  SELECT c.id, c.slug, c.name, c.description,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM concepts c
  WHERE c.embedding IS NOT NULL
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ─── Datos semilla: conceptos base ───────────────────────────
INSERT INTO concepts (name, slug, description) VALUES
  ('Impresionismo', 'impresionismo', 'Movimiento que captura la luz y el instante con pinceladas sueltas.'),
  ('Barroco', 'barroco', 'Estilo dramático de contrastes, movimiento y emoción intensa.'),
  ('Abstracción', 'abstraccion', 'Arte que no representa la realidad de forma figurativa.'),
  ('Surrealismo', 'surrealismo', 'Exploración del inconsciente, sueños y lo irracional.'),
  ('Chiaroscuro', 'chiaroscuro', 'Contraste marcado entre luz y sombra.'),
  ('Color', 'color', 'Uso expresivo o simbólico del color en la composición.'),
  ('Retrato', 'retrato', 'Representación de una persona o grupo.'),
  ('Paisaje', 'paisaje', 'Representación de entornos naturales o urbanos.')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO concept_relations (concept_a_id, concept_b_id, relation_type, weight)
SELECT a.id, b.id, 'related', 0.9
FROM concepts a, concepts b
WHERE a.slug = 'impresionismo' AND b.slug = 'color'
ON CONFLICT DO NOTHING;

INSERT INTO concept_relations (concept_a_id, concept_b_id, relation_type, weight)
SELECT a.id, b.id, 'related', 0.85
FROM concepts a, concepts b
WHERE a.slug = 'barroco' AND b.slug = 'chiaroscuro'
ON CONFLICT DO NOTHING;
