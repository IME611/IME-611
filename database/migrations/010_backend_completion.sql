BEGIN;

ALTER TABLE source_publications
  ADD COLUMN IF NOT EXISTS target_learning_unit_key TEXT;

ALTER TABLE published_learning_cards
  ADD COLUMN IF NOT EXISTS learning_unit_key TEXT;

UPDATE source_publications
SET target_learning_unit_key='legacy-chapter:'||target_chapter::text
WHERE target_learning_unit_key IS NULL AND target_chapter IS NOT NULL;

UPDATE published_learning_cards
SET learning_unit_key='legacy-chapter:'||chapter_number::text
WHERE learning_unit_key IS NULL AND chapter_number IS NOT NULL;

DO $$
DECLARE item RECORD;
BEGIN
  FOR item IN
    SELECT conname FROM pg_constraint
    WHERE conrelid='source_publications'::regclass
      AND contype='c'
      AND pg_get_constraintdef(oid) ILIKE '%target_chapter%'
  LOOP
    EXECUTE format('ALTER TABLE source_publications DROP CONSTRAINT %I',item.conname);
  END LOOP;
END $$;

DO $$
DECLARE item RECORD;
BEGIN
  FOR item IN
    SELECT conname FROM pg_constraint
    WHERE conrelid='published_learning_cards'::regclass
      AND contype='c'
      AND pg_get_constraintdef(oid) ILIKE '%chapter_number%'
  LOOP
    EXECUTE format('ALTER TABLE published_learning_cards DROP CONSTRAINT %I',item.conname);
  END LOOP;
END $$;

ALTER TABLE published_learning_cards
  ALTER COLUMN chapter_number DROP NOT NULL;

ALTER TABLE source_publications
  ADD CONSTRAINT source_publications_published_ready_v2 CHECK (
    status <> 'PUBLISHED'
    OR (
      target_learning_unit_key IS NOT NULL
      AND length(trim(target_learning_unit_key)) BETWEEN 2 AND 240
      AND cardinality(selected_candidate_ids) > 0
      AND jsonb_array_length(draft_cards) > 0
      AND published_at IS NOT NULL
      AND length(trim(COALESCE(published_by,''))) > 0
    )
  );

ALTER TABLE published_learning_cards
  ADD CONSTRAINT published_learning_cards_unit_key_v2 CHECK (
    length(trim(COALESCE(learning_unit_key,''))) BETWEEN 2 AND 240
  );

CREATE INDEX IF NOT EXISTS source_publications_learning_unit_idx
  ON source_publications(target_learning_unit_key,status,updated_at DESC);

CREATE INDEX IF NOT EXISTS published_learning_cards_unit_idx
  ON published_learning_cards(learning_unit_key,status,published_at,card_order);

CREATE UNIQUE INDEX IF NOT EXISTS published_learning_cards_unit_version_order_uidx
  ON published_learning_cards(publication_id,publication_version,learning_unit_key,card_order);

COMMIT;
