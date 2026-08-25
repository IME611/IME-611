BEGIN;

ALTER TABLE source_publications
  ADD COLUMN IF NOT EXISTS target_learning_unit_title TEXT;

ALTER TABLE published_learning_cards
  ADD COLUMN IF NOT EXISTS learning_unit_title TEXT;

UPDATE source_publications
SET target_learning_unit_key='legacy-chapter:'||target_chapter::text
WHERE target_learning_unit_key IS NULL AND target_chapter IS NOT NULL;

UPDATE source_publications
SET target_learning_unit_title='פרק '||target_chapter::text
WHERE target_learning_unit_title IS NULL AND target_chapter IS NOT NULL;

UPDATE published_learning_cards
SET learning_unit_key='legacy-chapter:'||chapter_number::text
WHERE learning_unit_key IS NULL AND chapter_number IS NOT NULL;

UPDATE published_learning_cards
SET learning_unit_title='פרק '||chapter_number::text
WHERE learning_unit_title IS NULL AND chapter_number IS NOT NULL;

CREATE OR REPLACE FUNCTION eil_source_publication_legacy_unit_compat()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.target_learning_unit_key IS NULL AND NEW.target_chapter IS NOT NULL THEN
    NEW.target_learning_unit_key := 'legacy-chapter:'||NEW.target_chapter::text;
  END IF;
  IF NEW.target_learning_unit_title IS NULL AND NEW.target_chapter IS NOT NULL THEN
    NEW.target_learning_unit_title := 'פרק '||NEW.target_chapter::text;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS source_publications_legacy_unit_compat ON source_publications;
CREATE TRIGGER source_publications_legacy_unit_compat
BEFORE INSERT OR UPDATE ON source_publications
FOR EACH ROW EXECUTE FUNCTION eil_source_publication_legacy_unit_compat();

CREATE OR REPLACE FUNCTION eil_published_card_legacy_unit_compat()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.learning_unit_key IS NULL AND NEW.chapter_number IS NOT NULL THEN
    NEW.learning_unit_key := 'legacy-chapter:'||NEW.chapter_number::text;
  END IF;
  IF NEW.learning_unit_title IS NULL AND NEW.chapter_number IS NOT NULL THEN
    NEW.learning_unit_title := 'פרק '||NEW.chapter_number::text;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS published_learning_cards_legacy_unit_compat ON published_learning_cards;
CREATE TRIGGER published_learning_cards_legacy_unit_compat
BEFORE INSERT OR UPDATE ON published_learning_cards
FOR EACH ROW EXECUTE FUNCTION eil_published_card_legacy_unit_compat();

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
