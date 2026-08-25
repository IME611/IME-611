BEGIN;

-- Legacy compatibility storage is still supported for authenticated callers,
-- but schema creation must never happen inside an HTTP request.
CREATE TABLE IF NOT EXISTS knowledge_reviews (
  id BIGSERIAL PRIMARY KEY,
  knowledge_item_id BIGINT REFERENCES knowledge_items(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
  chapter_id INTEGER,
  category_id TEXT,
  score NUMERIC(8,3) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS knowledge_reviews_item_created_idx
  ON knowledge_reviews(knowledge_item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS knowledge_reviews_status_created_idx
  ON knowledge_reviews(status, created_at DESC);

COMMIT;
