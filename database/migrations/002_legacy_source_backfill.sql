BEGIN;

-- Additive bridge only. Legacy tables remain untouched until explicit cutover.
CREATE TABLE IF NOT EXISTS legacy_source_mappings (
  legacy_document_id BIGINT PRIMARY KEY,
  canonical_source_id UUID NOT NULL UNIQUE REFERENCES sources(id) ON DELETE RESTRICT,
  legacy_sha256 CHAR(64) NOT NULL,
  migrated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (legacy_sha256 ~ '^[0-9a-f]{64}$')
);

CREATE TABLE IF NOT EXISTS legacy_fragment_mappings (
  legacy_chunk_id BIGINT PRIMARY KEY,
  canonical_fragment_id UUID NOT NULL UNIQUE REFERENCES source_fragments(id) ON DELETE RESTRICT,
  legacy_document_id BIGINT NOT NULL REFERENCES legacy_source_mappings(legacy_document_id) ON DELETE RESTRICT,
  migrated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS legacy_fragment_mappings_document_idx
  ON legacy_fragment_mappings(legacy_document_id);

-- Safety rules:
-- 1. Never mutate or delete legacy rows.
-- 2. Verify preserved original bytes/text against the legacy SHA when it is valid.
-- 3. Abort the transaction on a mismatch rather than silently accepting drift.
-- 4. Preserve an explicit legacy-id -> canonical-UUID bridge.
DO $$
DECLARE
  doc RECORD;
  canonical_id UUID;
  computed_hash TEXT;
  fragmenter CONSTANT TEXT := 'legacy-chunks-v1';
BEGIN
  IF to_regclass('public.source_documents') IS NULL THEN
    RAISE NOTICE 'source_documents does not exist; skipping legacy backfill';
    RETURN;
  END IF;

  FOR doc IN SELECT * FROM source_documents ORDER BY id LOOP
    IF EXISTS (SELECT 1 FROM legacy_source_mappings WHERE legacy_document_id = doc.id) THEN
      CONTINUE;
    END IF;

    IF COALESCE(doc.original_file_base64,'') <> '' THEN
      computed_hash := encode(digest(decode(doc.original_file_base64, 'base64'), 'sha256'), 'hex');
    ELSE
      computed_hash := encode(digest(convert_to(doc.original_text, 'UTF8'), 'sha256'), 'hex');
    END IF;

    IF doc.sha256 IS NOT NULL
       AND doc.sha256 ~ '^[0-9a-f]{64}$'
       AND doc.sha256 <> computed_hash THEN
      RAISE EXCEPTION 'Legacy source % hash mismatch: stored %, computed %', doc.id, doc.sha256, computed_hash;
    END IF;

    INSERT INTO sources(type,title,author,original_uri,mime_type,raw_content,content_hash,metadata)
    VALUES(
      'DOCUMENT', doc.title, COALESCE(doc.author,''), NULLIF(doc.source_url,''),
      COALESCE(NULLIF(doc.mime_type,''),'application/octet-stream'), doc.original_text, computed_hash,
      jsonb_build_object(
        'ingestion','legacy-backfill-v1',
        'legacyDocumentId',doc.id,
        'legacyFileName',doc.file_name,
        'legacyByteSize',doc.byte_size,
        'originalFilePreservedInLegacy', COALESCE(doc.original_file_base64,'') <> ''
      )
    )
    ON CONFLICT (content_hash) DO UPDATE SET content_hash = EXCLUDED.content_hash
    RETURNING id INTO canonical_id;

    INSERT INTO legacy_source_mappings(legacy_document_id,canonical_source_id,legacy_sha256)
    VALUES(doc.id,canonical_id,computed_hash);

    IF to_regclass('public.document_chunks') IS NOT NULL THEN
      INSERT INTO source_fragments(
        source_id,fragmenter_version,ordinal,fragment_key,content_hash,raw_text,start_offset,end_offset,metadata
      )
      SELECT
        canonical_id,
        fragmenter,
        c.chunk_index,
        encode(digest(convert_to(
          'eil.fragment.v1' || chr(31) || computed_hash || chr(31) || fragmenter || chr(31) ||
          c.chunk_index::text || chr(31) || c.start_char::text || chr(31) || c.end_char::text || chr(31) || c.content,
          'UTF8'
        ),'sha256'),'hex'),
        encode(digest(convert_to(c.content,'UTF8'),'sha256'),'hex'),
        c.content,
        c.start_char,
        c.end_char,
        jsonb_build_object('legacyChunkId',c.id,'legacyDocumentId',doc.id)
      FROM document_chunks c
      WHERE c.source_document_id = doc.id
      ORDER BY c.chunk_index
      ON CONFLICT (source_id,fragmenter_version,ordinal) DO NOTHING;

      INSERT INTO legacy_fragment_mappings(legacy_chunk_id,canonical_fragment_id,legacy_document_id)
      SELECT c.id,f.id,doc.id
      FROM document_chunks c
      JOIN source_fragments f
        ON f.source_id = canonical_id
       AND f.fragmenter_version = fragmenter
       AND f.ordinal = c.chunk_index
      WHERE c.source_document_id = doc.id
      ON CONFLICT (legacy_chunk_id) DO NOTHING;
    END IF;
  END LOOP;
END $$;

COMMIT;
