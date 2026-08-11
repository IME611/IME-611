-- Read-only verification for migration 002.
-- Expected: every query returns zero rows, except the summary query.

-- 1. Every mapped legacy source must resolve to a canonical source.
SELECT m.legacy_document_id
FROM legacy_source_mappings m
LEFT JOIN sources s ON s.id = m.canonical_source_id
WHERE s.id IS NULL;

-- 2. Canonical raw text must be byte-for-byte equal to preserved legacy extracted text.
SELECT m.legacy_document_id
FROM legacy_source_mappings m
JOIN source_documents d ON d.id = m.legacy_document_id
JOIN sources s ON s.id = m.canonical_source_id
WHERE s.raw_content IS DISTINCT FROM d.original_text;

-- 3. All legacy chunks must map to the exact canonical fragment text and offsets.
SELECT c.id AS legacy_chunk_id
FROM document_chunks c
JOIN legacy_fragment_mappings m ON m.legacy_chunk_id = c.id
JOIN source_fragments f ON f.id = m.canonical_fragment_id
WHERE f.raw_text IS DISTINCT FROM c.content
   OR f.ordinal IS DISTINCT FROM c.chunk_index
   OR f.start_offset IS DISTINCT FROM c.start_char
   OR f.end_offset IS DISTINCT FROM c.end_char;

-- 4. Detect missing chunk mappings.
SELECT c.id AS unmapped_legacy_chunk_id
FROM document_chunks c
LEFT JOIN legacy_fragment_mappings m ON m.legacy_chunk_id = c.id
WHERE m.legacy_chunk_id IS NULL;

-- 5. Summary for the migration report.
SELECT
  (SELECT COUNT(*) FROM source_documents) AS legacy_sources,
  (SELECT COUNT(*) FROM legacy_source_mappings) AS mapped_sources,
  (SELECT COUNT(*) FROM document_chunks) AS legacy_chunks,
  (SELECT COUNT(*) FROM legacy_fragment_mappings) AS mapped_fragments,
  (SELECT COUNT(*) FROM sources) AS canonical_sources,
  (SELECT COUNT(*) FROM source_fragments) AS canonical_fragments;
