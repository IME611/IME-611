BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE source_type AS ENUM ('DOCUMENT','ARTICLE','BOOK','IMAGE','VIDEO','AUDIO','WEB','NOTE','OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE claim_type AS ENUM ('FACTUAL','INTERPRETIVE','CAUSAL','NORMATIVE','DEFINITIONAL','EXPERIENTIAL','HYPOTHESIS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE claim_status AS ENUM ('EXTRACTED','REVIEWED','SUPPORTED','CHALLENGED','REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE evidence_relation AS ENUM ('SUPPORTS','CONTRADICTS','CONTEXTUALIZES');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE insight_status AS ENUM ('HYPOTHESIS','SUPPORTED','CHALLENGED','RETIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE experiment_status AS ENUM ('DRAFT','ACTIVE','COMPLETED','ABANDONED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type source_type NOT NULL DEFAULT 'DOCUMENT',
  title TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT '',
  original_uri TEXT,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  raw_content TEXT,
  original_bytes_uri TEXT,
  content_hash CHAR(64) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  immutable_original BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (content_hash ~ '^[0-9a-f]{64}$'),
  CHECK (immutable_original = TRUE),
  UNIQUE (content_hash)
);

CREATE INDEX IF NOT EXISTS sources_created_at_idx ON sources(created_at DESC);
CREATE INDEX IF NOT EXISTS sources_type_idx ON sources(type);
CREATE INDEX IF NOT EXISTS sources_metadata_gin_idx ON sources USING GIN(metadata);

CREATE OR REPLACE FUNCTION prevent_canonical_source_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_content IS DISTINCT FROM OLD.raw_content
     OR NEW.original_bytes_uri IS DISTINCT FROM OLD.original_bytes_uri
     OR NEW.content_hash IS DISTINCT FROM OLD.content_hash
     OR NEW.immutable_original IS DISTINCT FROM OLD.immutable_original THEN
    RAISE EXCEPTION 'canonical source payload is immutable; create a new source version instead';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sources_immutable_original_guard ON sources;
CREATE TRIGGER sources_immutable_original_guard
BEFORE UPDATE ON sources
FOR EACH ROW EXECUTE FUNCTION prevent_canonical_source_mutation();

CREATE TABLE IF NOT EXISTS source_fragments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
  fragmenter_version TEXT NOT NULL,
  ordinal INTEGER NOT NULL,
  fragment_key CHAR(64) NOT NULL,
  content_hash CHAR(64) NOT NULL,
  raw_text TEXT NOT NULL,
  start_offset INTEGER,
  end_offset INTEGER,
  page INTEGER,
  section TEXT,
  timestamp_start_ms BIGINT,
  timestamp_end_ms BIGINT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ordinal >= 0),
  CHECK (fragment_key ~ '^[0-9a-f]{64}$'),
  CHECK (content_hash ~ '^[0-9a-f]{64}$'),
  CHECK (start_offset IS NULL OR start_offset >= 0),
  CHECK (end_offset IS NULL OR end_offset >= 0),
  CHECK (start_offset IS NULL OR end_offset IS NULL OR end_offset >= start_offset),
  CHECK (page IS NULL OR page > 0),
  CHECK (timestamp_start_ms IS NULL OR timestamp_start_ms >= 0),
  CHECK (timestamp_end_ms IS NULL OR timestamp_end_ms >= 0),
  CHECK (timestamp_start_ms IS NULL OR timestamp_end_ms IS NULL OR timestamp_end_ms >= timestamp_start_ms),
  UNIQUE (fragment_key),
  UNIQUE (source_id, fragmenter_version, ordinal),
  UNIQUE (source_id, fragmenter_version, content_hash, start_offset, end_offset)
);

CREATE INDEX IF NOT EXISTS source_fragments_source_idx ON source_fragments(source_id, ordinal);
CREATE INDEX IF NOT EXISTS source_fragments_content_hash_idx ON source_fragments(content_hash);
CREATE INDEX IF NOT EXISTS source_fragments_fragmenter_idx ON source_fragments(source_id, fragmenter_version);
CREATE INDEX IF NOT EXISTS source_fragments_metadata_gin_idx ON source_fragments USING GIN(metadata);

CREATE TABLE IF NOT EXISTS claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  statement TEXT NOT NULL,
  normalized_hash CHAR(64) NOT NULL,
  type claim_type NOT NULL,
  status claim_status NOT NULL DEFAULT 'EXTRACTED',
  model_confidence NUMERIC(5,4),
  extraction_method TEXT NOT NULL DEFAULT 'unknown',
  model_version TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (normalized_hash ~ '^[0-9a-f]{64}$'),
  CHECK (model_confidence IS NULL OR (model_confidence >= 0 AND model_confidence <= 1)),
  UNIQUE (normalized_hash)
);

CREATE INDEX IF NOT EXISTS claims_type_status_idx ON claims(type, status);
CREATE INDEX IF NOT EXISTS claims_created_at_idx ON claims(created_at DESC);

CREATE TABLE IF NOT EXISTS concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (normalized_name)
);

CREATE TABLE IF NOT EXISTS concept_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  normalized_alias TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (normalized_alias)
);
CREATE INDEX IF NOT EXISTS concept_aliases_concept_idx ON concept_aliases(concept_id);

