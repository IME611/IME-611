BEGIN;

DO $$ BEGIN
  CREATE TYPE knowledge_atom_type AS ENUM (
    'CLAIM',
    'CONCEPT',
    'DEFINITION',
    'QUESTION',
    'MODEL',
    'EXAMPLE',
    'PRACTICE',
    'CREATOR_INSIGHT',
    'WORLDVIEW_CLAIM',
    'REFERENCE',
    'TENSION',
    'EDITORIAL_NOTE'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE extraction_review_status AS ENUM ('PENDING','APPROVED','REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE extraction_run_status AS ENUM ('RUNNING','COMPLETED','FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS extraction_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES sources(id) ON DELETE RESTRICT,
  scope TEXT NOT NULL DEFAULT 'SOURCE' CHECK (scope IN ('SOURCE','CORPUS')),
  extraction_method TEXT NOT NULL,
  extractor_version TEXT NOT NULL,
  status extraction_run_status NOT NULL DEFAULT 'RUNNING',
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  CHECK (completed_at IS NULL OR completed_at >= started_at)
);
CREATE INDEX IF NOT EXISTS extraction_runs_source_idx ON extraction_runs(source_id, started_at DESC);
CREATE INDEX IF NOT EXISTS extraction_runs_status_idx ON extraction_runs(status, started_at DESC);

CREATE TABLE IF NOT EXISTS extraction_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES extraction_runs(id) ON DELETE SET NULL,
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
  candidate_key CHAR(64) NOT NULL,
  atom_type knowledge_atom_type NOT NULL,
  claim_type claim_type,
  candidate_text TEXT NOT NULL,
  exact_quote TEXT NOT NULL,
  source_start INTEGER NOT NULL,
  source_end INTEGER NOT NULL,
  confidence NUMERIC(5,4) NOT NULL,
  review_status extraction_review_status NOT NULL DEFAULT 'PENDING',
  exclude_from_knowledge BOOLEAN NOT NULL DEFAULT FALSE,
  extraction_method TEXT NOT NULL,
  extractor_version TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (candidate_key ~ '^[0-9a-f]{64}$'),
  CHECK (length(trim(candidate_text)) > 0),
  CHECK (length(exact_quote) > 0),
  CHECK (source_start >= 0),
  CHECK (source_end > source_start),
  CHECK (confidence >= 0 AND confidence <= 1),
  CHECK ((review_status = 'PENDING' AND reviewed_at IS NULL) OR review_status <> 'PENDING'),
  UNIQUE(candidate_key, extractor_version)
);
CREATE INDEX IF NOT EXISTS extraction_candidates_source_idx ON extraction_candidates(source_id, source_start, source_end);
CREATE INDEX IF NOT EXISTS extraction_candidates_type_idx ON extraction_candidates(atom_type, review_status);
CREATE INDEX IF NOT EXISTS extraction_candidates_review_idx ON extraction_candidates(review_status, confidence DESC, created_at);
CREATE INDEX IF NOT EXISTS extraction_candidates_metadata_gin_idx ON extraction_candidates USING GIN(metadata);

CREATE TABLE IF NOT EXISTS extraction_candidate_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES extraction_candidates(id) ON DELETE CASCADE,
  fragment_id UUID NOT NULL REFERENCES source_fragments(id) ON DELETE RESTRICT,
  source_start INTEGER NOT NULL,
  source_end INTEGER NOT NULL,
  fragment_start INTEGER NOT NULL,
  fragment_end INTEGER NOT NULL,
  exact_quote TEXT NOT NULL,
  exact_quote_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (source_start >= 0),
  CHECK (source_end > source_start),
  CHECK (fragment_start >= 0),
  CHECK (fragment_end > fragment_start),
  CHECK (length(exact_quote) > 0),
  UNIQUE(candidate_id, fragment_id, source_start, source_end)
);
CREATE INDEX IF NOT EXISTS extraction_candidate_evidence_candidate_idx ON extraction_candidate_evidence(candidate_id);
CREATE INDEX IF NOT EXISTS extraction_candidate_evidence_fragment_idx ON extraction_candidate_evidence(fragment_id, candidate_id);

COMMIT;
