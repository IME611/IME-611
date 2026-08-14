BEGIN;

DO $$ BEGIN
  CREATE TYPE knowledge_relation_type AS ENUM (
    'IS_A','PART_OF','DEPENDS_ON','INFLUENCES','REGULATES','CAUSES_OR_CONTRIBUTES_TO',
    'CONTRADICTS','SUPPORTS','EXPLAINS','EXAMPLE_OF','APPLIES_TO','REFRAMES',
    'PREREQUISITE_FOR','REVISITED_BY'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE relation_evidence_mode AS ENUM ('EXPLICIT_LINGUISTIC');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE relation_endpoint_kind AS ENUM ('CONCEPT','SECTION_TOPIC','SOURCE_SPAN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS relation_extraction_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL DEFAULT 'CORPUS' CHECK (scope IN ('SOURCE','CORPUS')),
  source_id UUID REFERENCES sources(id) ON DELETE RESTRICT,
  extraction_method TEXT NOT NULL,
  extractor_version TEXT NOT NULL,
  status extraction_run_status NOT NULL DEFAULT 'RUNNING',
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  CHECK (completed_at IS NULL OR completed_at >= started_at),
  CHECK ((scope='SOURCE' AND source_id IS NOT NULL) OR (scope='CORPUS' AND source_id IS NULL))
);
CREATE INDEX IF NOT EXISTS relation_extraction_runs_status_idx ON relation_extraction_runs(status,started_at DESC);
CREATE INDEX IF NOT EXISTS relation_extraction_runs_version_idx ON relation_extraction_runs(scope,extractor_version,status,started_at DESC);

CREATE TABLE IF NOT EXISTS relation_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES relation_extraction_runs(id) ON DELETE SET NULL,
  relation_key CHAR(64) NOT NULL,
  relation_type knowledge_relation_type NOT NULL,
  source_atom_id UUID NOT NULL REFERENCES extraction_candidates(id) ON DELETE RESTRICT,
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
  from_node_key CHAR(64) NOT NULL,
  from_kind relation_endpoint_kind NOT NULL,
  from_label TEXT NOT NULL,
  from_resolution TEXT NOT NULL CHECK(from_resolution IN ('MAPPED','UNRESOLVED')),
  to_node_key CHAR(64) NOT NULL,
  to_kind relation_endpoint_kind NOT NULL,
  to_label TEXT NOT NULL,
  to_resolution TEXT NOT NULL CHECK(to_resolution IN ('MAPPED','UNRESOLVED')),
  endpoint_resolution TEXT NOT NULL CHECK(endpoint_resolution IN ('MAPPED','PARTIAL','UNRESOLVED')),
  evidence_mode relation_evidence_mode NOT NULL DEFAULT 'EXPLICIT_LINGUISTIC',
  cue TEXT NOT NULL,
  exact_quote TEXT NOT NULL,
  confidence NUMERIC(5,4) NOT NULL,
  review_status extraction_review_status NOT NULL DEFAULT 'PENDING',
  extractor_version TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (relation_key ~ '^[0-9a-f]{64}$'),
  CHECK (from_node_key ~ '^[0-9a-f]{64}$'),
  CHECK (to_node_key ~ '^[0-9a-f]{64}$'),
  CHECK (length(trim(from_label))>0 AND length(trim(to_label))>0),
  CHECK (from_node_key<>to_node_key),
  CHECK (length(trim(cue))>0 AND length(exact_quote)>0),
  CHECK (confidence>=0 AND confidence<=1),
  CHECK (
    (review_status='PENDING' AND reviewed_at IS NULL AND reviewed_by IS NULL)
    OR
    (review_status<>'PENDING' AND reviewed_at IS NOT NULL AND length(trim(COALESCE(reviewed_by,'')))>0)
  ),
  UNIQUE(relation_key,extractor_version)
);
CREATE INDEX IF NOT EXISTS relation_candidates_review_idx ON relation_candidates(review_status,confidence DESC,created_at);
CREATE INDEX IF NOT EXISTS relation_candidates_type_idx ON relation_candidates(relation_type,review_status);
CREATE INDEX IF NOT EXISTS relation_candidates_source_atom_idx ON relation_candidates(source_atom_id);
CREATE INDEX IF NOT EXISTS relation_candidates_source_idx ON relation_candidates(source_id,created_at DESC);
CREATE INDEX IF NOT EXISTS relation_candidates_from_idx ON relation_candidates(from_kind,from_node_key);
CREATE INDEX IF NOT EXISTS relation_candidates_to_idx ON relation_candidates(to_kind,to_node_key);
CREATE INDEX IF NOT EXISTS relation_candidates_resolution_idx ON relation_candidates(endpoint_resolution,review_status);
CREATE INDEX IF NOT EXISTS relation_candidates_metadata_gin_idx ON relation_candidates USING GIN(metadata);

COMMIT;
