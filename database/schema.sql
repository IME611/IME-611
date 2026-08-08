CREATE TABLE IF NOT EXISTS eil_items (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'ידע',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS eil_items_created_at_idx ON eil_items(created_at DESC);
