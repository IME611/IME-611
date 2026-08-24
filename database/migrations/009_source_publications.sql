BEGIN;

CREATE TABLE IF NOT EXISTS source_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL UNIQUE REFERENCES sources(id) ON DELETE RESTRICT,
  intake_submission_id UUID REFERENCES intake_submissions(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'REPOSITORY_ONLY'
    CHECK (status IN ('REPOSITORY_ONLY','DRAFT','PUBLISHED')),
  target_chapter INTEGER CHECK (target_chapter BETWEEN 1 AND 18),
  selected_candidate_ids UUID[] NOT NULL DEFAULT '{}',
  draft_cards JSONB NOT NULL DEFAULT '[]'::jsonb,
  review_note TEXT NOT NULL DEFAULT '',
  publication_version INTEGER NOT NULL DEFAULT 0 CHECK (publication_version >= 0),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  published_at TIMESTAMPTZ,
  published_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (jsonb_typeof(draft_cards) = 'array'),
  CHECK (
    status <> 'PUBLISHED'
    OR (
      target_chapter IS NOT NULL
      AND cardinality(selected_candidate_ids) > 0
      AND jsonb_array_length(draft_cards) > 0
      AND published_at IS NOT NULL
      AND length(trim(COALESCE(published_by,''))) > 0
    )
  )
);

CREATE INDEX IF NOT EXISTS source_publications_status_idx
  ON source_publications(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS source_publications_chapter_idx
  ON source_publications(target_chapter, status, published_at DESC);
CREATE INDEX IF NOT EXISTS source_publications_intake_idx
  ON source_publications(intake_submission_id);

CREATE TABLE IF NOT EXISTS published_learning_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id UUID NOT NULL REFERENCES source_publications(id) ON DELETE RESTRICT,
  publication_version INTEGER NOT NULL CHECK (publication_version > 0),
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
  chapter_number INTEGER NOT NULL CHECK (chapter_number BETWEEN 1 AND 18),
  card_order INTEGER NOT NULL CHECK (card_order > 0),
  card_type TEXT NOT NULL CHECK (card_type IN ('OPENER','CONCEPT','EXAMPLE','REFLECTION','SUMMARY')),
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 2 AND 180),
  card_text TEXT NOT NULL CHECK (length(trim(card_text)) > 0),
  source_candidate_ids UUID[] NOT NULL CHECK (cardinality(source_candidate_ids) > 0),
  source_label TEXT NOT NULL DEFAULT '',
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('PUBLISHED','RETRACTED')),
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_by TEXT NOT NULL CHECK (length(trim(published_by)) > 0),
  retracted_at TIMESTAMPTZ,
  retracted_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (cardinality(regexp_split_to_array(trim(card_text), E'\\s+')) BETWEEN 40 AND 90),
  CHECK (
    (status='PUBLISHED' AND retracted_at IS NULL AND retracted_by IS NULL)
    OR
    (status='RETRACTED' AND retracted_at IS NOT NULL AND length(trim(COALESCE(retracted_by,''))) > 0)
  ),
  UNIQUE(publication_id, publication_version, chapter_number, card_order)
);

CREATE INDEX IF NOT EXISTS published_learning_cards_chapter_idx
  ON published_learning_cards(chapter_number, status, published_at, card_order);
CREATE INDEX IF NOT EXISTS published_learning_cards_publication_idx
  ON published_learning_cards(publication_id, publication_version, status);
CREATE INDEX IF NOT EXISTS published_learning_cards_source_idx
  ON published_learning_cards(source_id, status);
CREATE INDEX IF NOT EXISTS published_learning_cards_provenance_gin_idx
  ON published_learning_cards USING GIN(provenance);

INSERT INTO source_publications(source_id,intake_submission_id,status)
SELECT i.approved_source_id,i.id,'REPOSITORY_ONLY'
FROM intake_submissions i
WHERE i.review_status='APPROVED'
  AND i.approved_source_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM extraction_candidates c
    WHERE c.source_id=i.approved_source_id
      AND COALESCE((c.metadata->>'intakeApprovedSource')::boolean,FALSE)=TRUE
  )
ON CONFLICT(source_id) DO NOTHING;

COMMIT;
