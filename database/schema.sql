CREATE TABLE IF NOT EXISTS source_documents (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL DEFAULT '',
  mime_type TEXT NOT NULL DEFAULT 'text/plain',
  byte_size BIGINT NOT NULL DEFAULT 0,
  sha256 TEXT NOT NULL DEFAULT '',
  original_text TEXT NOT NULL,
  original_file_base64 TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS source_documents_sha256_idx ON source_documents(sha256) WHERE sha256 <> '';
CREATE INDEX IF NOT EXISTS source_documents_created_at_idx ON source_documents(created_at DESC);

CREATE TABLE IF NOT EXISTS knowledge_items (
  id BIGSERIAL PRIMARY KEY,
  source_document_id BIGINT REFERENCES source_documents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'ידע',
  content TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  source TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS source_document_id BIGINT REFERENCES source_documents(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS knowledge_items_created_at_idx ON knowledge_items(created_at DESC);
CREATE INDEX IF NOT EXISTS knowledge_items_kind_idx ON knowledge_items(kind);
CREATE INDEX IF NOT EXISTS knowledge_items_source_document_idx ON knowledge_items(source_document_id);

CREATE TABLE IF NOT EXISTS document_chunks (
  id BIGSERIAL PRIMARY KEY,
  source_document_id BIGINT NOT NULL REFERENCES source_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  start_char INTEGER NOT NULL DEFAULT 0,
  end_char INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(source_document_id, chunk_index)
);
CREATE INDEX IF NOT EXISTS document_chunks_source_idx ON document_chunks(source_document_id);

CREATE TABLE IF NOT EXISTS inbox_items (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS inbox_items_status_idx ON inbox_items(status);
CREATE INDEX IF NOT EXISTS inbox_items_created_at_idx ON inbox_items(created_at DESC);

CREATE TABLE IF NOT EXISTS knowledge_reviews (
  id BIGSERIAL PRIMARY KEY,
  knowledge_item_id BIGINT REFERENCES knowledge_items(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL CHECK (relation_type IN ('MATCH','EXTENSION','GAP','CONFLICT','NEW')),
  chapter_id INTEGER,
  category_id TEXT,
  score NUMERIC(8,3) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  note TEXT NOT NULL DEFAULT '',
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);
ALTER TABLE knowledge_reviews ADD COLUMN IF NOT EXISTS evidence JSONB NOT NULL DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS knowledge_reviews_item_idx ON knowledge_reviews(knowledge_item_id);
CREATE INDEX IF NOT EXISTS knowledge_reviews_status_idx ON knowledge_reviews(status);
CREATE INDEX IF NOT EXISTS knowledge_reviews_relation_idx ON knowledge_reviews(relation_type);

CREATE TABLE IF NOT EXISTS knowledge_topics (
  id BIGSERIAL PRIMARY KEY,
  item_id BIGINT REFERENCES knowledge_items(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  confidence NUMERIC(6,3) NOT NULL DEFAULT 0,
  UNIQUE(item_id,topic)
);
CREATE INDEX IF NOT EXISTS knowledge_topics_topic_idx ON knowledge_topics(topic);