CREATE TABLE IF NOT EXISTS claim_concepts (
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  relevance NUMERIC(5,4) NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (relevance >= 0 AND relevance <= 1),
  PRIMARY KEY (claim_id, concept_id)
);
CREATE INDEX IF NOT EXISTS claim_concepts_concept_idx ON claim_concepts(concept_id, claim_id);

CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  fragment_id UUID NOT NULL REFERENCES source_fragments(id) ON DELETE RESTRICT,
  relation evidence_relation NOT NULL,
  evidence_strength NUMERIC(5,4) NOT NULL DEFAULT 1,
  extraction_method TEXT NOT NULL DEFAULT 'unknown',
  model_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (evidence_strength >= 0 AND evidence_strength <= 1),
  UNIQUE (claim_id, fragment_id, relation)
);
CREATE INDEX IF NOT EXISTS evidence_claim_idx ON evidence(claim_id, relation);
CREATE INDEX IF NOT EXISTS evidence_fragment_idx ON evidence(fragment_id);

CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_entity_type TEXT NOT NULL,
  from_entity_id UUID NOT NULL,
  to_entity_type TEXT NOT NULL,
  to_entity_id UUID NOT NULL,
  relation_type TEXT NOT NULL,
  model_confidence NUMERIC(5,4),
  status TEXT NOT NULL DEFAULT 'HYPOTHESIS',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (from_entity_type IN ('CLAIM','CONCEPT','INSIGHT')),
  CHECK (to_entity_type IN ('CLAIM','CONCEPT','INSIGHT')),
  CHECK (from_entity_type <> to_entity_type OR from_entity_id <> to_entity_id),
  CHECK (model_confidence IS NULL OR (model_confidence >= 0 AND model_confidence <= 1))
);
CREATE INDEX IF NOT EXISTS connections_from_idx ON connections(from_entity_type, from_entity_id);
CREATE INDEX IF NOT EXISTS connections_to_idx ON connections(to_entity_type, to_entity_id);
CREATE INDEX IF NOT EXISTS connections_relation_idx ON connections(relation_type);

CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  statement TEXT NOT NULL,
  normalized_hash CHAR(64) NOT NULL,
  status insight_status NOT NULL DEFAULT 'HYPOTHESIS',
  model_confidence NUMERIC(5,4),
  evidence_strength NUMERIC(5,4),
  extraction_method TEXT NOT NULL DEFAULT 'unknown',
  model_version TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (normalized_hash ~ '^[0-9a-f]{64}$'),
  CHECK (model_confidence IS NULL OR (model_confidence >= 0 AND model_confidence <= 1)),
  CHECK (evidence_strength IS NULL OR (evidence_strength >= 0 AND evidence_strength <= 1)),
  UNIQUE (normalized_hash)
);
CREATE INDEX IF NOT EXISTS insights_status_idx ON insights(status, created_at DESC);

CREATE TABLE IF NOT EXISTS experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_id UUID NOT NULL REFERENCES insights(id) ON DELETE RESTRICT,
  hypothesis TEXT NOT NULL,
  action TEXT NOT NULL,
  expected_signal TEXT NOT NULL,
  status experiment_status NOT NULL DEFAULT 'DRAFT',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (started_at IS NULL OR ended_at IS NULL OR ended_at >= started_at)
);
CREATE INDEX IF NOT EXISTS experiments_insight_idx ON experiments(insight_id, created_at DESC);
CREATE INDEX IF NOT EXISTS experiments_status_idx ON experiments(status);

CREATE TABLE IF NOT EXISTS reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  observation TEXT NOT NULL,
  outcome TEXT NOT NULL DEFAULT '',
  interpretation TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS reflections_experiment_idx ON reflections(experiment_id, created_at DESC);

CREATE TABLE IF NOT EXISTS provenance_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  derived_entity_type TEXT NOT NULL,
  derived_entity_id UUID NOT NULL,
  source_entity_type TEXT NOT NULL,
  source_entity_id UUID NOT NULL,
  relation TEXT NOT NULL,
  weight NUMERIC(5,4) NOT NULL DEFAULT 1,
  extraction_method TEXT NOT NULL DEFAULT 'unknown',
  model_version TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (derived_entity_type IN ('CLAIM','CONNECTION','INSIGHT','EXPERIMENT','REFLECTION')),
  CHECK (source_entity_type IN ('SOURCE','SOURCE_FRAGMENT','CLAIM','CONCEPT','EVIDENCE','CONNECTION','INSIGHT','EXPERIMENT','REFLECTION')),
  CHECK (weight >= 0 AND weight <= 1),
  CHECK (derived_entity_type <> source_entity_type OR derived_entity_id <> source_entity_id),
  UNIQUE (derived_entity_type, derived_entity_id, source_entity_type, source_entity_id, relation)
);
CREATE INDEX IF NOT EXISTS provenance_derived_idx ON provenance_edges(derived_entity_type, derived_entity_id);
CREATE INDEX IF NOT EXISTS provenance_source_idx ON provenance_edges(source_entity_type, source_entity_id);
CREATE INDEX IF NOT EXISTS provenance_relation_idx ON provenance_edges(relation);

-- Existing legacy tables remain untouched. Backfill/migration into this canonical model happens in 002+.

COMMIT;
