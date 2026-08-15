BEGIN;

DO $$ BEGIN
  CREATE TYPE intake_review_status AS ENUM ('PENDING','APPROVED','REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS intake_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  input_kind TEXT NOT NULL CHECK (input_kind IN ('TEXT','TOPIC','NOTE','URL','FILE','IMAGE')),
  title TEXT NOT NULL DEFAULT '',
  source_url TEXT,
  file_name TEXT,
  mime_type TEXT,
  extracted_text TEXT NOT NULL,
  original_bytes BYTEA,
  original_bytes_sha256 CHAR(64),
  extracted_text_sha256 CHAR(64) NOT NULL,
  analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  review_status intake_review_status NOT NULL DEFAULT 'PENDING',
  decision_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  review_note TEXT,
  approved_source_id UUID REFERENCES sources(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (length(trim(extracted_text)) > 0),
  CHECK (extracted_text_sha256 ~ '^[0-9a-f]{64}$'),
  CHECK (original_bytes_sha256 IS NULL OR original_bytes_sha256 ~ '^[0-9a-f]{64}$'),
  CHECK (
    (review_status='PENDING' AND reviewed_at IS NULL AND reviewed_by IS NULL)
    OR
    (review_status<>'PENDING' AND reviewed_at IS NOT NULL AND length(trim(COALESCE(reviewed_by,'')))>0)
  )
);

CREATE INDEX IF NOT EXISTS intake_submissions_review_idx ON intake_submissions(review_status, created_at DESC);
CREATE INDEX IF NOT EXISTS intake_submissions_text_hash_idx ON intake_submissions(extracted_text_sha256);
CREATE INDEX IF NOT EXISTS intake_submissions_source_idx ON intake_submissions(approved_source_id);
CREATE INDEX IF NOT EXISTS intake_submissions_analysis_gin_idx ON intake_submissions USING GIN(analysis);

COMMIT;
