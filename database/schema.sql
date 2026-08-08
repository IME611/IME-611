CREATE TABLE IF NOT EXISTS knowledge_items (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'ידע',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS knowledge_items_created_at_idx ON knowledge_items(created_at DESC);
