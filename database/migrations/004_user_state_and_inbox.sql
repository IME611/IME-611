BEGIN;

CREATE TABLE IF NOT EXISTS inbox_items (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (status IN ('new','reviewed','archived'))
);
CREATE INDEX IF NOT EXISTS inbox_items_status_created_idx ON inbox_items(status, created_at DESC);

CREATE TABLE IF NOT EXISTS user_crystals (
  owner_id UUID NOT NULL,
  fragment_id TEXT NOT NULL,
  concept_id TEXT NOT NULL DEFAULT '',
  topic TEXT NOT NULL DEFAULT '',
  subtopic TEXT NOT NULL DEFAULT '',
  text_snapshot TEXT NOT NULL,
  source_label TEXT NOT NULL DEFAULT '',
  provenance_label TEXT NOT NULL DEFAULT '',
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (owner_id, fragment_id)
);
CREATE INDEX IF NOT EXISTS user_crystals_owner_saved_idx ON user_crystals(owner_id, saved_at DESC);
CREATE INDEX IF NOT EXISTS user_crystals_owner_topic_idx ON user_crystals(owner_id, topic, subtopic);

CREATE TABLE IF NOT EXISTS user_taxonomy_assignments (
  owner_id UUID NOT NULL,
  fragment_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  subtopic TEXT NOT NULL DEFAULT '',
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (owner_id, fragment_id)
);
CREATE INDEX IF NOT EXISTS user_taxonomy_owner_topic_idx ON user_taxonomy_assignments(owner_id, topic_id, approved);

COMMIT;
