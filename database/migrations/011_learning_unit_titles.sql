BEGIN;

ALTER TABLE source_publications
  ADD COLUMN IF NOT EXISTS target_learning_unit_title TEXT;

ALTER TABLE published_learning_cards
  ADD COLUMN IF NOT EXISTS learning_unit_title TEXT;

UPDATE source_publications
SET target_learning_unit_title='פרק '||target_chapter::text
WHERE target_learning_unit_title IS NULL AND target_chapter IS NOT NULL;

UPDATE published_learning_cards
SET learning_unit_title='פרק '||chapter_number::text
WHERE learning_unit_title IS NULL AND chapter_number IS NOT NULL;

ALTER TABLE source_publications
  DROP CONSTRAINT IF EXISTS source_publications_unit_title_v1;
ALTER TABLE source_publications
  ADD CONSTRAINT source_publications_unit_title_v1 CHECK (
    target_learning_unit_title IS NULL
    OR length(trim(target_learning_unit_title)) BETWEEN 2 AND 180
  );

ALTER TABLE published_learning_cards
  DROP CONSTRAINT IF EXISTS published_learning_cards_unit_title_v1;
ALTER TABLE published_learning_cards
  ADD CONSTRAINT published_learning_cards_unit_title_v1 CHECK (
    learning_unit_title IS NULL
    OR length(trim(learning_unit_title)) BETWEEN 2 AND 180
  );

CREATE INDEX IF NOT EXISTS source_publications_learning_unit_title_idx
  ON source_publications(target_learning_unit_title,status,updated_at DESC);

CREATE INDEX IF NOT EXISTS published_learning_cards_unit_title_idx
  ON published_learning_cards(learning_unit_key,learning_unit_title,status,published_at DESC);

COMMIT;
